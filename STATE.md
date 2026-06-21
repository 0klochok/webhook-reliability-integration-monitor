# STATE.md

> Purpose: single source of truth for current project state, especially across contributors, AI/Codex sessions, and handoffs. Keep it brief, factual, and evidence-based. Update after any material change, validation run, blocker, decision, or phase transition.

## Meta

- Last updated: 2026-06-21 Europe/Kyiv
- Owner: Local project owner
- Contributors: Codex
- Repository path: `C:\Users\alex\Documents\Coding Projects\Portfolio Projects\webhook-reliability-integration-monitor`
- Current branch: `main`
- Current phase: Phase 3 — Webhook ingress API complete
- Overall status: green
- Quality gate status: green
- Completion: 100%
- Main blocker: none

## Update rules

- Keep entries concise: prefer paths, commands, dates, commit hashes, PRs, and direct evidence.
- Move finished work out of **Active tasks** into **Completed since last update**.
- Mark quality as **green** only when every required gate is `pass` or explicitly `n/a` with a reason.
- Any blocker must appear in **Known issues** or **Risks** with an owner and next action.
- Do not use this file as a full changelog; summarize and link to commits, PRs, logs, or docs.

## 1. Current objective

- Phase objective: Add local Hono webhook ingress for `POST /webhooks/:provider` with raw-body signature verification, Zod validation, idempotent persistence, rejected-event audit history, and a queue placeholder.
- Deadline / target date: none
- Definition of done: `apps/api` exposes `GET /healthz` and `POST /webhooks/:provider`; accepted, duplicate, invalid-signature, invalid-JSON, invalid-payload, and unsupported-provider paths are tested through Hono `app.request()` and local PostgreSQL; no BullMQ, Redis queue behavior, worker, retry execution, dashboard, simulator, or real provider API behavior is introduced.
- Primary user-visible signal: `pnpm dev:api` boots the local API and `/healthz` returns JSON `{ ok: true, service: "webhook-reliability-api" }`.
- Secondary checks: `pnpm install`, `pnpm db:migrate`, `pnpm test -- --run`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, Docker Compose Postgres/Redis start, and `git status --short`.
- Out of scope: BullMQ/Redis queue implementation, worker processing, downstream delivery, retry execution, dashboard pages, simulator commands, GitHub Actions, commits, pushes, tags, and real provider APIs.

## 2. Status snapshot

- Summary: Phase 3 webhook ingress is implemented and locally validated. The project now has a Hono API, raw-body Stripe-style sample verification, provider validation/normalization, idempotent database persistence, rejected-event audit history, and a dependency-injected queue placeholder. It still has no BullMQ/Redis queue implementation, worker, retry execution, dashboard, simulator behavior, or real provider integration behavior.
- Since last update: Added `@webhook-monitor/api`, queue placeholder contracts in `@webhook-monitor/queue`, a small idempotent-with-history repository helper in `@webhook-monitor/db`, API integration tests, README manual checks, local validation against Docker PostgreSQL, and a Phase 3 manual ingress QA record.
- Current focus: Ready for user review and manual commit, then Phase 4 queue/worker planning.
- Main uncertainty: none for Phase 3.

## 3. Completed phases / milestones

| Phase                      | Date       | Summary                                                                                                | Quality gate | Commit / PR |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ | ------------ | ----------- |
| Phase 0 — Foundation       | 2026-06-20 | pnpm workspace scaffold and local infra config.                                                        | green        | none        |
| Phase 1 — Domain contracts | 2026-06-20 | Core provider contracts, schemas, adapters, retry policy, statuses, and fake/local signature verifier. | green        | none        |
| Phase 2 — Persistence      | 2026-06-20 | PostgreSQL persistence, Drizzle migrations, db repositories, local reset/seed, and integration tests.  | green        | none        |
| Phase 3 — Ingress API      | 2026-06-20 | Hono webhook ingress, raw-body signatures, validation, idempotency, audit history, and queue port.     | green        | none        |

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

## 5. Changed files

