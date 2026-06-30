# RUNBOOK.md

## Meta

- Last updated: 2026-06-30
- Owner: Local project owner
- Status: active
- Project: webhook-reliability-integration-monitor
- Repository: <repo-url-or-local-path>
- Primary environment: Windows / PowerShell

## 1. Project overview

- Purpose: Local-first portfolio project for reliable webhook handling and integration health monitoring.
- Primary users: Developers and operators evaluating webhook reliability patterns.
- Stack:
  - Runtime: Node.js + TypeScript
  - Backend: Hono API for webhook intake, health/readiness, and dashboard routes
  - Frontend: local server-rendered Hono dashboard
  - Database: PostgreSQL through Drizzle
  - Queue/worker: BullMQ worker backed by Redis
  - Infrastructure/services: Docker Compose with PostgreSQL and Redis
- Repository path:

```powershell
Set-Location -LiteralPath "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
```

- Main entry points:
  - Backend: `apps/api`
  - Worker: `apps/worker`
  - Simulator: `tools/simulator`

## 2. Operating rules

- Run commands from the repository root unless a section says otherwise.
- Use PowerShell on Windows.
- Check Git status before and after changes.
- Pull latest changes only when appropriate for the current branch and task.
- Work one phase at a time; validate before moving to the next phase.
- Do not commit `.env`, secrets, generated credentials, local databases, caches, or temporary files.
- Do not delete data, reset Git history, drop databases, or run destructive cleanup unless the action is explicitly documented and approved.

## 3. Local setup

### 3.1 Prerequisites

Document the required tool versions for this project.

| Tool           |       Required version | Check command            | Notes                                |
| -------------- | ---------------------: | ------------------------ | ------------------------------------ |
| Node.js        |            `>=24.16.0` | `node --version`         | Observed locally as `v24.16.0`.      |
| pnpm           |             `>=11.7.0` | `pnpm --version`         | `packageManager` pins `pnpm@11.7.0`. |
| Docker Compose | `v5.1.4` or compatible | `docker compose version` | Observed locally as `v5.1.4`.        |

### 3.2 Enter the project folder

```powershell
Set-Location -LiteralPath "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
git status --short
```

### 3.3 Install dependencies

Use only the commands that apply to this project.

```powershell
pnpm install
```

## 4. Environment variables

1. Copy `.env.example` to `.env` only when local environment variables are required.
2. Fill local values manually.
3. Never commit `.env` or real secrets.
4. Keep `.env.example` current with placeholder values only.

| Variable                       | Required | Description                                   | Example placeholder                                                                  |
| ------------------------------ | -------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `DATABASE_URL`                 | yes      | Local PostgreSQL connection string            | `postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor` |
| `POSTGRES_USER`                | yes      | Local PostgreSQL username                     | `webhook_monitor`                                                                    |
| `POSTGRES_PASSWORD`            | yes      | Local PostgreSQL password                     | `webhook_monitor_password`                                                           |
| `POSTGRES_DB`                  | yes      | Local PostgreSQL database                     | `webhook_monitor`                                                                    |
| `POSTGRES_PORT`                | yes      | Local PostgreSQL port                         | `5432`                                                                               |
| `REDIS_URL`                    | yes      | Local Redis connection string                 | `redis://localhost:6379`                                                             |
| `API_HOST` / `API_PORT`        | yes      | Local API bind host/port                      | `localhost` / `3000`                                                                 |
| `STRIPE_SAMPLE_WEBHOOK_SECRET` | yes      | Fake local Stripe-style sample signing secret | `whsec_local_test_secret`                                                            |
| `REAL_PROVIDER_APIS_ENABLED`   | yes      | Guardrail for real provider API usage         | `false`                                                                              |

## 5. Daily workflow

1. Open PowerShell.
2. Enter the project folder.
3. Check Git status.
4. Pull latest only if appropriate.
5. Start Codex or another coding agent from the project root, if used.
6. Work one phase at a time.
7. Run tests and quality gates.
8. Review changed files.
9. Commit manually only after validation passes.

```powershell
Set-Location -LiteralPath "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor"
git status --short
# Optional, only when safe for the current branch/task:
# git pull --ff-only
```

## 6. Start services

Replace the placeholders with the actual commands for this project. Delete unused rows.

| Service         | Purpose                    | Start command     | URL / health check                                      |
| --------------- | -------------------------- | ----------------- | ------------------------------------------------------- |
| Docker services | Local PostgreSQL and Redis | `pnpm docker:up`  | `pnpm docker:ps`                                        |
| API/dashboard   | Webhook intake and UI      | `pnpm dev:api`    | `http://localhost:3000/health`, `/readyz`, `/dashboard` |
| Worker          | BullMQ delivery processing | `pnpm dev:worker` | Worker startup log: `Worker started.`                   |

Common command block:

```powershell
pnpm docker:up
pnpm docker:ps
pnpm dev:api
pnpm dev:worker
```

## 7. Run tests

Use only the commands that apply.

```powershell
pnpm test -- --run
```

## 8. Run quality gate

