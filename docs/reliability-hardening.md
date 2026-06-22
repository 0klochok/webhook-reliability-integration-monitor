# Phase 7 Reliability Hardening

This remains the detailed hardening reference for the Phase 8 portfolio documentation. The README
summarizes these behaviors for evaluators; this file keeps the implementation-focused verification
notes.

Phase 7 adds pragmatic production-style guardrails to the local webhook reliability demo without
changing the core product scope.

## Validation Closure

Phase 7 reliability hardening is accepted and complete as of 2026-06-22. Automated validation passed:
`pnpm install`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm format`, `pnpm format:check`,
`pnpm lint`, `pnpm typecheck`, and `pnpm test -- --run`.

Manual runtime verification also passed with Docker PostgreSQL/Redis, `pnpm dev:api`,
`pnpm dev:worker`, `GET /readyz`, `GET /dashboard`, and `pnpm simulator:all`.

Earlier manual failures were traced to missing or incorrect local environment variables, not Phase 7
implementation defects.

## Required Local Env Vars

Use the exact fake local values from `.env.example`:

```powershell
$env:DATABASE_URL = "postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor"
$env:REDIS_URL = "redis://localhost:6379"
$env:STRIPE_SAMPLE_WEBHOOK_SECRET = "whsec_local_test_secret"
```

`DATABASE_URL` and `REDIS_URL` are required for the API and worker. The Stripe-style simulator and
webhook verification require the API process to have `STRIPE_SAMPLE_WEBHOOK_SECRET` loaded. Restart
the API after changing any API env var.

## Hardened Behavior

- API, worker, queue, database, and simulator runtime config now fail fast on missing or malformed
  required values. `pnpm dev:api` fails with `ConfigValidationError` when required API values are
  missing; `pnpm dev:worker` and `pnpm db:migrate` fail when the configured database URL does not
  match the local Postgres credentials.
- Structured JSON logs include `service`, `level`, `timestamp`, `message`, and operational fields
  such as `correlationId`, `eventId`, `providerId`, `externalEventId`, `jobId`, and `errorCode`.
- Secret-like keys and URL credentials are redacted before diagnostics or logs are emitted.
- API requests get an `x-request-id` response header. Valid incoming IDs are preserved; absent or
  invalid IDs are replaced with generated IDs.
- Delivery jobs accept optional `correlationId` and worker processing uses it in logs and safe
  metadata.
- `GET /healthz` stays lightweight. `GET /readyz` checks database and queue reachability.
- Webhook ingress enforces a bounded body reader and returns `413 payload_too_large` before
  enqueueing oversized requests.
- Webhook ingress enforces a local in-memory rate limit and returns `429 rate_limited` with
  `Retry-After` where practical.
- API errors use standardized safe JSON response shapes with `correlationId` and without stack
  traces, raw secrets, or URL credentials.
- Queue enqueue failures no longer return `queued`; persisted events receive a
  `queue_enqueue_failed` status-history entry.
- Worker startup checks Postgres and Redis/BullMQ before logging ready.
- Worker shutdown is idempotent, timeout-bounded, and closes worker, Redis, and database resources.
- The simulator performs a `/readyz` preflight and prints outbound request IDs/correlation values so
  manual runs can connect simulator output to API and worker logs.

## Intentionally Not Included

- No external observability vendor, Sentry, Datadog, New Relic, Honeycomb, or OpenTelemetry SDK.
- No distributed rate limiting. The rate limiter is in-memory and local-demo only.
- No production authentication or authorization for the dashboard.
- No GitHub Actions, deployment, public tunnel, process manager, or hosted infrastructure.
- No real Stripe, Shopify, Calendly, HubSpot, CRM, provider SDK, paid API, or production credential
  usage.

## Local Limits

The webhook rate limiter is scoped to the current API process. It is useful for local reliability
guardrails and tests, but it is not a production multi-instance rate limiter.

The local dashboard remains unauthenticated. Keep it on localhost and do not expose it publicly.

`STRIPE_SAMPLE_WEBHOOK_SECRET` is intentionally fake and local-only. If `pnpm simulator:all` reports
`misconfigured_signature_secret`, the API was started without the secret loaded. Stop the API, set the
env var in the API terminal, restart `pnpm dev:api`, then rerun the simulator.

## Manual Checks

Use `docs/manual-verification-checklist.md` for exact PowerShell commands that exercise readiness,
Redis/Postgres failure behavior, oversized payload rejection, rate limiting, and correlation IDs.
