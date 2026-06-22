# Manual Verification Checklist

Use PowerShell from the repository root. All values are fake local-only values from `.env.example`.
Do not use real provider credentials.

## Clean Setup Checklist

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
node --version
pnpm --version
docker --version
docker compose version
git --version
pnpm install
Copy-Item .env.example .env
docker compose -f .\infra\docker-compose.yml up -d postgres redis
docker compose -f .\infra\docker-compose.yml ps
pnpm db:migrate
pnpm demo:reset
```

Expected:

- Node and pnpm meet versions in `package.json`.
- Docker shows `postgres` and `redis` services.
- Migrations complete.
- Demo reset completes without refusing the local targets.

## Validation Command Checklist

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test -- --run
git status --short
```

Expected:

- Formatting check passes.
- ESLint passes.
- TypeScript build check passes.
- Vitest passes.
- Git status shows only intentional documentation changes during Phase 8.

## Docker, PostgreSQL, And Redis Checklist

```powershell
docker compose -f .\infra\docker-compose.yml up -d postgres redis
docker compose -f .\infra\docker-compose.yml ps
```

Expected:

- `webhook-monitor-postgres` is running and healthy.
- `webhook-monitor-redis` is running and healthy.

Optional readiness through the API after it starts:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/readyz"
```

Expected:

- `ok` is `true`.
- `dependencies.database` is `ok`.
- `dependencies.queue` is `ok`.

## API Checklist

Terminal 1:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
pnpm dev:api
```

Terminal 3:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/healthz"
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/readyz"
Invoke-WebRequest -Method Get -Uri "http://localhost:3000/dashboard"
```

Expected:

- `pnpm dev:api` starts and stays running.
- `/healthz` returns alive status.
- `/readyz` returns dependency status.
- `/dashboard` returns HTML.
- Responses include `x-request-id`.

## Worker Checklist

Terminal 2:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
pnpm dev:worker
```

Expected:

- Worker starts after Postgres and Redis are reachable.
- Worker logs startup with configured concurrency.
- Worker remains running until stopped with `Ctrl+C`.

## Dashboard Checklist

Open:

```text
http://localhost:3000/dashboard
http://localhost:3000/dashboard/events
http://localhost:3000/dashboard/dead-letter
```

Expected:

- Summary renders event volume, success rate, failed events, retry count, dead-letter count, and last
  successful event.
- Events list renders recent events.
- Dead-letter list renders dead-letter events after failure scenarios.
- Event detail pages show status history, delivery attempts, payload preview, and replay audit rows.

## Simulator Checklist

Run in Terminal 3 after API and worker are running:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
pnpm simulator:success
pnpm simulator:duplicate
pnpm simulator:invalid-signature
pnpm simulator:invalid-payload
pnpm simulator:mock-crm-success
pnpm simulator:retry-success
pnpm simulator:dead-letter
pnpm simulator:permanent-failure
pnpm simulator:manual-replay
```

Expected:

- Success scenarios end as delivered.
- Duplicate scenario records duplicate audit history without duplicate delivery attempts.
- Invalid signature returns `401` and is not queued.
- Invalid payload returns `400` and is not queued.
- Retry success records failed and succeeded attempts.
- Dead-letter and permanent failure appear on the dead-letter page.
- Manual replay creates audit history and eventually delivers.

Full clean demo:

```powershell
pnpm demo:reset
pnpm simulator:all
```

Expected:

- Simulator preflight passes.
- Full sequence completes against a clean state.

## Failure Scenario Checklist

Use [failure-scenarios.md](failure-scenarios.md) for detailed expected status transitions.

Minimum manual checks:

- Duplicate event has one canonical event row.
- Invalid signature has no delivery attempt.
- Invalid payload has no delivery attempt.
- Retry success has at least two delivery attempts.
- Dead-letter event has a `dead_letter_events` record.
- Permanent failure dead-letters without repeated retry attempts.
- Manual replay has a `manual_replays` audit row.

## Reliability Hardening Checklist

Health and readiness:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/healthz"
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/readyz"
```

Oversized payload:

```powershell
$largePayload = @{
  eventId = "manual_oversized_payload"
  eventType = "order.fulfilled"
  occurredAt = "2026-06-20T12:00:00.000Z"
  source = "manual-check"
  idempotencyKey = "manual_oversized_payload:idempotency"
  payload = @{ blob = "x" * 1200000 }
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

Expected: HTTP `413`.

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

Expected: a later request returns HTTP `429` with `Retry-After`.

## Security And Secrets Checklist

- `.env.example` contains fake local values only.
- `.env` is ignored by Git.
- No real Stripe, Shopify, Calendly, HubSpot, CRM, or paid API credentials are used.
- Logs and responses do not print URL credentials or secret-like values.
- Dashboard remains on localhost and is not exposed publicly.

## Final Portfolio Readiness Checklist

- README explains the business problem and value.
- Architecture diagram is visible and accurate.
- Demo video script exists.
- Screenshot checklist exists.
- Failure scenarios are tied to business meaning.
- Manual verification commands are PowerShell-compatible.
- Troubleshooting covers common local failures.
- Tradeoffs are honest.
- Future improvements are realistic and clearly not implemented yet.
