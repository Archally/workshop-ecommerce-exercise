import { ActivityKind } from './activity-kind';
import { StatusTransition } from './status-transition';

export interface ActivityEntry {
  id: number;
  kind: ActivityKind;
  /** A one-line business sentence, e.g. "Order order-1:" for a transition, or the full line for info/removal. */
  message: string;
  transition?: StatusTransition;
  at: Date;
}
