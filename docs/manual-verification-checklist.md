# Phase 6 Manual Verification Checklist

## Commands

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
docker compose -f .\infra\docker-compose.yml up -d postgres redis
pnpm install
pnpm db:migrate
pnpm demo:reset
```

Terminal 1:

```powershell
pnpm dev:api
```

Terminal 2:

```powershell
pnpm dev:worker
```

Terminal 3:

```powershell
pnpm simulator:all
```

## Expected API Responses

- `simulator:stripe-valid`: HTTP `200`, `providerId=stripe-sample`, `status=queued`, `duplicate=false`.
- `simulator:success`: HTTP `200`, final status `delivered`.
- `simulator:duplicate`: first request accepted or reported as already present, second request `duplicate=true`.
- `simulator:invalid-signature`: HTTP `401`, error code `invalid_signature`.
- `simulator:invalid-payload`: HTTP `400`, error code `invalid_payload`.
- `simulator:mock-crm-success`: HTTP `200`, final status `delivered`.
- `simulator:retry-success`: HTTP `200`, final status `delivered`.
- `simulator:dead-letter`: HTTP `200`, final status `dead_lettered`.
- `simulator:permanent-failure`: HTTP `200`, final status `dead_lettered`.
- `simulator:manual-replay`: replay JSON route returns HTTP `200`, a manual replay ID, and a replay queue job ID.

## Expected Dashboard Observations

- `http://localhost:3000/dashboard` shows event volume, success rate, failed events, retry count, dead-letter count, and last successful event.
- `http://localhost:3000/dashboard/events` lists accepted and rejected events with readable statuses.
- Invalid signature events appear as `rejected_invalid_signature`.
- Invalid payload events appear as `rejected_invalid_payload`.
- Retry-success history shows a failed retryable attempt followed by `delivered`.
- Dead-letter scenarios appear at `http://localhost:3000/dashboard/dead-letter`.
- Manual replay detail shows a replay audit row and later `delivered`.

## Expected Database And Queue Behavior

- `webhook_events` stores canonical provider/external event IDs.
- `event_status_history` explains received, validated, queued, processing, retry, dead-letter, and replay transitions.
- `delivery_attempts` records succeeded, failed retryable, and failed permanent attempts.
- `dead_letter_events` contains exhausted retry and permanent-failure scenarios.
- `manual_replays` records requested, queued, completed, or failed replay attempts.
- BullMQ uses canonical delivery job IDs for normal delivery and replay-specific job IDs for manual replay.

## Safety Checks

- No real provider secrets are required or printed.
- No real provider APIs are called.
- Simulator targets `http://localhost:3000` by default.
- Database reset refuses non-local PostgreSQL targets.
- Queue reset refuses non-local Redis targets.
- No public tunnel is required.