| Path                                                              | Purpose                              | Status  | Notes                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------- |
| `package.json`, `pnpm-workspace.yaml`                             | Root pnpm workspace and scripts      | created | No runtime app dependencies added.                                                                 |
| `tsconfig.base.json`, `tsconfig.json`                             | TypeScript baseline                  | created | ESM-oriented Node TypeScript config.                                                               |
| `eslint.config.js`, `.prettierrc.json`                            | Lint and format tooling              | created | ESLint flat config and Prettier config.                                                            |
| `.gitignore`, `.editorconfig`, `.env.example`                     | Local repository defaults            | created | `.env.example` contains fake values only.                                                          |
| `apps/*`, `packages/*`, `tools/simulator`                         | Future workspace package directories | created | Package manifests only; no source code.                                                            |
| `infra/docker-compose.yml`                                        | Local PostgreSQL and Redis services  | created | Named volumes and health checks.                                                                   |
| `README.md`, `CONTEXT.md`, `RUNBOOK.md`                           | Setup and workflow documentation     | updated | Phase 0 commands and constraints.                                                                  |
| `REQ.md`, `DESIGN.md`, `TDD.md`, `STATE.md`                       | Existing templates                   | updated | Formatted by Prettier.                                                                             |
| `packages/core/src`                                               | Core domain contracts                | created | Pure TypeScript only; no ingress, DB, queue, or provider SDK.                                      |
| `packages/core/test`                                              | Core unit tests                      | created | Covers provider IDs, statuses, schemas, retry policy, adapters, and fake signature verification.   |
| `packages/core/package.json`, `pnpm-lock.yaml`                    | Core dependency metadata             | updated | Adds `zod` scoped to `@webhook-monitor/core`.                                                      |
| `drizzle.config.ts`                                               | Drizzle Kit config                   | created | Used by db package scripts; reads `.env` or fake local `.env.example` values.                      |
| `packages/db/src`                                                 | Persistence implementation           | created | Schema, client, migration runner, repositories, reset/seed helpers, and local safety checks.       |
| `packages/db/drizzle`                                             | Generated migrations                 | created | Initial Drizzle migration and metadata for Phase 2 tables/enums/indexes.                           |
| `packages/db/test`                                                | DB integration tests                 | created | Covers migrations, repositories, idempotency, history, attempts, dead letters, replays, safety.    |
| `packages/db/package.json`, `pnpm-lock.yaml`                      | DB dependencies and scripts          | updated | Adds Drizzle, postgres.js, dotenv, drizzle-kit, tsx, and `@webhook-monitor/core`.                  |
| `.env.example`, `README.md`                                       | Local env/docs                       | updated | Adds `POSTGRES_PORT` and Phase 2 local database instructions.                                      |
| `apps/api/src`                                                    | Hono API implementation              | created | App factory, server, config, routes, ingest service, rejection handling, and test harness.         |
| `apps/api/test`                                                   | API integration tests                | created | Covers health, valid providers, signatures, invalid inputs, idempotency, and unsupported provider. |
| `packages/queue/src`                                              | Queue placeholder port               | created | Dependency-free `DeliveryQueuePort` and no-op implementation; no BullMQ or Redis behavior.         |
| `packages/db/src/repositories/webhook-events.ts`                  | Phase 3 persistence helper           | updated | Adds idempotent create with initial status history for API ingress.                                |
| `package.json`, `apps/api/package.json`                           | API scripts and dependencies         | updated | Adds `dev:api`, API package scripts, Hono, node-server adapter, workspace deps, and `tsx`.         |
| `.env.example`, `README.md`, `STATE.md`                           | Phase 3 local docs/status            | updated | Adds API port/host, fake Stripe sample secret, manual API examples, and validation state.          |
| `packages/db/package.json`, `packages/db/src/test-utils/index.ts` | DB test utility export               | updated | Exposes Phase 2 database test helpers for API integration tests.                                   |
| `vitest.config.ts`                                                | Test runner stability                | updated | Disables file parallelism to prevent shared local DB cleanup races.                                |

## 6. Validation and quality gates

### Required gates

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

