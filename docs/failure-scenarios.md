# Phase 6 Failure Scenarios

All scenarios are fake/local-only and target the local API by default.

## Duplicate Event

Command: `pnpm simulator:duplicate`

The simulator sends the same `generic-http` payload twice with external event ID `generic_demo_duplicate`. The first request is stored and queued. The second request returns duplicate handling and records `duplicate_ignored` history without creating another delivery job.

## Invalid Signature

Command: `pnpm simulator:invalid-signature`

The simulator sends a Stripe-style sample event with a malformed `stripe-signature` HMAC. The API returns `401`, persists `rejected_invalid_signature`, and does not enqueue delivery.

## Invalid Payload

Command: `pnpm simulator:invalid-payload`

The simulator sends a malformed `generic-http` payload with a plausible event ID but missing required schema fields. The API returns `400`, persists `rejected_invalid_payload`, and does not enqueue delivery.

## Downstream Retryable Failure

Command: `pnpm simulator:retry-success`

The payload sets `payload.deliveryBehavior = "fail-once-then-success"`. The worker records a failed retryable attempt, BullMQ retries using the local retry policy, and the second attempt succeeds.

## Dead-Letter After Retry Exhaustion

Command: `pnpm simulator:dead-letter`

The payload sets `payload.deliveryBehavior = "always-retryable-fail"`. The worker retries until max attempts are exhausted, marks the event `dead_lettered`, and creates a `dead_letter_events` row.

## Permanent Failure

Command: `pnpm simulator:permanent-failure`

The payload sets `payload.deliveryBehavior = "permanent-fail"`. The worker treats the failure as non-retryable and moves the event to the dead-letter list without unnecessary retries.

## Manual Replay

Command: `pnpm simulator:manual-replay`

The payload sets `payload.deliveryBehavior = "fail-until-manual-replay-success"`. Normal delivery dead-letters the event. The simulator then calls `POST /api/dashboard/events/:eventId/replay`, which creates a manual replay audit row and replay-specific queue job. Replay delivery succeeds and the event reaches `delivered`.
