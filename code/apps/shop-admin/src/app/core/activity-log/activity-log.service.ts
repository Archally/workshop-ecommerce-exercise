import { Injectable, signal } from '@angular/core';
import { ActivityEntry } from './activity-entry';
import { ActivityKind } from './activity-kind';
import { StatusTransition } from './status-transition';

/**
 * A running, in-memory feed of business-readable events, kept for narration.
 * This is the thing a presenter reads out loud - "the order moved from
 * pending to confirmed" - rather than the HTTP call underneath it. It holds
 * nothing across a page reload; that is deliberate, the feed is for the
 * current walkthrough, not a record.
 *
 * Also carries `lastChange`, a tiny signal any list/detail view can watch to
 * flash the row or field a mutation just touched - the second, reinforcing
 * rendering of a transition (DESIGN.md section 5), sharing this service
 * rather than a parallel one.
 */
@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  private readonly nextId = signal(1);
  private readonly entries = signal<ActivityEntry[]>([]);
  private readonly changeSignal = signal<{ entityId: string; at: number } | null>(null);

  readonly recent = this.entries.asReadonly();
  readonly lastChange = this.changeSignal.asReadonly();

  record(kind: ActivityKind, message: string, transition?: StatusTransition): void {
    const entry: ActivityEntry = {
      id: this.nextId(),
      kind,
      message,
      transition,
      at: new Date(),
    };
    this.nextId.set(entry.id + 1);
    this.entries.update((current) => [entry, ...current].slice(0, 30));
  }

  /** Marks an entity as just-changed, for a row/field to flash while it renders. */
  flash(entityId: string): void {
    this.changeSignal.set({ entityId, at: Date.now() });
  }

  clear(): void {
    this.entries.set([]);
  }
}
