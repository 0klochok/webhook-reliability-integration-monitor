# Phase 6 Demo Script

Use this as a short speaking script for a portfolio demo video.

## Setup

```powershell
Set-Location "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
docker compose -f .\infra\docker-compose.yml up -d postgres redis
pnpm install
pnpm db:migrate
pnpm demo:reset
```

Start the API and worker in separate PowerShell terminals:

```powershell
pnpm dev:api
```

```powershell
pnpm dev:worker
```

## Speaking Sequence

1. Open `http://localhost:3000/dashboard` and show the clean dashboard.
2. Run `pnpm simulator:success`; explain that a normal generic webhook is stored, queued, delivered, and visible in the dashboard.
3. Run `pnpm simulator:duplicate`; explain that duplicate provider event IDs are accepted safely but not processed twice.
4. Run `pnpm simulator:invalid-signature`; explain raw-body HMAC verification and why unsigned payment events must be rejected.
5. Run `pnpm simulator:invalid-payload`; explain runtime schema validation before queueing.
6. Run `pnpm simulator:retry-success`; show failed attempt history followed by a successful retry.
7. Run `pnpm simulator:dead-letter`; show the dead-letter page and final failed attempts.
8. Run `pnpm simulator:manual-replay`; explain operator recovery through the JSON replay route and replay audit row.
9. Return to `http://localhost:3000/dashboard` and summarize event volume, success rate, retry count, dead-letter count, and last successful event.

## Closing Line

Reliable webhook handling matters because business automations depend on external systems that can send bad, duplicate, late, or temporarily undeliverable events. This local demo shows the safeguards before connecting any real provider.