The quality gate should be the default pre-commit validation command.

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test -- --run
```

Expected checks:

- Formatting
- Linting
- Type checking
- Unit tests
- Build-equivalent check through `pnpm typecheck`; no root `build` script exists

## 9. Run smoke tests

Run smoke tests after starting required services and before committing changes that affect runtime behavior.

```powershell
pnpm docker:up
pnpm docker:ps
pnpm db:migrate
pnpm demo:reset
pnpm dev:api
pnpm dev:worker
pnpm simulator:all
```

Smoke-test target:

| Area                  | Command or URL                                | Expected result                                                                      |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| PostgreSQL            | `pnpm docker:ps`                              | `postgres` service is running/healthy.                                               |
| Redis                 | `pnpm docker:ps`                              | `redis` service is running/healthy.                                                  |
| API liveness          | `http://localhost:3000/health`                | JSON response with `ok: true`.                                                       |
| API readiness         | `http://localhost:3000/readyz`                | Database and queue dependencies are `ok`.                                            |
| Dashboard             | `http://localhost:3000/dashboard`             | HTML dashboard renders.                                                              |
| Events dashboard      | `http://localhost:3000/dashboard/events`      | HTML event list renders.                                                             |
| Dead-letter dashboard | `http://localhost:3000/dashboard/dead-letter` | HTML dead-letter list renders.                                                       |
| Simulator             | `pnpm simulator:all`                          | Valid, duplicate, invalid, retry, dead-letter, and manual replay scenarios complete. |

## 10. Logs

| Source          | How to inspect                                                 | Notes                            |
| --------------- | -------------------------------------------------------------- | -------------------------------- |
| API server      | Terminal running `pnpm dev:api`                                | Look for `API server listening.` |
| Worker          | Terminal running `pnpm dev:worker`                             | Look for `Worker started.`       |
| Tests           | Test command output                                            | Vitest prints file/test counts   |
| Docker services | `docker compose -f .\infra\docker-compose.yml logs --tail=100` | Add service name when useful.    |

```powershell
# All Docker logs
docker compose -f .\infra\docker-compose.yml logs --tail=100

# Follow all Docker logs
docker compose -f .\infra\docker-compose.yml logs --tail=100 -f

# One service
docker compose -f .\infra\docker-compose.yml logs --tail=100 <service-name>
```

## 11. Debugging common issues

| Symptom                           | Likely cause                                                         | Fix                                                                                                | Validation                                           |
| --------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Port already in use               | Previous dev server or local DB/Redis using the port                 | Stop only the known process you own or change local port config                                    | Service starts successfully                          |
| Missing environment variable      | `.env` incomplete or not loaded                                      | Compare `.env` with `.env.example`                                                                 | App starts without config error                      |
| pnpm unsupported engine warning   | Codex bundled pnpm shim uses an older bundled Node than shell `node` | Use system/Corepack pnpm in manual PowerShell or update Codex runtime; do not lower project engine | `pnpm config list` user agent shows Node `>=24.16.0` |
| Simulator says API is unreachable | API is not running or wrong base URL                                 | Start `pnpm dev:api`; check `SIMULATOR_API_BASE_URL`                                               | `Invoke-RestMethod http://localhost:3000/health`     |
| Dependency command fails          | Wrong package manager or stale install                               | Verify tool versions, reinstall dependencies if approved                                           | Tests/quality gate pass                              |

## 12. Safe stop and reset

```powershell
# Stop a foreground dev server
# Press Ctrl+C in the terminal running it.

# Stop Docker services, if used
docker compose -f .\infra\docker-compose.yml down

# Reset only local demo/test app data
pnpm demo:reset
```

Do not run the following unless explicitly documented and approved for the current task:

```powershell
# Destructive examples — do not run by default
git reset --hard
git clean -fd
docker compose down -v
```

If a reset is required, document:

- Reason for reset:
- Data that will be deleted:
- Approval/source:
- Recovery or backup plan:

## 13. Dependency update guidance

- New projects: dependency installation is allowed during setup.
- Existing projects: ask before dependency upgrades or lockfile rewrites.
- Use the project’s existing package manager and lockfile.
- Record significant dependency decisions in `CONTEXT.md`, `DESIGN.md`, or the relevant project documentation.
- After dependency changes, run the quality gate and smoke tests.

## 14. Security and secret checks

Run before manual commit.

```powershell
git diff --check
git status --short
```

Check for:

- Real API keys, tokens, passwords, cookies, and private URLs
- `.env` or local credential files
- Generated secrets or certificates
- Large accidental artifacts
- Local-only paths that should not be committed

## 15. Review changed files

```powershell
git status --short
git diff -- .

# Optional helper, if present
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\git-review.ps1
```

Review rules:

- Stage only intended files.
- Do not stage unrelated formatting churn unless it is part of the task.
- Inspect generated files before committing them.
- Confirm documentation changes match code changes.

## 16. Manual commit checklist

1. Check `git status --short`.
2. Run tests relevant to the change.
3. Run the quality gate.
4. Run smoke tests if runtime behavior changed.
5. Run forbidden/secret scan.
6. Inspect `git diff`.
7. Stage only intended files.
8. Commit manually with a clear message.
9. Push manually only when appropriate.

```powershell
git status --short
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
docker compose -f .\infra\docker-compose.yml up -d
docker compose -f .\infra\docker-compose.yml ps
docker compose -f .\infra\docker-compose.yml down
git diff -- .
```

## 17. Known limitations

| ID        | Limitation     | Impact     | Workaround / decision |
| --------- | -------------- | ---------- | --------------------- |
| LIMIT-001 | `<limitation>` | `<impact>` | `<workaround>`        |
| LIMIT-002 | `<limitation>` | `<impact>` | `<workaround>`        |

## 18. Related documentation

- `README.md`: setup and high-level usage
- `CONTEXT.md`: project context and decisions
- `DESIGN.md`: architecture and design rationale
- `.env.example`: environment variable template
- `scripts/`: validation and helper scripts
