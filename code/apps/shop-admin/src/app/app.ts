import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ActivityFeed } from './shared/activity-feed/activity-feed';
import { ActivityLogService } from './core/activity-log/activity-log.service';
import { SessionService } from './core/operators/session.service';

const SECTION_LABELS: Array<{ prefix: string; label: string }> = [
  { prefix: '/products', label: 'Products' },
  { prefix: '/orders', label: 'Orders' },
  { prefix: '/customers', label: 'Customers' },
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ActivityFeed],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly activityLog = inject(ActivityLogService);
  private readonly session = inject(SessionService);

  protected readonly operator = this.session.operator;

  protected readonly activityDrawerOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly currentSection = computed(() => {
    const url = this.currentUrl();
    return SECTION_LABELS.find((section) => url.startsWith(section.prefix))?.label ?? '';
  });

  protected readonly activityCount = computed(() => this.activityLog.recent().length);

  // The sign-in screen is the whole window: no nav, no activity drawer, nothing
  // to click past the gate.
  protected readonly showChrome = computed(() => !this.currentUrl().startsWith('/sign-in'));

  protected signOut(): void {
    this.session.signOut();
    void this.router.navigateByUrl('/sign-in');
  }

  protected toggleActivityDrawer(): void {
    this.activityDrawerOpen.update((open) => !open);
  }

  protected closeActivityDrawer(): void {
    this.activityDrawerOpen.set(false);
  }
}
