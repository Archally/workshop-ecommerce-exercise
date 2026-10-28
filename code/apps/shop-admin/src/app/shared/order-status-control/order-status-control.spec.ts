import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OrderStatusControl } from './order-status-control';
import { ActivityLogService } from '../../core/activity-log/activity-log.service';
import { Order } from '../../core/orders/order';

describe('OrderStatusControl', () => {
  let httpMock: HttpTestingController;

  const baseOrder: Order = {
    id: 'order-1',
    customerId: 'customer-1',
    items: [],
    totalAmount: 100,
    status: 'pending',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('offers "Advance to confirmed" and "Cancel order" for a pending order', () => {
    const fixture = TestBed.createComponent(OrderStatusControl);
    fixture.componentRef.setInput('order', baseOrder);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Advance to confirmed');
    expect(text).toContain('Cancel order');
  });

  it('offers no controls once delivered', () => {
    const fixture = TestBed.createComponent(OrderStatusControl);
    fixture.componentRef.setInput('order', { ...baseOrder, status: 'delivered' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No further status change');
  });

  it('offers only Advance, no Cancel, once cancelled is not reachable (already cancelled)', () => {
    const fixture = TestBed.createComponent(OrderStatusControl);
    fixture.componentRef.setInput('order', { ...baseOrder, status: 'cancelled' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No further status change');
  });

  it('advancing calls PUT /orders/:id/status, records a transition, flashes, and emits the update', () => {
    const fixture = TestBed.createComponent(OrderStatusControl);
    fixture.componentRef.setInput('order', baseOrder);
    fixture.detectChanges();

    const log = TestBed.inject(ActivityLogService);
    let emitted: Order | undefined;
    fixture.componentInstance.changed.subscribe((order) => (emitted = order));

    const advanceButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (btn) => (btn as HTMLButtonElement).textContent?.includes('Advance to confirmed'),
    ) as HTMLButtonElement;
    advanceButton.click();

    const request = httpMock.expectOne('http://localhost:3002/orders/order-1/status');
    expect(request.request.body).toEqual({ status: 'confirmed' });
    request.flush({ ...baseOrder, status: 'confirmed' });

    expect(emitted?.status).toBe('confirmed');
    expect(log.recent()[0].transition).toEqual({ from: 'pending', to: 'confirmed' });
    expect(log.lastChange()?.entityId).toBe('order-1');
  });

  it('shows the service error message when the update fails', () => {
    const fixture = TestBed.createComponent(OrderStatusControl);
    fixture.componentRef.setInput('order', baseOrder);
    fixture.detectChanges();

    const advanceButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (btn) => (btn as HTMLButtonElement).textContent?.includes('Advance to confirmed'),
    ) as HTMLButtonElement;
    advanceButton.click();

    httpMock
      .expectOne('http://localhost:3002/orders/order-1/status')
      .flush({ error: 'Valid status is required' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Valid status is required');
  });
});
