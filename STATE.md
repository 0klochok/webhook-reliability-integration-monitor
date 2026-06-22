# STATE.md

> Purpose: single source of truth for current project state, especially across contributors, AI/Codex sessions, and handoffs. Keep it brief, factual, and evidence-based. Update after any material change, validation run, blocker, decision, or phase transition.

## Meta

- Last updated: 2026-06-22 Europe/Kyiv
- Owner: Local project owner
- Contributors: Codex
- Repository path: `C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor`
- Current branch: `main`
- Current phase: Phase 7 — Reliability hardening validation closure
- Overall status: green
- Quality gate status: green; Phase 7 automated and manual runtime validation passed
- Completion: 100%
- Main blocker: none

## Update rules

- Keep entries concise: prefer paths, commands, dates, commit hashes, PRs, and direct evidence.
- Move finished work out of **Active tasks** into **Completed since last update**.
- Mark quality as **green** only when every required gate is `pass` or explicitly `n/a` with a reason.
- Any blocker must appear in **Known issues** or **Risks** with an owner and next action.
- Do not use this file as a full changelog; summarize and link to commits, PRs, logs, or docs.

## 1. Current objective

- Phase objective: Close Phase 7 reliability hardening by documenting validation results, required local env values, manual runtime checks, and troubleshooting.
- Deadline / target date: none
- Definition of done: STATE, README, manual verification checklist, and reliability hardening docs record the accepted Phase 7 gates, runtime verification, required env vars, env-related failure findings, and remaining limitations.
- Primary user-visible signal: A local user can follow the docs with `.env.example` values, start Docker/Postgres/Redis/API/worker, verify `/readyz` and `/dashboard`, and run `pnpm simulator:all` successfully.
- Secondary checks: `pnpm format:check`, docs diff review, `git status --short`, and optional lint/typecheck/test skip reasons for this docs-only cleanup.
- Out of scope: GitHub Actions, commits, pushes, tags, deployment, frontend frameworks, provider SDKs, real provider APIs, public tunnels, and paid API usage.

## 2. Status snapshot

- Summary: Phase 7 reliability hardening is accepted/complete; validation evidence and required local env setup are now being recorded in project docs/state.
- Since last update: Phase 7 added error taxonomy, config validation helpers, correlation IDs, structured logger, redaction, API/worker/env readiness checks, safe JSON errors, `/readyz`, bounded webhook body reads, local rate limiting, enqueue failure handling, correlation-aware worker logs, graceful shutdown bounds, and simulator readiness/correlation output.
- Current focus: Documentation/state cleanup only; user review and manual commit when ready.
- Main uncertainty: none known for Phase 7 validation.

## 3. Completed phases / milestones

| Phase                      | Date       | Summary                                                                                                | Quality gate | Commit / PR |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ | ------------ | ----------- |
| Phase 0 — Foundation       | 2026-06-20 | pnpm workspace scaffold and local infra config.                                                        | green        | none        |
| Phase 1 — Domain contracts | 2026-06-20 | Core provider contracts, schemas, adapters, retry policy, statuses, and fake/local signature verifier. | green        | none        |
| Phase 2 — Persistence      | 2026-06-20 | PostgreSQL persistence, Drizzle migrations, db repositories, local reset/seed, and integration tests.  | green        | none        |
| Phase 3 — Ingress API      | 2026-06-20 | Hono webhook ingress, raw-body signatures, validation, idempotency, audit history, and queue port.     | green        | none        |
| Phase 4 — Queue / worker   | 2026-06-21 | BullMQ queue, worker processing, retries, delivery attempts, and dead-letter behavior.                 | green        | none        |
| Phase 4.1 — Verification   | 2026-06-21 | Docs-only manual QA and validation-status clarification for Phase 4 webhook E2E checks.                | green        | none        |
| Phase 4.2 — QA recording   | 2026-06-21 | Docs-only recording of provided Phase 4 manual webhook E2E QA evidence and skip reasons.               | green        | none        |
| Phase 5 — Dashboard/replay | 2026-06-21 | Hono dashboard, dashboard JSON endpoints, manual replay audit, replay queue jobs, and worker replay.   | green        | none        |
| Phase 6 — Simulator/demo   | 2026-06-22 | Repeatable local simulator commands, failure scenario docs, queue reset, and replay demo behavior.     | green        | none        |
| Phase 7 — Reliability      | 2026-06-22 | Config validation, correlation IDs, safe errors, readiness, rate/body limits, redaction, and shutdown. | green        | none        |

## 4. Completed since last update