| ID       | Priority | Task                                                                | Owner      | Status | ETA  | Notes                                   |
| -------- | -------- | ------------------------------------------------------------------- | ---------- | ------ | ---- | --------------------------------------- |
| TASK-001 | P1       | Review Phase 3 validation result and commit manually when ready.    | User       | todo   | none | Do not commit or push from Codex.       |
| TASK-002 | P1       | Plan Phase 4 queue/worker implementation after Phase 3 is accepted. | User/Codex | todo   | none | Keep BullMQ/Redis behavior phase-gated. |

## 8. Backlog / long horizon

| Priority    | Item   | Impact       | Effort       | Status                              | Notes   |
| ----------- | ------ | ------------ | ------------ | ----------------------------------- | ------- |
| P0/P1/P2/P3 | <item> | low/med/high | low/med/high | proposed/accepted/deferred/rejected | <notes> |

## 9. Known issues

| ID        | Issue                             | Severity | Owner / layer | Next action | Target |
| --------- | --------------------------------- | -------- | ------------- | ----------- | ------ |
| ISSUE-001 | none currently known for Phase 3. | n/a      | n/a           | n/a         | n/a    |

## 10. Risks

| ID       | Risk                                            | Probability | Impact | Mitigation                                             | Owner      | Trigger / watch signal       |
| -------- | ----------------------------------------------- | ----------- | ------ | ------------------------------------------------------ | ---------- | ---------------------------- |
| RISK-001 | Future local port conflict on `5432` or `6379`. | low         | medium | Do not kill processes; report conflict if seen.        | User       | Compose start failure        |
| RISK-002 | Future local port conflict on API port `3000`.  | low         | low    | Report conflict; use an explicit `API_PORT` if needed. | User/Codex | `pnpm dev:api` start failure |

## 11. Decisions since last update

| ID      | Date       | Decision                                     | Rationale                                                               | Tradeoff / consequence                            |
| ------- | ---------- | -------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| DEC-001 | 2026-06-20 | Use pnpm workspace with local-only tooling.  | Matches requested stack and phase gating.                               | Runtime dependencies deferred to later phases.    |
| DEC-002 | 2026-06-20 | Use Docker Compose for PostgreSQL and Redis. | Matches future architecture requirements.                               | Validation requires Docker Desktop to be running. |
| DEC-003 | 2026-06-20 | Keep real provider APIs disabled by default. | Prevents paid/credentialed API use locally.                             | Later phases must use mocks unless approved.      |
| DEC-004 | 2026-06-20 | Use Hono for Phase 3 ingress.                | Matches requested stack and keeps tests serverless via `app.request()`. | Dashboard/UI remains deferred.                    |
| DEC-005 | 2026-06-20 | Keep queue as a placeholder port only.       | Preserves Phase 3 boundary and prepares Phase 4 replacement.            | No Redis/BullMQ behavior yet.                     |

## 12. Open questions

| ID    | Question                                       | Owner | Needed by | Current best answer / assumption                               |
| ----- | ---------------------------------------------- | ----- | --------- | -------------------------------------------------------------- |
| Q-001 | Are local Docker ports `5432` and `6379` free? | User  | Phase 0   | Answered on 2026-06-20: both were available during validation. |

## 13. Next 3 actions

1. User: Review Phase 3 validation summary — expected result: Phase 3 accepted as complete.
2. User: Commit manually when ready — expected result: Phase 3 ingress captured in Git history.
3. User/Codex: Plan Phase 4 queue/worker implementation — expected result: BullMQ/Redis behavior begins without dashboard/simulator scope creep.

## 14. Handoff notes

- Start here next: `TASK-001`
- Read first: `README.md`, `apps/api/src/app.ts`, `apps/api/src/services/ingest-webhook.ts`, `packages/queue/src/index.ts`, and `packages/db/src/repositories/webhook-events.ts`
- Commands to run first for Phase 4 setup check: `pnpm format:check`; `pnpm lint`; `pnpm typecheck`; `pnpm test -- --run`
- Do not change: Git remotes, commit history, real provider credentials, paid API integrations, or application behavior outside the approved phase.
- Watch for: Phase 4 scope creep and any request that would introduce dashboard/simulator behavior, real provider credentials, or paid API usage before those are approved.
- Suggested next prompt: `Start Phase 4 BullMQ queue and worker processing in local mock-only mode after reviewing Phase 3.`
