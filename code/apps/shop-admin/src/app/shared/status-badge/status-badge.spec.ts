import { TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders the given status text and a matching modifier class', async () => {
    TestBed.configureTestingModule({ imports: [StatusBadge] });
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', 'shipped');
    await fixture.whenStable();
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('shipped');
    expect(badge.classList.contains('badge--shipped')).toBe(true);
  });
});