- 2026-06-20: Created pnpm workspace foundation — evidence: root `package.json`, `pnpm-workspace.yaml`, TypeScript/ESLint/Prettier/Vitest configs, and workspace package manifests.
- 2026-06-20: Added local PostgreSQL and Redis Compose config — evidence: `infra/docker-compose.yml`.
- 2026-06-20: Installed Phase 0 dev dependencies — evidence: `pnpm-lock.yaml` and root `devDependencies`.
- 2026-06-20: Completed Phase 0.1 scaffold audit and Docker validation — evidence: `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `git diff --check`, and Docker Compose commands all passed.
- 2026-06-20: Implemented Phase 1 core contracts — evidence: `packages/core/src`, `packages/core/test`, `packages/core/package.json`, and `pnpm-lock.yaml`.
- 2026-06-20: Added Phase 1 documentation updates — evidence: `README.md`, `CONTEXT.md`, and `STATE.md`.
- 2026-06-20: Implemented Phase 2 persistence — evidence: `packages/db/src`, `packages/db/drizzle`, `packages/db/test`, `drizzle.config.ts`, db scripts in `package.json`, and `pnpm-lock.yaml`.
- 2026-06-20: Validated Phase 2 locally — evidence: `pnpm install`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:reset`, `pnpm db:seed`, `pnpm test -- --run`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, Docker Compose Postgres health, and `git status --short`.
- 2026-06-20: Implemented Phase 3 webhook ingress — evidence: `apps/api/src`, `apps/api/test`, `packages/queue/src`, `packages/db/src/repositories/webhook-events.ts`, root/API scripts, `.env.example`, and `pnpm-lock.yaml`.
- 2026-06-20: Validated Phase 3 locally — evidence: `docker compose -f .\infra\docker-compose.yml up -d postgres redis`, `pnpm install`, `pnpm db:migrate`, `pnpm test -- --run`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm dev:api` health smoke passed.
- 2026-06-21: Recorded Phase 3 manual webhook ingress QA as passed — evidence: `/healthz` OK, `generic-http` fresh/duplicate/invalid-payload paths, unsupported-provider 404, `stripe-sample` local missing-secret and bad-signature paths, and final `pnpm test` pass after Docker PostgreSQL/Redis were started.
- 2026-06-21: Implemented and validated Phase 4 queue/worker behavior — evidence: `packages/queue/src`, `packages/queue/test`, `apps/worker/src`, `apps/worker/test`, API BullMQ runtime wiring, DB idempotency helpers, README/env updates, and required validation gates passing.
- 2026-06-21: Added Phase 4.1 verification docs patch — evidence: `README.md` manual QA steps and this `STATE.md` validation split.
- 2026-06-21: Added Phase 4.2 docs-only QA recording patch — evidence: `STATE.md` records provided manual QA pass evidence for success, retry-then-success, and permanent dead-letter flows; `README.md` dead-letter SQL now checks all three manual QA event IDs.
- 2026-06-21: Implemented and validated Phase 5 dashboard/manual replay — evidence: `apps/api/src/dashboard`, `packages/db/src/repositories/dashboard.ts`, replay updates in `packages/queue` and `apps/worker`, new Vitest coverage, README Phase 5 docs, and required gates passing.
- 2026-06-21: Added Phase 5 docs-only validation patch — evidence: this `STATE.md` records provided dashboard, browser, manual replay, worker, and SQL verification results; `README.md` keeps SQL examples aligned with real FK columns.
- 2026-06-22: Implemented Phase 6 simulator/demo behavior — evidence: `tools/simulator/src`, `tools/simulator/test`, root simulator scripts, `docs/demo-script.md`, `docs/failure-scenarios.md`, `docs/manual-verification-checklist.md`, README Phase 6 docs, local queue reset script, and worker replay-demo behavior.
- 2026-06-22: Completed non-Docker Phase 6 validation — evidence: `pnpm install`, `pnpm db:generate`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, simulator tests, non-Redis/non-Postgres Vitest slice, and API-unreachable simulator smoke check.
- 2026-06-22: Completed Phase 6 validation — evidence: `pnpm install`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, Docker-backed PostgreSQL/Redis/API/worker/simulator validation, and manual dashboard verification passed; `pnpm build` was skipped/not applicable because no root `build` script exists (`Command "build" not found`); no commit, push, tag, or remote changes were made.
- 2026-06-22: Implemented Phase 7 reliability hardening — evidence: core error taxonomy, config validation helpers, correlation IDs, structured logger, secret redaction, API env validation, `x-request-id` middleware, safe JSON errors with `correlationId`, `/readyz`, bounded webhook body reader, local webhook rate limiter, queue enqueue failure handling, queue/DB URL validation and readiness helpers, worker config/readiness checks, correlation-aware worker logs, timeout-bounded graceful shutdown, and simulator `/readyz` preflight/correlation output.
- 2026-06-22: Accepted Phase 7 validation closure — evidence: automated gates passed (`pnpm install`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm format`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test -- --run`); manual runtime verification passed with Docker PostgreSQL/Redis, `pnpm dev:api`, `pnpm dev:worker`, HTTP 200 from `/readyz` and `/dashboard`, and successful `pnpm simulator:all`.
- 2026-06-22: Recorded Phase 7 env findings — evidence: local runtime requires exact `.env.example` values for `DATABASE_URL`, `REDIS_URL`, and `STRIPE_SAMPLE_WEBHOOK_SECRET`; earlier manual failures were caused by missing or incorrect local environment variables, not Phase 7 implementation defects.

## 5. Changed files

| Path                                                                                              | Purpose                              | Status  | Notes                                                                                                                    |
| ------------------------------------------------------------------------------------------------- | ------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `package.json`, `pnpm-workspace.yaml`                                                             | Root pnpm workspace and scripts      | created | No runtime app dependencies added.                                                                                       |
| `tsconfig.base.json`, `tsconfig.json`                                                             | TypeScript baseline                  | created | ESM-oriented Node TypeScript config.                                                                                     |
| `eslint.config.js`, `.prettierrc.json`                                                            | Lint and format tooling              | created | ESLint flat config and Prettier config.                                                                                  |
| `.gitignore`, `.editorconfig`, `.env.example`                                                     | Local repository defaults            | created | `.env.example` contains fake values only.                                                                                |
| `apps/*`, `packages/*`, `tools/simulator`                                                         | Future workspace package directories | created | Package manifests only; no source code.                                                                                  |
| `infra/docker-compose.yml`                                                                        | Local PostgreSQL and Redis services  | created | Named volumes and health checks.                                                                                         |
| `README.md`, `CONTEXT.md`, `RUNBOOK.md`                                                           | Setup and workflow documentation     | updated | Phase 0 commands and constraints.                                                                                        |
| `REQ.md`, `DESIGN.md`, `TDD.md`, `STATE.md`                                                       | Existing templates                   | updated | Formatted by Prettier.                                                                                                   |
| `packages/core/src`                                                                               | Core domain contracts                | created | Pure TypeScript only; no ingress, DB, queue, or provider SDK.                                                            |
| `packages/core/test`                                                                              | Core unit tests                      | created | Covers provider IDs, statuses, schemas, retry policy, adapters, and fake signature verification.                         |
| `packages/core/package.json`, `pnpm-lock.yaml`                                                    | Core dependency metadata             | updated | Adds `zod` scoped to `@webhook-monitor/core`.                                                                            |
| `drizzle.config.ts`                                                                               | Drizzle Kit config                   | created | Used by db package scripts; reads `.env` or fake local `.env.example` values.                                            |
| `packages/db/src`                                                                                 | Persistence implementation           | created | Schema, client, migration runner, repositories, reset/seed helpers, and local safety checks.                             |
| `packages/db/drizzle`                                                                             | Generated migrations                 | created | Initial Drizzle migration and metadata for Phase 2 tables/enums/indexes.                                                 |
| `packages/db/test`                                                                                | DB integration tests                 | created | Covers migrations, repositories, idempotency, history, attempts, dead letters, replays, safety.                          |
| `packages/db/package.json`, `pnpm-lock.yaml`                                                      | DB dependencies and scripts          | updated | Adds Drizzle, postgres.js, dotenv, drizzle-kit, tsx, and `@webhook-monitor/core`.                                        |
| `.env.example`, `README.md`                                                                       | Local env/docs                       | updated | Adds `POSTGRES_PORT` and Phase 2 local database instructions.                                                            |
| `apps/api/src`                                                                                    | Hono API implementation              | created | App factory, server, config, routes, ingest service, rejection handling, and test harness.                               |
| `apps/api/test`                                                                                   | API integration tests                | created | Covers health, valid providers, signatures, invalid inputs, idempotency, and unsupported provider.                       |
| `packages/queue/src`                                                                              | Queue placeholder port               | created | Dependency-free `DeliveryQueuePort` and no-op implementation; no BullMQ or Redis behavior.                               |
| `packages/db/src/repositories/webhook-events.ts`                                                  | Phase 3 persistence helper           | updated | Adds idempotent create with initial status history for API ingress.                                                      |
| `package.json`, `apps/api/package.json`                                                           | API scripts and dependencies         | updated | Adds `dev:api`, API package scripts, Hono, node-server adapter, workspace deps, and `tsx`.                               |
| `.env.example`, `README.md`, `STATE.md`                                                           | Phase 3 local docs/status            | updated | Adds API port/host, fake Stripe sample secret, manual API examples, and validation state.                                |
| `packages/db/package.json`, `packages/db/src/test-utils/index.ts`                                 | DB test utility export               | updated | Exposes Phase 2 database test helpers for API integration tests.                                                         |
| `vitest.config.ts`                                                                                | Test runner stability                | updated | Disables file parallelism to prevent shared local DB cleanup races.                                                      |
| `packages/queue/src`, `packages/queue/test`                                                       | BullMQ queue boundary                | updated | Adds delivery job contract, Redis helpers, stable job IDs, retry/backoff mapping, worker factory, and tests.             |
| `apps/worker/src`, `apps/worker/test`, `apps/worker/package.json`                                 | Worker runtime                       | created | Adds worker config, processor, mock downstream client, graceful shutdown, BullMQ integration tests, and scripts.         |
| `apps/api/src`, `apps/api/test`                                                                   | API queue wiring                     | updated | Runtime uses BullMQ queue; tests retain injectable fake queue and no-enqueue assertions.                                 |
| `packages/db/src/repositories`, `packages/db/test`                                                | Worker persistence helpers           | updated | Adds idempotent delivery-attempt and dead-letter helpers with tests; no schema migration needed.                         |
| `.env.example`, `README.md`, `STATE.md`                                                           | Phase 4 local docs/status            | updated | Adds fake worker/retry/mock downstream values and manual Phase 4 verification instructions.                              |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`                                           | Phase 4 scripts/dependencies         | updated | Adds BullMQ/ioredis/zod queue dependencies, worker scripts, and explicit pnpm build policy.                              |
| `README.md`, `STATE.md`                                                                           | Phase 4.1 verification docs/status   | updated | Clarifies manual webhook E2E QA, SQL inspection, and validation categories; no product code changes.                     |
| `README.md`, `STATE.md`                                                                           | Phase 4.2 manual QA evidence record  | updated | Docs-only patch recording provided manual QA evidence and skip reasons; no product/test/dependency changes.              |
| `apps/api/src/dashboard`, `apps/api/test/dashboard.test.ts`                                       | Phase 5 dashboard routes and tests   | updated | Server-rendered Hono dashboard, JSON endpoints, safe HTML rendering, and replay route tests.                             |
| `packages/db/src/repositories/dashboard.ts`, db repository tests                                  | Phase 5 dashboard persistence APIs   | updated | Summary/list/detail/dead-letter queries, replay eligibility, replay audit creation, and metric tests.                    |
| `packages/queue`, `apps/worker`                                                                   | Phase 5 replay queue/worker support  | updated | Replay job metadata/IDs and worker replay success/failure audit behavior.                                                |
| `README.md`, `STATE.md`                                                                           | Phase 5 manual QA docs record        | updated | Docs-only validation patch; no runtime code, tests, dependencies, migrations, workspace, or infra changes.               |
| `STATE.md`                                                                                        | Phase 6 validation evidence          | updated | Docs/state-only patch records Phase 6 gate pass evidence, `pnpm build` n/a, and no Git history/remote actions.           |
| `README.md`, `docs/manual-verification-checklist.md`, `docs/reliability-hardening.md`, `STATE.md` | Phase 7 validation closure           | updated | Docs/state-only cleanup records passed gates, manual runtime verification, required env values, and env troubleshooting. |

## 6. Validation and quality gates

### Required gates

### Phase 7 reliability hardening validation

| Gate               | Command / check                                                     | Status | Evidence / notes                                                                                  |
| ------------------ | ------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| install            | `pnpm install`                                                      | pass   | Completed during Phase 7 validation.                                                              |
| migration generate | `pnpm db:generate`                                                  | pass   | Completed during Phase 7 validation.                                                              |
| migration apply    | `pnpm db:migrate`                                                   | pass   | Requires `DATABASE_URL` to match the local Docker Postgres credentials from `.env.example`.       |
| format write       | `pnpm format`                                                       | pass   | Completed during Phase 7 validation.                                                              |
| format check       | `pnpm format:check`                                                 | pass   | Completed during Phase 7 validation.                                                              |
| lint               | `pnpm lint`                                                         | pass   | Completed during Phase 7 validation.                                                              |
| typecheck          | `pnpm typecheck`                                                    | pass   | Completed during Phase 7 validation.                                                              |
| tests              | `pnpm test -- --run`                                                | pass   | Completed during Phase 7 validation.                                                              |
| Docker services    | `docker compose -f .\infra\docker-compose.yml up -d postgres redis` | pass   | Local PostgreSQL and Redis started successfully.                                                  |
| API runtime        | `pnpm dev:api`                                                      | pass   | Started successfully with `DATABASE_URL`, `REDIS_URL`, and `STRIPE_SAMPLE_WEBHOOK_SECRET` loaded. |
| Worker runtime     | `pnpm dev:worker`                                                   | pass   | Started successfully with `DATABASE_URL` and `REDIS_URL` loaded.                                  |
| readiness endpoint | `curl.exe -i ... http://localhost:3000/readyz`                      | pass   | Returned HTTP `200`.                                                                              |
| dashboard endpoint | `curl.exe -i ... http://localhost:3000/dashboard`                   | pass   | Returned HTTP `200`.                                                                              |
| simulator full run | `pnpm simulator:all`                                                | pass   | Completed successfully after API restart with `STRIPE_SAMPLE_WEBHOOK_SECRET` loaded.              |
| Git safety         | commit/push/tag/remote changes                                      | n/a    | No commit, push, tag, or remote changes were made.                                                |

### Phase 7 env requirements and findings

| Item                           | Status                                      | Evidence / notes                                                                                                                        |
| ------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | required                                    | Use exact `.env.example` value: `postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor`.                   |
| `REDIS_URL`                    | required                                    | Use exact `.env.example` value: `redis://localhost:6379`.                                                                               |
| `STRIPE_SAMPLE_WEBHOOK_SECRET` | required for simulator/webhook verification | Use exact `.env.example` value: `whsec_local_test_secret`; restart the API after setting it.                                            |
| Missing API env vars           | verified                                    | `pnpm dev:api` fails with `ConfigValidationError` when `DATABASE_URL` or `REDIS_URL` is missing.                                        |
| Wrong database credentials     | verified                                    | `pnpm db:migrate` and `pnpm dev:worker` fail when `DATABASE_URL` does not match local Postgres credentials.                             |
| Missing API signature secret   | verified                                    | `pnpm simulator:all` fails with `misconfigured_signature_secret` when the API process lacks `STRIPE_SAMPLE_WEBHOOK_SECRET`.             |
| Earlier manual failures        | resolved                                    | Failures were caused by missing or incorrect local environment variables, not Phase 7 implementation defects.                           |
| Remaining limitation           | accepted                                    | Webhook rate limiting is in-memory and API-process-local; dashboard remains unauthenticated/local-only; no real provider APIs are used. |

### Phase 7 optional / skipped gates

| Gate                    | Status  | Reason                                                                                              | Follow-up                                                                 |
| ----------------------- | ------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| production deployment   | skipped | Explicitly out of scope; no deployment, public tunnel, process manager, or hosted infrastructure.   | Revisit only in an approved later phase.                                  |
| GitHub Actions          | skipped | Explicitly out of scope; local validation remains the default.                                      | Add only if explicitly requested in a later phase.                        |
| external observability  | skipped | Explicitly out of scope; no vendor SDKs or hosted services added.                                   | Revisit only with approved production-readiness scope.                    |
| real provider API calls | skipped | Mock/no-paid-API mode remains required; no real Stripe, Shopify, Calendly, HubSpot, or CRM secrets. | Use fake local provider data until real API usage is explicitly approved. |

### Phase 6 simulator/demo validation

| Gate             | Command / check                                                     | Status  | Evidence / notes                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| install          | `pnpm install`                                                      | pass    | Phase 6 validation evidence records install completed successfully.                                                                                                                                                                                                        |
| Docker services  | `docker compose -f .\infra\docker-compose.yml up -d postgres redis` | pass    | Docker-backed PostgreSQL and Redis validation passed for the local Phase 6 demo gate.                                                                                                                                                                                      |
| migration apply  | `pnpm db:migrate`                                                   | pass    | Database migration gate passed before demo reset and simulator validation.                                                                                                                                                                                                 |
| demo reset       | `pnpm demo:reset`                                                   | pass    | Local database tables and BullMQ queue were reset for repeatable simulator validation.                                                                                                                                                                                     |
| format           | `pnpm format:check`                                                 | pass    | Formatting gate passed.                                                                                                                                                                                                                                                    |
| lint             | `pnpm lint`                                                         | pass    | ESLint gate passed.                                                                                                                                                                                                                                                        |
| typecheck        | `pnpm typecheck`                                                    | pass    | TypeScript project-reference gate passed.                                                                                                                                                                                                                                  |
| tests            | `pnpm test`                                                         | pass    | Vitest gate passed.                                                                                                                                                                                                                                                        |
| API smoke        | `pnpm dev:api`                                                      | pass    | API process started for Docker-backed simulator and dashboard validation.                                                                                                                                                                                                  |
| worker smoke     | `pnpm dev:worker`                                                   | pass    | Worker process started for Docker-backed simulator validation.                                                                                                                                                                                                             |
| simulator smoke  | `pnpm simulator:all`                                                | pass    | Full local simulator flow passed across success, duplicate, invalid signature/payload, retry, dead-letter, permanent failure, and manual replay scenarios.                                                                                                                 |
| dashboard manual | manual browser/dashboard verification                               | pass    | Dashboard verification passed for event volume, success rate, failed events, retry count, dead-letter visibility, manual replay, and last successful event signals.                                                                                                        |
| build            | `pnpm build`                                                        | skipped | Not applicable: no `build` script exists in the root `package.json`; direct run returned `Command "build" not found`. Current Phase 6 gate uses format, lint, typecheck, tests, Docker-backed DB/Redis/API/worker/simulator validation, and manual dashboard verification. |
| Git safety       | commit/push/tag/remote changes                                      | n/a     | No commit, push, tag, or remote changes were made.                                                                                                                                                                                                                         |

### Phase 5 dashboard and manual replay validation

| Gate               | Command                                                             | Status  | Evidence / notes                                                                                     |
| ------------------ | ------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| Docker services    | `docker compose -f .\infra\docker-compose.yml up -d postgres redis` | pass    | `webhook-monitor-postgres` and `webhook-monitor-redis` were already/running.                         |
| install            | `pnpm install`                                                      | pass    | Scope all 7 workspace projects; already up to date with pnpm `v11.7.0`.                              |
| migration generate | `pnpm db:generate`                                                  | pass    | Drizzle reported no schema changes and generated no new migration.                                   |
| migration apply    | `pnpm db:migrate`                                                   | pass    | Existing migrations applied; Drizzle metadata notices were non-blocking already-exists notices.      |
| tests              | `pnpm test -- --run`                                                | pass    | Final Vitest run: 15 test files and 94 tests passed.                                                 |
| format             | `pnpm format:check`                                                 | pass    | `All matched files use Prettier code style!`.                                                        |
| lint               | `pnpm lint`                                                         | pass    | `eslint .` completed with exit code 0 after fixing one unused local helper binding.                  |
| typecheck          | `pnpm typecheck`                                                    | pass    | `tsc -b --pretty false` completed with exit code 0.                                                  |
| dev commands       | `pnpm dev:api`; `pnpm dev:worker`                                   | skipped | Not started during automated validation because both are intentionally long-running local processes. |

### Phase 5 manual dashboard and replay QA record

| Check                         | Status | Evidence / notes                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API/dashboard process         | pass   | Provided manual QA evidence: `pnpm dev:api` started successfully, API listened on port `3000`, and `http://localhost:3000` was used for manual checks. `GET /health` returned `not_found`; this is not a Phase 5 blocker because the dashboard/API routes were reachable.                                                                                                  |
| HTML dashboard routes         | pass   | `GET /dashboard`, `GET /dashboard/events`, and `GET /dashboard/dead-letter` returned HTTP `200`. Windows PowerShell checks required `Invoke-WebRequest -UseBasicParsing` for HTML routes.                                                                                                                                                                                  |
| JSON dashboard routes         | pass   | `GET /api/dashboard/summary`, `GET /api/dashboard/events`, and `GET /api/dashboard/dead-letter` returned structured JSON with no errors.                                                                                                                                                                                                                                   |
| Browser QA                    | pass   | `/dashboard`, `/dashboard/events`, and `/dashboard/dead-letter` rendered normally in the browser. After running the README manual E2E flow, all dashboard pages showed real event data and no empty-state-only view.                                                                                                                                                       |
| Worker startup                | pass   | Provided manual QA evidence: `pnpm dev:worker` started successfully.                                                                                                                                                                                                                                                                                                       |
| Manual replay request         | pass   | Replay was tested against event `39b6bb72-baa1-4afa-b76d-50408cd2e0d4`, external event id `generic-phase4-dead-letter-1`, with initial status `dead_lettered`. The replay API returned `ok: true` and `initialAttemptNumber: 2`.                                                                                                                                           |
| Manual replay queue           | pass   | Manual replay id `7f924441-f26c-4782-839d-66bc8297f521` created queue job id `delivery-replay-7f924441-f26c-4782-839d-66bc8297f521`; the worker processed that replay job.                                                                                                                                                                                                 |
| Permanent replay failure path | pass   | Worker logged expected permanent mock failure: `Mock downstream permanent failure.` The original event remained `dead_lettered`, which is expected for this permanent-failure demo event. Dashboard pages still rendered after replay failure.                                                                                                                             |
| Manual replay audit row       | pass   | `manual_replays.status` became `failed`; `manual_replays.completed_at` was set; metadata recorded `errorCode=MOCK_DOWNSTREAM_PERMANENT`, `errorMessage=Mock downstream permanent failure.`, `attemptNumber=2`, and `queueJobId=delivery-replay-7f924441-f26c-4782-839d-66bc8297f521`.                                                                                      |
| Delivery attempt verification | pass   | Schema check: `delivery_attempts.event_id` is the correct FK column; the earlier suspected webhook-event FK alias does not exist. SQL confirmed two attempts for event `39b6bb72-baa1-4afa-b76d-50408cd2e0d4`: attempt 1 and attempt 2 were both `failed_permanent`, HTTP `400`, `MOCK_DOWNSTREAM_PERMANENT`. This confirms manual replay did not reset attempt numbering. |

### Phase 5 docs-only validation patch

| Gate               | Command                                             | Status  | Evidence / notes                                                                                    |
| ------------------ | --------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| docs SQL search    | Requested README/STATE invalid SQL reference search | pass    | Returned no matches after README SQL formatting cleanup.                                            |
| format             | `pnpm format:check`                                 | pass    | Initial check found `STATE.md` formatting; targeted Prettier write fixed it and final check passed. |
| tests              | `pnpm test -- --run`                                | skipped | Docs-only patch; no runtime code, test code, schema, or dependency files changed.                   |
| lint               | `pnpm lint`                                         | skipped | Docs-only patch; no runtime code, test code, schema, or dependency files changed.                   |
| typecheck          | `pnpm typecheck`                                    | skipped | Docs-only patch; no runtime code, test code, schema, or dependency files changed.                   |
| Docker/API/worker  | `docker compose`, `pnpm dev:api`, `pnpm dev:worker` | skipped | This patch records already-provided manual QA evidence and does not require rerunning services.     |
| dependency install | `pnpm install`                                      | skipped | No dependency or lockfile changes.                                                                  |
| git status         | `git status --short`                                | pass    | Shows existing Phase 5 working tree plus docs changes; no staging, commit, push, or remote action.  |

### Phase 4.2 docs-only QA recording patch validation

| Gate            | Command                                             | Status | Evidence / notes                                                                                   |
| --------------- | --------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| Docker services | `docker compose -f .\infra\docker-compose.yml ps`   | pass   | `webhook-monitor-postgres` and `webhook-monitor-redis` are `Up` and `healthy`.                     |
| diff whitespace | `git diff --check`                                  | pass   | Exit code 0; Git reported only LF-to-CRLF working-copy warnings for `README.md` and `STATE.md`.    |
| format          | `pnpm format:check`                                 | pass   | `All matched files use Prettier code style!`.                                                      |
| lint            | `pnpm lint`                                         | pass   | `eslint .` completed with exit code 0.                                                             |
| typecheck       | `pnpm typecheck`                                    | pass   | `tsc -b --pretty false` completed with exit code 0.                                                |
| tests           | `pnpm test -- --run`                                | pass   | Vitest: 14 test files and 72 tests passed.                                                         |
| build           | `pnpm -r --if-present build`                        | pass   | Exit code 0; pnpm reported `Scope: 6 of 7 workspace projects` with no package build-script output. |
| docs format fix | `pnpm exec prettier --write .\README.md .\STATE.md` | pass   | Targeted Prettier write touched only docs; `README.md` was unchanged and `STATE.md` was formatted. |
| git status      | `git status --short`                                | pass   | Final expected working tree: `README.md` and `STATE.md` modified only.                             |

### Phase 4 automated checks

| Gate            | Command              | Status | Evidence / notes                                                                                                                    |
| --------------- | -------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| install         | `pnpm install`       | pass   | Lockfile was up to date after dependency additions; pnpm `v11.7.0`.                                                                 |
| migration gen   | `pnpm db:generate`   | pass   | Drizzle reported no schema changes and nothing to migrate.                                                                          |
| migration apply | `pnpm db:migrate`    | pass   | Existing Drizzle schema/migration tables detected; migrations applied successfully.                                                 |
| tests           | `pnpm test -- --run` | pass   | Final Vitest run: 14 test files and 72 tests passed. Initial run exposed BullMQ job-id and test-ordering issues, then rerun passed. |
| format          | `pnpm format:check`  | pass   | Final run: `All matched files use Prettier code style!`; first run identified 9 files and targeted formatting fixed them.           |
| lint            | `pnpm lint`          | pass   | `eslint .` completed with exit code 0.                                                                                              |
| typecheck       | `pnpm typecheck`     | pass   | Final `tsc -b --pretty false` completed with exit code 0 after fixing BullMQ/ioredis type boundaries.                               |
| git status      | `git status --short` | pass   | Shows intended Phase 4 modified/untracked files only.                                                                               |

### Phase 4 boot smoke checks

| Gate            | Command                                                             | Status | Evidence / notes                                                                        |
| --------------- | ------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Docker services | `docker compose -f .\infra\docker-compose.yml up -d postgres redis` | pass   | `webhook-monitor-postgres` and `webhook-monitor-redis` were already running.            |
| dev API smoke   | `pnpm dev:api` plus `GET http://localhost:3000/healthz`             | pass   | Started hidden process, `/healthz` returned expected JSON, then stopped process `8276`. |
| worker smoke    | `pnpm dev:worker`                                                   | pass   | Started hidden process, readiness log appeared, then stopped process `22932`.           |

### Phase 4 manual E2E webhook QA

| Check                         | Status  | Evidence / notes                                                                                                                                                                                                                                                                                                                                                                                                          | Follow-up                                                                                                    |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| success webhook               | pass    | Provided local API/worker manual QA evidence for `generic-phase4-success-1`: `current_status=delivered`, `last_successful_at` present; delivery attempt 1 `succeeded` with HTTP `200`; status history followed `received -> validated -> queued -> processing -> delivered`.                                                                                                                                              | Keep README SQL available for repeat manual verification.                                                    |
| retry-then-success webhook    | pass    | Provided local API/worker manual QA evidence for `generic-phase4-retry-1`: `current_status=delivered`, `last_successful_at` present; attempt 1 `failed_retryable` with HTTP `503` and `error_code=MOCK_DOWNSTREAM_RETRYABLE`; attempt 2 `succeeded` with HTTP `200`; status history followed `received -> validated -> queued -> processing -> retry_scheduled -> processing -> delivered`.                               | Keep README SQL available for repeat manual verification.                                                    |
| permanent-failure dead letter | pass    | Provided local API/worker manual QA evidence for `generic-phase4-dead-letter-1`: `current_status=dead_lettered`, `last_successful_at` null; attempt 1 `failed_permanent` with HTTP `400` and `error_code=MOCK_DOWNSTREAM_PERMANENT`; status history followed `received -> validated -> queued -> processing -> dead_lettered`; dead-letter row has `reason_code=permanent_delivery_failure` and `final_attempt_number=1`. | Keep README SQL available for repeat manual verification.                                                    |
| retry-exhaustion dead letter  | skipped | Optional variant was not run because retry exhaustion was not included in the provided Phase 4 manual QA evidence.                                                                                                                                                                                                                                                                                                        | Run README retry-exhaustion variant manually in a later QA pass if desired.                                  |
| DB record inspection          | pass    | Provided SQL inspection evidence covered `webhook_events`, `delivery_attempts`, `event_status_history`, and `dead_letter_events` for the three manual QA event IDs. `tools/simulator` currently contains only a package manifest, and there is no dedicated simulator CLI or fully automated manual-QA helper yet.                                                                                                        | Use README SQL or interactive `pnpm db:studio` inspection for future manual QA; `db:studio` is non-blocking. |

### Phase 4 skipped / out-of-scope checks

| Gate                                  | Status  | Reason                                                                                                                    | Follow-up                                       |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| retry-exhaustion variant              | skipped | Optional scenario was not run because it was not included in the provided Phase 4 manual QA evidence.                     | Revisit only if a later QA pass needs it.       |
| `pnpm db:studio`                      | skipped | Script is available for interactive inspection, but it is not a blocking validation command because it is long-running.   | Use manually for table inspection if useful.    |
| graceful shutdown manual verification | skipped | No explicit Phase 4.2 manual QA evidence was provided for graceful shutdown; do not record it as manually verified.       | Verify separately if it becomes a release gate. |
| dedicated simulator/manual-QA helper  | n/a     | No dedicated simulator CLI or fully automated manual-QA helper exists yet; `tools/simulator` has only a package manifest. | Revisit in a simulator phase.                   |
| dashboard/manual replay               | n/a     | Explicitly out of scope for Phase 4.                                                                                      | Revisit in later phases.                        |
| GitHub Actions                        | n/a     | Explicitly out of scope; local validation remains the default.                                                            | Add only in a later approved phase.             |
| real provider APIs                    | n/a     | Explicitly out of scope; mock-only behavior and fake local values only.                                                   | Requires explicit approval.                     |

### Phase 3 required gates

| Gate            | Command                                                             | Status | Evidence / notes                                                                         |
| --------------- | ------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Docker services | `docker compose -f .\infra\docker-compose.yml up -d postgres redis` | pass   | Postgres was already running; Redis was created/started successfully.                    |
| install         | `pnpm install`                                                      | pass   | Scope all 7 workspace projects; added Hono/node-server packages; pnpm `v11.7.0`.         |
| migration apply | `pnpm db:migrate`                                                   | pass   | Existing Drizzle schema/migration tables detected; migrations applied successfully.      |
| tests           | `pnpm test -- --run`                                                | pass   | Vitest: 8 test files and 53 tests passed on final run.                                   |
| format          | `pnpm format:check`                                                 | pass   | Final run: `All matched files use Prettier code style!`.                                 |
| lint            | `pnpm lint`                                                         | pass   | `eslint .` completed with exit code 0 after removing two useless assignments.            |
| typecheck       | `pnpm typecheck`                                                    | pass   | `tsc -b --pretty false` completed with exit code 0.                                      |
| dev API smoke   | `pnpm dev:api` plus `GET http://localhost:3000/healthz`             | pass   | Started hidden process, `/healthz` returned expected JSON, then stopped process `11788`. |
| git status      | `git status --short`                                                | pass   | Final run shows expected Phase 3 modified/untracked files only.                          |

### Phase 3 manual QA record

| Check                                      | Status | Evidence / notes                                                                                                                                                                 |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /healthz`                             | pass   | Returned OK.                                                                                                                                                                     |
| `generic-http` fresh valid event           | pass   | Accepted.                                                                                                                                                                        |
| `generic-http` repeated same event         | pass   | Returned `duplicate_ignored` with `duplicate=true`.                                                                                                                              |
| malformed `generic-http` payload           | pass   | Rejected with `invalid_payload`.                                                                                                                                                 |
| unsupported provider                       | pass   | Rejected with HTTP `404` and `error.code=unsupported_provider`.                                                                                                                  |
| `stripe-sample` before local secret config | pass   | Missing signature secret returned `misconfigured_signature_secret`.                                                                                                              |
| `stripe-sample` after local secret config  | pass   | Bad signature returned HTTP `401` and `error.code=invalid_signature`.                                                                                                            |
| final test run                             | pass   | `pnpm test` passed after Docker PostgreSQL/Redis were started.                                                                                                                   |
| earlier failed test run                    | noted  | Earlier `pnpm test` failure was caused by local PostgreSQL not running, not by application logic.                                                                                |
| Phase 3 scope limitations                  | noted  | Queue remains a placeholder; no BullMQ/Redis worker behavior, real provider SDKs, paid APIs, or external provider integrations. Stripe verification is fake/local demo behavior. |

### Phase 3 optional / skipped gates

| Gate                | Status | Reason                                           | Follow-up                     |
| ------------------- | ------ | ------------------------------------------------ | ----------------------------- |
| manual webhook QA   | pass   | Phase 3 manual webhook ingress QA record passed. | Use README examples manually. |
| BullMQ/worker/retry | n/a    | Explicitly out of scope for Phase 3.             | Revisit in Phase 4.           |
| dashboard/simulator | n/a    | Explicitly out of scope for Phase 3.             | Revisit in later phases.      |

### Phase 2 required gates

| Gate               | Command                                                       | Status | Evidence / notes                                                        |
| ------------------ | ------------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Postgres start     | `docker compose -f .\infra\docker-compose.yml up -d postgres` | pass   | Created/started `webhook-monitor-postgres`.                             |
| install            | `pnpm install`                                                | pass   | Scope all 7 workspace projects; already up to date on final run.        |
| migration generate | `pnpm db:generate`                                            | pass   | Initial migration generated; final rerun reported no schema changes.    |
| migration apply    | `pnpm db:migrate`                                             | pass   | Drizzle migrations applied using fake local `.env.example` values.      |
| reset              | `pnpm db:reset`                                               | pass   | Local-only reset truncated application tables and preserved migrations. |
| seed               | `pnpm db:seed`                                                | pass   | Fake deterministic demo records seeded through local-only safety path.  |
| tests              | `pnpm test -- --run`                                          | pass   | Vitest: 7 test files and 43 tests passed.                               |
| format             | `pnpm format:check`                                           | pass   | `All matched files use Prettier code style!`.                           |
| lint               | `pnpm lint`                                                   | pass   | `eslint .` completed with exit code 0.                                  |
| typecheck          | `pnpm typecheck`                                              | pass   | `tsc -b --pretty false` completed with exit code 0.                     |
| Docker ps          | `docker compose -f .\infra\docker-compose.yml ps`             | pass   | `webhook-monitor-postgres` was `Up` and `healthy` on `5432`.            |
| git status         | `git status --short`                                          | pass   | Shows intended Phase 2 modified/untracked files only.                   |

### Phase 2 optional / skipped gates

| Gate       | Status  | Reason                                                                       | Follow-up                                       |
| ---------- | ------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| db studio  | skipped | `pnpm db:studio` is manual and may keep a long-running process open.         | Use manually to inspect local tables if needed. |
| API/worker | n/a     | Phase 2 intentionally does not implement ingress, queue, or worker behavior. | Revisit in Phase 3+.                            |

### Phase 1 required gates

| Gate       | Command              | Status | Evidence / notes                                    |
| ---------- | -------------------- | ------ | --------------------------------------------------- |
| install    | `pnpm install`       | pass   | Lockfile up to date after adding `zod`.             |
| format     | `pnpm format:check`  | pass   | All matched files use Prettier code style.          |
| lint       | `pnpm lint`          | pass   | ESLint completed with exit code 0.                  |
| typecheck  | `pnpm typecheck`     | pass   | `tsc -b --pretty false` completed with exit code 0. |
| unit tests | `pnpm test -- --run` | pass   | Vitest: 6 test files and 33 tests passed.           |
| Docker     | not run              | n/a    | Phase 1 did not touch `infra` or require services.  |
| git status | `git status --short` | pass   | Shows only intended Phase 1 working-tree changes.   |

| Gate              | Command                                                                                                          | Status | Evidence / notes                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| install           | `pnpm install --frozen-lockfile`                                                                                 | pass   | Scope: all 7 workspace projects; `Already up to date`; completed with pnpm `v11.7.0`.                                       |
| format            | `pnpm format:check`                                                                                              | pass   | `All matched files use Prettier code style!`.                                                                               |
| lint              | `pnpm lint`                                                                                                      | pass   | `eslint .` completed with exit code 0.                                                                                      |
| typecheck         | `pnpm typecheck`                                                                                                 | pass   | `tsc -b --pretty false` completed with exit code 0.                                                                         |
| unit tests        | `pnpm test`                                                                                                      | pass   | Vitest `v4.1.9` found no test files and exited with code 0, which is expected for scaffold-only Phase 0.                    |
| integration tests | `TBD`                                                                                                            | n/a    | No application or integration behavior exists in Phase 0.                                                                   |
| build             | `TBD`                                                                                                            | n/a    | No buildable app artifact exists in Phase 0.                                                                                |
| Docker version    | `docker version`                                                                                                 | pass   | Client/server Docker Engine `29.5.3`; Docker Desktop `4.78.0`; context `desktop-linux`.                                     |
| Compose config    | `docker compose -f .\infra\docker-compose.yml config`                                                            | pass   | Rendered valid config for services `postgres` and `redis`, network, and named volumes.                                      |
| Compose up        | `docker compose -f .\infra\docker-compose.yml up -d`                                                             | pass   | Created network and started `webhook-monitor-postgres` and `webhook-monitor-redis`.                                         |
| Compose ps        | `docker compose -f .\infra\docker-compose.yml ps`                                                                | pass   | `postgres` and `redis` were both `Up` and `healthy`; ports `5432` and `6379` published locally.                             |
| PostgreSQL health | `docker compose -f .\infra\docker-compose.yml exec -T postgres pg_isready -U webhook_monitor -d webhook_monitor` | pass   | `/var/run/postgresql:5432 - accepting connections`.                                                                         |
| Redis health      | `docker compose -f .\infra\docker-compose.yml exec -T redis redis-cli ping`                                      | pass   | `PONG`.                                                                                                                     |
| Compose logs      | `docker compose -f .\infra\docker-compose.yml logs --tail=50`                                                    | pass   | PostgreSQL reported ready to accept connections; Redis reported ready to accept TCP connections.                            |
| Compose down      | `docker compose -f .\infra\docker-compose.yml down`                                                              | pass   | Stopped and removed both containers and the Compose network.                                                                |
| diff whitespace   | `git diff --check`                                                                                               | pass   | No whitespace errors reported.                                                                                              |
| docs check        | manual review                                                                                                    | pass   | README, runbook, and state reflect Phase 0 setup and no real provider API policy.                                           |
| secret scan       | `rg -n --pcre2 --glob "*.md" --glob ".env.example" "<secret-patterns>"`                                          | pass   | No real API keys, tokens, private keys, or non-local signing secrets found; `.env.example` contains fake local-only values. |
| dependency audit  | package manifest review; `pnpm list --depth 0 --recursive`                                                       | pass   | Only root dev tooling is installed; workspace package manifests contain no runtime app dependencies.                        |

### Optional / skipped gates

| Gate          | Status | Reason                                      | Follow-up                           |
| ------------- | ------ | ------------------------------------------- | ----------------------------------- |
| e2e           | n/a    | No runnable app or browser flow in Phase 0. | Revisit when dashboard/API exists.  |
| performance   | n/a    | No runtime behavior in Phase 0.             | Revisit after worker/API are built. |
| accessibility | n/a    | No dashboard UI in Phase 0.                 | Revisit when dashboard UI is added. |

## 7. Active tasks

| ID       | Priority | Task                                        | Owner | Status | ETA  | Notes                             |
| -------- | -------- | ------------------------------------------- | ----- | ------ | ---- | --------------------------------- |
| TASK-001 | P1       | Review Phase 7 documentation/state cleanup. | User  | todo   | none | Do not commit or push from Codex. |
| TASK-002 | P2       | Commit manually when ready.                 | User  | todo   | none | Codex must not commit or push.    |

## 8. Backlog / long horizon

| Priority    | Item   | Impact       | Effort       | Status                              | Notes   |
| ----------- | ------ | ------------ | ------------ | ----------------------------------- | ------- |
| P0/P1/P2/P3 | <item> | low/med/high | low/med/high | proposed/accepted/deferred/rejected | <notes> |

## 9. Known issues

| ID        | Issue                               | Severity | Owner / layer | Next action                | Target |
| --------- | ----------------------------------- | -------- | ------------- | -------------------------- | ------ |
| ISSUE-001 | No known Phase 7 validation issues. | low      | n/a           | Continue with user review. | none   |

## 10. Risks

| ID       | Risk                                            | Probability | Impact | Mitigation                                             | Owner      | Trigger / watch signal       |
| -------- | ----------------------------------------------- | ----------- | ------ | ------------------------------------------------------ | ---------- | ---------------------------- |
| RISK-001 | Future local port conflict on `5432` or `6379`. | low         | medium | Do not kill processes; report conflict if seen.        | User       | Compose start failure        |
| RISK-002 | Future local port conflict on API port `3000`.  | low         | low    | Report conflict; use an explicit `API_PORT` if needed. | User/Codex | `pnpm dev:api` start failure |

## 11. Decisions since last update

| ID      | Date       | Decision                                                               | Rationale                                                                                       | Tradeoff / consequence                                                                    |
| ------- | ---------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| DEC-001 | 2026-06-20 | Use pnpm workspace with local-only tooling.                            | Matches requested stack and phase gating.                                                       | Runtime dependencies deferred to later phases.                                            |
| DEC-002 | 2026-06-20 | Use Docker Compose for PostgreSQL and Redis.                           | Matches future architecture requirements.                                                       | Validation requires Docker Desktop to be running.                                         |
| DEC-003 | 2026-06-20 | Keep real provider APIs disabled by default.                           | Prevents paid/credentialed API use locally.                                                     | Later phases must use mocks unless approved.                                              |
| DEC-004 | 2026-06-20 | Use Hono for Phase 3 ingress.                                          | Matches requested stack and keeps tests serverless via `app.request()`.                         | Dashboard/UI remains deferred.                                                            |
| DEC-005 | 2026-06-20 | Keep queue as a placeholder port only.                                 | Preserves Phase 3 boundary and prepares Phase 4 replacement.                                    | No Redis/BullMQ behavior yet.                                                             |
| DEC-006 | 2026-06-21 | Use BullMQ with stable job IDs and capped custom backoff for Phase 4.  | Matches requested queue/worker stack and keeps retry policy configurable from local env.        | BullMQ rejects `:` in custom IDs, so job IDs use `delivery-<eventId>`.                    |
| DEC-007 | 2026-06-21 | Keep downstream delivery payload-driven and local-only.                | Demonstrates success, retry, permanent failure, and dead-letter behavior without external APIs. | Real provider delivery remains deferred.                                                  |
| DEC-008 | 2026-06-21 | Keep Phase 5 dashboard server-rendered and local-demo unauthenticated. | Matches phase constraints and avoids frontend framework/auth scope creep.                       | Do not expose the dashboard publicly without later auth hardening.                        |
| DEC-009 | 2026-06-22 | Build the simulator as a local TypeScript CLI under `tools/simulator`. | Reuses current pnpm/tsx/Vitest tooling and avoids provider SDKs or paid APIs.                   | Full scenario smoke requires local API, worker, PostgreSQL, and Redis.                    |
| DEC-010 | 2026-06-22 | Make `demo:reset` clear DB tables and the local BullMQ queue.          | Repeatable demos need clean persistence and queue state.                                        | Reset remains local-only and refuses non-local targets.                                   |
| DEC-011 | 2026-06-22 | Treat exact `.env.example` values as the manual runtime contract.      | Phase 7 validation showed runtime failures were env setup issues, not implementation defects.   | PowerShell env vars must be set per terminal and API must be restarted after env changes. |

## 12. Open questions

| ID    | Question                                       | Owner | Needed by | Current best answer / assumption                               |
| ----- | ---------------------------------------------- | ----- | --------- | -------------------------------------------------------------- |
| Q-001 | Are local Docker ports `5432` and `6379` free? | User  | Phase 0   | Answered on 2026-06-20: both were available during validation. |

## 13. Next 3 actions

1. User: Review the Phase 7 documentation/state cleanup — expected result: docs/state wording matches the accepted reliability hardening validation.
2. User: Commit manually when ready — expected result: Phase 7 reliability hardening and documentation closure captured in Git history.
3. User/Codex: Choose the next phase — expected result: scope remains phase-gated and local-first.

## 14. Handoff notes

- Start here next: `TASK-001`
- Read first: `README.md`, `docs/reliability-hardening.md`, `docs/manual-verification-checklist.md`, `docs/demo-script.md`, and `STATE.md`
- Commands to run first for next-phase setup check: `docker compose -f .\infra\docker-compose.yml up -d postgres redis`; set the `.env.example` `DATABASE_URL`, `REDIS_URL`, and `STRIPE_SAMPLE_WEBHOOK_SECRET` values in the relevant PowerShell terminals; `pnpm db:migrate`; `pnpm test -- --run`; `pnpm simulator:all`
- Do not change: Git remotes, commit history, real provider credentials, paid API integrations, or application behavior outside the approved phase.
- Watch for: next-phase scope creep, env drift from `.env.example`, and any request that would introduce real provider credentials, paid API usage, provider SDKs, or deployment automation before those are approved.
- Suggested next prompt: `Start the next phase after reviewing Phase 7 reliability hardening documentation and choosing the next phase scope.`
