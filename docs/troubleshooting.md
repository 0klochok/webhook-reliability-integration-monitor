# Troubleshooting

Use PowerShell from the repository root unless noted otherwise.

## Docker Is Not Running

Likely cause: Docker Desktop is closed or still starting.

Check:

```powershell
docker --version
docker compose -f .\infra\docker-compose.yml ps
```

Fix:

1. Start Docker Desktop.
2. Wait until the engine is running.
3. Start local services:

```powershell
docker compose -f .\infra\docker-compose.yml up -d postgres redis
```

## Postgres Connection Refused

Likely cause: local Postgres container is stopped, unhealthy, or port `5432` is already used.

Check:

```powershell
docker compose -f .\infra\docker-compose.yml ps
docker compose -f .\infra\docker-compose.yml logs postgres
```

Fix:

```powershell
docker compose -f .\infra\docker-compose.yml up -d postgres
pnpm db:migrate
```

If the port is already in use, stop the unrelated local process or intentionally change the local
Compose port mapping.

## Redis Connection Refused

Likely cause: local Redis container is stopped, unhealthy, or port `6379` is already used.

Check:

```powershell
docker compose -f .\infra\docker-compose.yml ps
docker compose -f .\infra\docker-compose.yml logs redis
```

Fix:

```powershell
docker compose -f .\infra\docker-compose.yml up -d redis
```

Restart `pnpm dev:worker` after Redis is available.

## Migration Failure

Likely cause: Postgres is unavailable, `DATABASE_URL` is wrong, or an existing Docker volume uses
different credentials.

Check:

```powershell
docker compose -f .\infra\docker-compose.yml ps
Get-Content .env
pnpm db:migrate
```

Fix:

```powershell
Copy-Item .env.example .env -Force
docker compose -f .\infra\docker-compose.yml up -d postgres
pnpm db:migrate
```

If credentials still fail, the existing Docker volume may have older credentials. Decide whether to
remove the local Docker volume manually; that is destructive and outside normal Phase 8 validation.

## Missing Env Vars

Likely cause: `.env` is missing or a long-running process was started before env changes.

Check:

```powershell
Test-Path .env
Get-Content .env.example
```

Fix:

```powershell
Copy-Item .env.example .env
```

Then restart `pnpm dev:api` and `pnpm dev:worker`.

## Invalid Fake Stripe Signature

Likely cause: `STRIPE_SAMPLE_WEBHOOK_SECRET` differs between the simulator and API, or the raw body
changed after signing.

Check:

```powershell
Select-String -Path .env -Pattern "STRIPE_SAMPLE_WEBHOOK_SECRET"
```

Fix:

1. Ensure `.env` contains `STRIPE_SAMPLE_WEBHOOK_SECRET=whsec_local_test_secret`.
2. Stop `pnpm dev:api`.
3. Restart `pnpm dev:api`.
4. Rerun:

```powershell
pnpm simulator:stripe-valid
```

## Simulator API Unreachable

Likely cause: API is not running, API is on a different port, or `SIMULATOR_API_BASE_URL` is wrong.

Check:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/healthz"
Select-String -Path .env -Pattern "SIMULATOR_API_BASE_URL"
```

Fix:

```powershell
pnpm dev:api
```

Keep the API running in its own terminal.

## Worker Not Processing Jobs

Likely cause: worker is not running, Redis is unavailable, or queued jobs were created while the
worker was stopped.

Check:

```powershell
docker compose -f .\infra\docker-compose.yml ps
```

Look at the worker terminal for startup errors.

Fix:

```powershell
pnpm dev:worker
```

If the queue contains stale demo jobs and you want a clean run:

```powershell
pnpm demo:reset
```

## Dashboard Has No Data

Likely cause: database was reset or no simulator scenarios have run.

Check:

```powershell
Invoke-WebRequest -Method Get -Uri "http://localhost:3000/dashboard/events"
```

Fix:

```powershell
pnpm simulator:success
```

Refresh `http://localhost:3000/dashboard`.

## Duplicate Event Already Exists

Likely cause: deterministic simulator IDs were already used.

Check:

```powershell
pnpm simulator:duplicate
```

Fix for a clean demo:

```powershell
pnpm demo:reset
pnpm simulator:duplicate
```

## Rate Limit Interfering With Repeated Demo

Likely cause: local in-memory rate limit exceeded for the same provider/client key.

Check: the API response returns HTTP `429` and usually includes `Retry-After`.

Fix:

1. Wait for the configured `WEBHOOK_RATE_LIMIT_WINDOW_MS`.
2. Or restart `pnpm dev:api` for a local demo reset.
3. Or lower request volume during manual testing.

Do not remove rate limiting just to hide the behavior.

## Oversized Payload Rejected

Likely cause: request body exceeds `WEBHOOK_MAX_BODY_BYTES`.

Check:

```powershell
Select-String -Path .env -Pattern "WEBHOOK_MAX_BODY_BYTES"
```

Fix:

- Use a smaller local payload.
- Or intentionally raise `WEBHOOK_MAX_BODY_BYTES` in `.env`, then restart `pnpm dev:api`.

Expected behavior is HTTP `413 payload_too_large`.

## Tests Fail Because Services Are Not Running

Likely cause: integration tests need local PostgreSQL or Redis.

Check:

```powershell
docker compose -f .\infra\docker-compose.yml ps
```

Fix:

```powershell
docker compose -f .\infra\docker-compose.yml up -d postgres redis
pnpm db:migrate
pnpm test -- --run
```

## Ports Already In Use

Likely cause: another local Postgres, Redis, or API process is running.

Check Docker services:

```powershell
docker compose -f .\infra\docker-compose.yml ps
```

Check common ports:

```powershell
netstat -ano | Select-String ":3000|:5432|:6379"
```

Fix:

- Stop the unrelated process manually if it is safe.
- Or intentionally change local ports in Docker Compose and matching `.env` values.
- Do not kill unknown processes just to free ports without understanding what they are.

## Dashboard Replay Fails

Likely cause: event is not replayable, Redis is unavailable, or API cannot enqueue a replay job.

Check:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/readyz"
```

Fix:

1. Confirm the event is `dead_lettered` or `failed_retryable`.
2. Confirm Redis is running.
3. Restart the worker if jobs are not being processed.

## Raw Body Signature Changed

Likely cause: manual request construction changed whitespace or JSON body after calculating the
fake signature.

Fix:

- Use `pnpm simulator:stripe-valid` for signed demo events.
- If building a manual request, compute the HMAC from the exact compressed body string you send.
