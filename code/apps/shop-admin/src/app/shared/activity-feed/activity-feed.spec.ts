import { TestBed } from '@angular/core/testing';
import { ActivityFeed } from './activity-feed';
import { ActivityLogService } from '../../core/activity-log/activity-log.service';

describe('ActivityFeed', () => {
  it('shows the empty state with no entries', async () => {
    TestBed.configureTestingModule({ imports: [ActivityFeed] });
    const fixture = TestBed.createComponent(ActivityFeed);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nothing yet');
  });

  it('renders a recorded info entry message', async () => {
    TestBed.configureTestingModule({ imports: [ActivityFeed] });
    const log = TestBed.inject(ActivityLogService);
    log.record('info', 'Priced 10 x "Widget": $199.99 base -> $189.99 each.');

    const fixture = TestBed.createComponent(ActivityFeed);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Priced 10 x "Widget": $199.99 base -> $189.99 each.',
    );
  });

  it('renders a transition entry as a dim old-status chip and a full new-status pill', async () => {
    TestBed.configureTestingModule({ imports: [ActivityFeed] });
    const log = TestBed.inject(ActivityLogService);
    log.record('transition', 'Order order-1:', { from: 'pending', to: 'confirmed' });

    const fixture = TestBed.createComponent(ActivityFeed);
    await fixture.whenStable();
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('.feed__item--transition') as HTMLElement;
    expect(item).toBeTruthy();
    expect(item.querySelector('.pill--muted')?.textContent?.trim()).toBe('pending');
    expect(item.querySelector('app-status-badge')?.textContent?.trim()).toBe('confirmed');
  });
});
