# Phase 7 Manual Verification Checklist

Use PowerShell from the repository root. All values below are fake local-only values from
`.env.example`; do not substitute real provider credentials.

## Terminal Setup

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
```

Start local infrastructure first:

```powershell
docker compose -f .\infra\docker-compose.yml up -d postgres redis
docker compose -f .\infra\docker-compose.yml ps
```

Set env vars in the same PowerShell terminal that will run the next command:

```powershell
$env:DATABASE_URL = "postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor"
$env:REDIS_URL = "redis://localhost:6379"
$env:STRIPE_SAMPLE_WEBHOOK_SECRET = "whsec_local_test_secret"
```

PowerShell env vars are process-local. Repeat the required assignments in every API, worker, and
simulator terminal. Changing an env var after `pnpm dev:api` starts does not update that API
process; stop and restart the API after changing `STRIPE_SAMPLE_WEBHOOK_SECRET`, `DATABASE_URL`, or
`REDIS_URL`.

## Automated Gate Baseline

These were the Phase 7 validation gates:

```powershell
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test -- --run
git status --short
```

For manual runtime verification, `pnpm db:migrate` must run after Docker PostgreSQL is started and
after `DATABASE_URL` is set in the migration terminal:

```powershell
$env:DATABASE_URL = "postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor"
$env:REDIS_URL = "redis://localhost:6379"
$env:STRIPE_SAMPLE_WEBHOOK_SECRET = "whsec_local_test_secret"
pnpm db:migrate
```

## Start Local Processes

Terminal 1, API:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
$env:DATABASE_URL = "postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor"
$env:REDIS_URL = "redis://localhost:6379"
$env:STRIPE_SAMPLE_WEBHOOK_SECRET = "whsec_local_test_secret"
pnpm dev:api
```

The API requires `DATABASE_URL` and `REDIS_URL` to start. The simulator and Stripe-style webhook
verification require the API process to have `STRIPE_SAMPLE_WEBHOOK_SECRET` loaded.

Terminal 2, worker:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
$env:DATABASE_URL = "postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor"
$env:REDIS_URL = "redis://localhost:6379"
pnpm dev:worker
```

The worker requires `DATABASE_URL` and `REDIS_URL`. It fails fast when either value is missing or
when the local database/Redis service is unreachable.

## Runtime Smoke Checks

Terminal 3:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
$env:DATABASE_URL = "postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor"
$env:REDIS_URL = "redis://localhost:6379"
$env:STRIPE_SAMPLE_WEBHOOK_SECRET = "whsec_local_test_secret"
curl.exe -i -H "x-request-id: manual-readyz-check" http://localhost:3000/readyz
curl.exe -i -H "x-request-id: manual-dashboard-check" http://localhost:3000/dashboard
```

Expected:

- `/readyz` returns HTTP `200` when Postgres and Redis are reachable.
- `/dashboard` returns HTTP `200`.
- Responses include an `x-request-id` header.
- Safe JSON errors include `correlationId` and do not include stack traces or secrets.

## Simulator Checks

Run the simulator only after the API and worker are running and the API was started with
`STRIPE_SAMPLE_WEBHOOK_SECRET` loaded:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
$env:DATABASE_URL = "postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor"
$env:REDIS_URL = "redis://localhost:6379"
$env:STRIPE_SAMPLE_WEBHOOK_SECRET = "whsec_local_test_secret"
pnpm simulator:all
```

Expected:

- The simulator performs a `/readyz` preflight before scenarios.
- Scenario output includes outbound `x-request-id` values and returned correlation IDs.
- Duplicate, invalid signature, invalid payload, retry success, dead-letter, permanent failure, and
  manual replay behavior match the Phase 6 demo.

## Failure-Mode Checks

Redis readiness failure:

```powershell
docker compose -f .\infra\docker-compose.yml stop redis
curl.exe -i -H "x-request-id: manual-redis-down-check" http://localhost:3000/readyz
docker compose -f .\infra\docker-compose.yml start redis
```

Expected:

- `/readyz` returns HTTP `503` or reports `queue=unavailable`.
- Restarted worker logs a clear queue/Redis startup error if Redis is still stopped.
- Webhook enqueue failure is explicit and does not report `status=queued`.
- Logs and responses do not print `REDIS_URL`.

Postgres readiness failure:

```powershell
docker compose -f .\infra\docker-compose.yml stop postgres
curl.exe -i -H "x-request-id: manual-postgres-down-check" http://localhost:3000/readyz
docker compose -f .\infra\docker-compose.yml start postgres
```

Expected:

- `/readyz` returns HTTP `503` or reports `database=unavailable`.
- Routes that require database access return safe explicit errors.
- Restarted worker startup fails clearly if Postgres is still stopped.
- Logs and responses do not print `DATABASE_URL` credentials.

Oversized payload:

```powershell
$largePayload = @{
  eventId = "manual_oversized_payload"
  eventType = "order.fulfilled"
  occurredAt = "2026-06-20T12:00:00.000Z"
  source = "manual-check"
  idempotencyKey = "manual_oversized_payload:idempotency"
  payload = @{
    blob = "x" * 1200000
  }
} | ConvertTo-Json -Depth 5

