# Retain the stock boundary

Status: accepted, 20 October 2026. Participants: product lead and fulfilment engineer.

## Context and problem statement

An accepted order must have stock behind it, while the two services keep different records. Avoid overselling, keep the stock lock local, and preserve a clear owner.

## Considered options

- Have Orders write stock directly: simple call, mixed ownership.
- Use inventory API orchestration: easy to debug, synchronous failure coupling.
- Use submission and reservation events: independent service releases, harder duplicate and cancellation handling.

## Decision outcome

retain the local stock lock and pursue the event boundary for the next increment. It is not wired in the current build. The Order Platform Team, called Fulfilment in the board shorthand, remains accountable for reservation incidents under the approved 20 October boundary note. Host Operations runs the host but did not accept the business duty.

### Consequences

We still owe a duplicate-message policy and a cancellation design. Support asked for one person to call when a hold and an order disagree. Keeping a host alive does not settle that business question.

### Confirmation

Review the first end-to-end case before the pilot. A local reserve response is useful evidence for the stock lock, but cannot close the integration task.
