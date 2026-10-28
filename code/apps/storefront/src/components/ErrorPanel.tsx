import { ApiError } from '../api/ApiError';

/**
 * Renders any failure as the business event it is - "this product does not
 * exist", "the service is not running", "this shop cannot do that yet", "that
 * email is invalid" - never a stack trace. A person in the audience should be
 * able to read this from the back of the room and understand what happened.
 *
 * Four causes, four sentences, and the third one was added 2026-09-25 because the
 * first three could not tell them apart:
 *
 *   the service never answered      -> Service unavailable, retryable
 *   it answered 404, no such ROUTE  -> This shop cannot do that yet, not retryable
 *   it answered 404, no such thing  -> Not found, not retryable
 *   anything else                   -> This did not go through, with field messages
 */
export function ErrorPanel({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { icon, title, detail, fieldMessages, retryable } = describe(error);

  return (
    <div className="state-panel state-panel--error">
      <span className="state-panel__icon">{icon}</span>
      <h3>{title}</h3>
      {detail && <p className="state-panel__detail">{detail}</p>}
      {fieldMessages.length > 0 && (
        <ul className="state-panel__list">
          {fieldMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {onRetry && retryable && (
        <button type="button" className="button button--ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

function describe(error: unknown): {
  icon: string;
  title: string;
  detail: string;
  fieldMessages: string[];
  /** A retry only makes sense when the service never answered at all - not
      for a 404 (retrying resolves nothing) or a 400 (the input, not the
      service, needs to change). See DESIGN.md section 4's error table. */
  retryable: boolean;
} {
  if (error instanceof ApiError) {
    if (error.isUnreachable) {
      return {
        icon: '\u{1F50C}',
        title: 'Service unavailable',
        detail: error.message,
        fieldMessages: [],
        retryable: true
      };
    }
    // Before the plain 404, because a missing ROUTE is also a 404 and is a different
    // sentence. This shop declares operations its services do not all implement yet, and
    // when a reader presses the control for one of them the honest answer names the gap
    // rather than suggesting the order went missing.
    if (error.isRouteMissing) {
      return {
        icon: '\u{1F6A7}',
        title: 'This shop cannot do that yet',
        detail:
          'The service is running and answered, but it has no endpoint for this action, so ' +
          'nothing happened and nothing was lost. The operation exists in the model and not ' +
          'yet in this build.',
        fieldMessages: [],
        retryable: false
      };
    }
    if (error.isNotFound) {
      return {
        icon: '\u{1F50D}',
        title: 'Not found',
        detail: error.message,
        fieldMessages: [],
        retryable: false
      };
    }
    return {
      icon: '\u{26A0}\u{FE0F}',
      title: 'This did not go through',
      detail: error.message,
      fieldMessages: error.fieldMessages,
      retryable: false
    };
  }

  return {
    icon: '\u{26A0}\u{FE0F}',
    title: 'Something went wrong',
    detail: error instanceof Error ? error.message : String(error),
    fieldMessages: [],
    retryable: true
  };
}