try {
  Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:3000/webhooks/generic-http" `
    -ContentType "application/json" `
    -Body $largePayload
} catch {
  $_.Exception.Response.StatusCode.value__
}
```

Expected:

- HTTP status `413`.
- Response error code `payload_too_large`.
- Response includes `x-request-id`.
- No delivery job is enqueued.
- Logs do not include the full body.

Rate limit:

```powershell
1..130 | ForEach-Object {
  $payload = @{
    eventId = "manual_rate_limit_$($_)"
    eventType = "order.fulfilled"
    occurredAt = "2026-06-20T12:00:00.000Z"
    source = "manual-check"
    idempotencyKey = "manual_rate_limit_$($_):idempotency"
    payload = @{ orderId = "order_$($_)" }
  } | ConvertTo-Json -Depth 5

  try {
    Invoke-WebRequest `
      -Method Post `
      -Uri "http://localhost:3000/webhooks/generic-http" `
      -ContentType "application/json" `
      -Headers @{ "x-forwarded-for" = "127.0.0.77" } `
      -Body $payload
  } catch {
    $_.Exception.Response.StatusCode.value__
    $_.Exception.Response.Headers["Retry-After"]
    break
  }
}
```

Expected:

- Requests under the configured limit proceed normally.
- A later request returns HTTP `429`.
- `Retry-After` is present where practical.
- The rate-limited request is not enqueued.

Correlation ID propagation:

```powershell
$payload = @{
  eventId = "manual_correlation_check"
  eventType = "order.fulfilled"
  occurredAt = "2026-06-20T12:00:00.000Z"
  source = "manual-check"
  idempotencyKey = "manual_correlation_check:idempotency"
  payload = @{ orderId = "order_correlation" }
} | ConvertTo-Json -Depth 5

$response = Invoke-WebRequest `
  -Method Post `
  -Uri "http://localhost:3000/webhooks/generic-http" `
  -ContentType "application/json" `
  -Headers @{ "x-request-id" = "demo-correlation-123" } `
  -Body $payload

$response.Headers["x-request-id"]
$response.Content
```

Expected:

- Response header `x-request-id` is `demo-correlation-123`.
- API and worker logs include `correlationId=demo-correlation-123`.
- Queue job data carries the same correlation ID.

## Troubleshooting

If `pnpm dev:api` fails with `DATABASE_URL` or `REDIS_URL` required:

- Set `DATABASE_URL` and `REDIS_URL` in the same terminal before running `pnpm dev:api`.
- Use the exact values from `.env.example`.
- Confirm Docker services are running with
  `docker compose -f .\infra\docker-compose.yml ps`.

If `pnpm dev:worker` fails with `database_connection_failed`:

- Verify `DATABASE_URL` matches `.env.example`.
- Confirm Docker Postgres is running and healthy.
- Run `pnpm db:migrate` after fixing the env value.

If `pnpm db:migrate` fails with `password authentication failed`:

- The `DATABASE_URL` password does not match the local Postgres container or existing Docker volume.
- Use the exact `DATABASE_URL` from `.env.example`.
- Verify `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` in `.env.example` match
  `infra/docker-compose.yml`.

If `pnpm simulator:all` fails with `misconfigured_signature_secret: Webhook signature verification is not configured for this provider.`:

- Stop the API process.
- In the API terminal, set
  `$env:STRIPE_SAMPLE_WEBHOOK_SECRET = "whsec_local_test_secret"`.
- Restart `pnpm dev:api`.
- Rerun `pnpm simulator:all` from the simulator terminal.

Earlier Phase 7 manual failures were caused by missing or incorrect local environment variables, not
by reliability hardening implementation defects.

## Safety Checks

- No real provider secrets are required or printed.
- No real provider APIs are called.
- Simulator targets `http://localhost:3000` by default.
- Database reset refuses non-local PostgreSQL targets.
- Queue reset refuses non-local Redis targets.
- No public tunnel is required.
