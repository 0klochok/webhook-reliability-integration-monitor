# Failure Scenarios

All scenarios are fake/local-only and target the local API by default. Start Docker services, run
migrations, start `pnpm dev:api`, and start `pnpm dev:worker` before running simulator commands.

## Scenario Summary

| Scenario                     | Command                            | Business meaning                                       |
| ---------------------------- | ---------------------------------- | ------------------------------------------------------ |
| Duplicate event              | `pnpm simulator:duplicate`         | Prevent duplicate orders, CRM writes, or notifications |
| Invalid signature            | `pnpm simulator:invalid-signature` | Reject untrusted payment-style events                  |
| Invalid payload              | `pnpm simulator:invalid-payload`   | Stop malformed data before downstream systems          |
| Downstream temporary failure | `pnpm simulator:retry-success`     | Recover from transient outage without manual work      |
| Retry success after failure  | `pnpm simulator:retry-success`     | Show retry attempt history and eventual delivery       |
| Permanent failure            | `pnpm simulator:permanent-failure` | Avoid wasting retries on non-retryable failures        |
| Dead-letter event            | `pnpm simulator:dead-letter`       | Surface unrecoverable events for operator attention    |
| Manual replay                | `pnpm simulator:manual-replay`     | Recover a dead-lettered event with an audited replay   |

## Duplicate Event

Command:

```powershell
pnpm simulator:duplicate
```

What it sends: the same `generic-http` payload twice with the same external event ID.

What the system does:

- First request stores and queues the event.
- Second request hits the provider/external-event idempotency constraint.
- API returns duplicate handling without creating a second canonical event or delivery job.
- Existing event receives a `duplicate_ignored` status-history entry.

Expected status transitions:

```text
received -> validated -> queued -> processing -> delivered
duplicate_ignored audit entry on the existing event
```

Expected dashboard observation:

- One canonical event row.
- Status history includes duplicate audit information.
- Delivery attempts are not duplicated.

Business meaning: duplicate provider deliveries do not create duplicate customer actions.

## Invalid Signature

Command:

```powershell
pnpm simulator:invalid-signature
```

What it sends: a `stripe-sample` payload with a bad fake Stripe-style `stripe-signature` header.

What the system does:

- API verifies the signature against the raw request body.
- Verification fails.
- API returns `401`.
- Event is persisted as `rejected_invalid_signature`.
- No delivery job is enqueued.

Expected status transitions:

```text
rejected_invalid_signature
```

Expected dashboard observation:

- Rejected event appears in the events list.
- Event detail shows signature rejection history.
- No delivery attempts exist.

Business meaning: untrusted payment-style events do not reach downstream business workflows.

## Invalid Payload

Command:

```powershell
pnpm simulator:invalid-payload
```

What it sends: a malformed `generic-http` payload missing required schema fields.

What the system does:

- API parses JSON.
- Zod provider schema validation fails.
- API returns `400`.
- Event is persisted as `rejected_invalid_payload`.
- No delivery job is enqueued.

Expected status transitions:

```text
rejected_invalid_payload
```

Expected dashboard observation:

- Rejected event appears in the events list.
- Event detail shows schema validation failure details.
- No delivery attempts exist.

Business meaning: malformed automation data is visible but not delivered into downstream systems.

## Downstream Temporary Failure

Command:

```powershell
pnpm simulator:retry-success
```

What it sends: a `generic-http` payload with mock delivery behavior
`fail-once-then-success`.

What the system does:

- Event is accepted and queued.
- Worker attempt 1 fails retryably.
- BullMQ schedules a retry with configured backoff.
- Worker attempt 2 succeeds.

Expected status transitions:

```text
received -> validated -> queued -> processing -> retry_scheduled -> processing -> delivered
```

Expected dashboard observation:

- Event ends as `delivered`.
- Delivery attempts show attempt 1 failed retryably and attempt 2 succeeded.
- Retry count increases.

Business meaning: transient downstream outages can recover without manual reconciliation.

## Retry Success After Failure

Command:

```powershell
pnpm simulator:retry-success
```

This is the same simulator command as downstream temporary failure, focused on the recovery signal.

Expected dashboard observation:

- Final status is `delivered`.
- Event detail proves the system did not hide the first failure.
- Summary success rate can recover while retry count preserves the operational signal.

Business meaning: operators can see both the failure and the recovery.

## Permanent Failure

Command:

```powershell
pnpm simulator:permanent-failure
```

What it sends: a `generic-http` payload with mock delivery behavior `permanent-fail`.

What the system does:

- Event is accepted and queued.
- Worker records a non-retryable failed attempt.
- Worker dead-letters the event immediately.

Expected status transitions:

```text
received -> validated -> queued -> processing -> dead_lettered
```

Expected dashboard observation:

- Event appears on the dead-letter page.
- Delivery attempts show a permanent failure.
- Dead-letter reason is `permanent_delivery_failure`.

Business meaning: non-retryable failures are surfaced quickly instead of consuming retry capacity.

## Dead-Letter Event

Command:

```powershell
pnpm simulator:dead-letter
```

What it sends: a `generic-http` payload with mock delivery behavior `always-retryable-fail`.

What the system does:

- Event is accepted and queued.
- Worker retries until max attempts are exhausted.
- Worker creates a dead-letter record.
- Event status becomes `dead_lettered`.

Expected status transitions:

```text
received -> validated -> queued -> processing -> retry_scheduled -> processing -> retry_scheduled -> processing -> dead_lettered
```

Expected dashboard observation:

- Event appears on `/dashboard/dead-letter`.
- Final attempt number matches `DELIVERY_MAX_ATTEMPTS`.
- Dead-letter reason is `max_attempts_exhausted`.

Business meaning: unrecoverable automation events become visible work items instead of silent loss.

## Manual Replay

Command:

```powershell
pnpm simulator:manual-replay
```

What it sends: a `generic-http` payload with mock delivery behavior
`fail-until-manual-replay-success`.

What the system does:

- Normal delivery fails until the event is dead-lettered.
- Simulator calls `POST /api/dashboard/events/:eventId/replay`.
- API creates a manual replay audit row.
- API queues a replay-specific delivery job.
- Worker succeeds because the mock behavior allows success when a manual replay ID is present.

Expected status transitions:

```text
received -> validated -> queued -> processing -> retry_scheduled -> processing -> retry_scheduled -> processing -> dead_lettered
replayed audit entry
processing -> delivered
```

Expected dashboard observation:

- Event detail shows dead-letter history, replay audit, and a later successful replay attempt.
- Manual replay status becomes `completed` after worker success.
- Event current status becomes `delivered`.

Business meaning: operators can recover failed automation events with an auditable replay path.
