# Demo Video Script

Target length: 3 to 5 minutes.

The message of the demo is that webhook automation failures become manageable when events are
stored, idempotent, retryable, observable, and replayable. Do not claim the app is production-ready.
Say that it demonstrates production-grade reliability patterns in a local portfolio project.

## Preparation Checklist

- Docker Desktop is running.
- `.env` exists and was copied from `.env.example`.
- PostgreSQL and Redis are running.
- Migrations have been applied.
- Demo data and queue state are clean.
- API and worker terminals are visible.
- Browser is open to `http://localhost:3000/dashboard`.
- Font size is large enough for the terminal and browser to be readable on video.

## Exact Command Sequence

Setup terminal:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
pnpm install
Copy-Item .env.example .env
docker compose -f .\infra\docker-compose.yml up -d postgres redis
pnpm db:migrate
pnpm demo:reset
```

API terminal:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
pnpm dev:api
```

Worker terminal:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
pnpm dev:worker
```

Simulator terminal:

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
pnpm simulator:success
pnpm simulator:duplicate
pnpm simulator:invalid-signature
pnpm simulator:invalid-payload
pnpm simulator:retry-success
pnpm simulator:dead-letter
pnpm simulator:manual-replay
```

Optional one-command run for a clean demo:

```powershell
pnpm simulator:all
```

## Speaking Script

### Opening: Business Problem

"This project demonstrates reliable webhook handling for a SaaS operator with several
webhook-based integrations. The problem is that provider events can be duplicated, malformed,
unsigned, delayed, or fail during downstream delivery. Without event history, retries, and a health
dashboard, teams end up reconciling billing, CRM, and notification failures manually."

### Architecture Overview

"The flow is provider webhook to Hono ingress, then signature verification, Zod payload validation,
PostgreSQL event history, BullMQ delivery queue, worker retry processing, and a server-rendered
dashboard. The downstream target is local and payload-driven, so the demo never calls real provider
or paid APIs."

Show the architecture diagram in `README.md` or `docs/architecture.md`.

### Start Local Services

"The local stack uses Docker Compose for PostgreSQL and Redis. The API and worker run as separate
TypeScript processes through pnpm scripts."

Show the API and worker terminals after startup.

### Show Clean Dashboard

Open:

```text
http://localhost:3000/dashboard
```

"The dashboard starts from a clean state and will show event volume, success rate, failed events,
retry count, dead-letter count, and the last successful event."

### Send Successful Event

Run:

```powershell
pnpm simulator:success
```

"A normal generic webhook is stored, validated, queued, delivered by the worker, and visible in the
dashboard."

Show `/dashboard/events` and the event detail page.

### Send Duplicate Event

Run:

```powershell
pnpm simulator:duplicate
```

"The same provider event ID is sent twice. The first request is processed normally. The second is
accepted safely as a duplicate, records audit history, and does not create another delivery job."

Show the status history entry on the event detail page.

### Send Invalid Signature

Run:

```powershell
pnpm simulator:invalid-signature
```

"For the Stripe-style sample provider, the API verifies the HMAC against the raw body before parsing
JSON. A bad signature is rejected, persisted for audit, and never queued."

Show the rejected event.

### Send Invalid Payload

Run:

```powershell
pnpm simulator:invalid-payload
```

"This event fails Zod schema validation. It is stored as rejected so the operator can see what
happened, but it is not delivered downstream."

Show the rejected payload status.

### Send Retry-Success Event

Run:

```powershell
pnpm simulator:retry-success
```

"The mock downstream fails once with a retryable error. BullMQ retries with configured backoff, the
second attempt succeeds, and the dashboard shows both attempts."

Show delivery attempts on the event detail page.

### Send Dead-Letter Event

Run:

```powershell
pnpm simulator:dead-letter
```

"This event keeps failing retryably until attempts are exhausted. The worker moves it to the
dead-letter list so it is visible and recoverable instead of silently lost."

Open:

```text
http://localhost:3000/dashboard/dead-letter
```

### Replay Dead-Letter Event

Run:

```powershell
pnpm simulator:manual-replay
```

"Manual replay creates an audit row and a replay-specific queue job. The replay uses the same event
record and continues attempt numbering, so the history stays connected."

Show the event detail page with manual replay history and delivery attempts.

### Show Summary Changes

Return to:

```text
http://localhost:3000/dashboard
```

"The dashboard now shows the operational value: event volume, success rate, failed events, retries,
dead letters, and the latest successful event."

### Explain Tradeoffs And Next Improvements

"The project intentionally uses Hono server-rendered pages instead of a frontend framework, fake
provider adapters instead of real SDKs, and a local mock downstream target instead of paid APIs.
Future production work would add authentication, tenant isolation, real provider adapters, secret
rotation, hosted deployment, tracing, alerts, and distributed rate limiting."

## Dashboard Moments To Show

- Clean summary before scenarios.
- Summary after successful delivery.
- Events list with delivered, rejected, retry, and dead-letter statuses.
- Event detail with status history.
- Delivery attempts after retry success.
- Dead-letter page.
- Manual replay audit/status after replay.

## Closing Summary

"Reliable webhook handling matters because business automations depend on external events that can
arrive duplicated, invalid, or temporarily undeliverable. This local demo shows the reliability
patterns that make those integrations observable, retryable, and recoverable before connecting real
providers."
