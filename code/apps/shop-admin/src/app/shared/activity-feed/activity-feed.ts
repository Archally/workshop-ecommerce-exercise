import { Component, inject } from '@angular/core';
import { ActivityLogService } from '../../core/activity-log/activity-log.service';
import { StatusBadge } from '../status-badge/status-badge';

@Component({
  selector: 'app-activity-feed',
  imports: [StatusBadge],
  templateUrl: './activity-feed.html',
  styleUrl: './activity-feed.css',
})
export class ActivityFeed {
  private readonly log = inject(ActivityLogService);

  readonly entries = this.log.recent;

  formatTime(at: Date): string {
    return at.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
