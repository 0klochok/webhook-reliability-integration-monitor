# CONTEXT.md

## 0. Purpose and maintenance

`CONTEXT.md` is the compact, current source of truth for project implementation context. It should help a human or coding agent understand the system, repository, constraints, commands, boundaries, and operational facts without re-discovering them.

Keep this file factual and current. Do not duplicate long requirements, designs, test plans, or runbooks here; link to the source-of-truth file and summarize only what is needed for day-to-day implementation.

Update this file when any of the following changes:

- Architecture, runtime surfaces, or core modules
- Tech stack, package manager, database, hosting, or CI/CD
- Repository layout or ownership of major paths
- Commands, quality gates, deployment, rollback, or smoke tests
- API contracts, data contracts, integrations, or background jobs
- Security, privacy, compliance, performance, cost, or deployment constraints
- Architecture decisions, risks, known limitations, or open questions

When information is unknown, write `TBD` and add it to **18. Open questions**. Do not leave ambiguous blanks in active projects.

---

## 1. Meta

| Field           | Value                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Last updated    | 2026-06-20                                                                                                    |
| Owner           | Local project owner                                                                                           |
| Status          | active                                                                                                        |
| Current phase   | Phase 1 — Domain contracts                                                                                    |
| Repository      | webhook-reliability-integration-monitor / https://github.com/0klochok/webhook-reliability-integration-monitor |
| Primary runtime | local                                                                                                         |

### Status meanings

- `draft`: incomplete or being established.
- `active`: current working context; keep updated as the project changes.
- `frozen`: preserved for a release, migration, audit, or archived state.

---

## 2. System overview

- **Product domain:** Reliable webhook integrations for business automations.
- **Primary users:** Developers and operators evaluating webhook reliability patterns.
- **Problem solved:** Demonstrates planned durable webhook ingestion, idempotency, retries, dead-letter handling, replay, and health visibility.
- **High-level architecture:** Provider webhook -> Hono ingress -> adapter -> validation/signature checks -> PostgreSQL storage -> BullMQ worker/retry flow -> dashboard/replay.
- **Current architecture:** Phase 1 pnpm workspace with pure core domain contracts in `packages/core`; local PostgreSQL and Redis Docker Compose remain configured for later phases only.
- **Current phase:** Phase 1 — domain contracts, provider model, validation schemas, normalized events, retry policy, adapters, and fake/local signature verification.
- **Main runtime surfaces:**
  - Frontend/UI: planned server-rendered Hono dashboard in `apps/api`.
  - Backend/API: planned Hono API in `apps/api`.
  - Workers/jobs: planned BullMQ worker in `apps/worker`.
  - CLI/scripts: planned local simulator in `tools/simulator`.
  - External integrations: mock/local-only by default; real provider APIs are disabled unless explicitly approved.
- **Critical user-visible flows:**
  1.
  2.
  3.
- **Core modules:**
  - `packages/core/src/providers.ts`: provider IDs, metadata, and runtime provider validation.
  - `packages/core/src/schemas`: Zod schemas for local Stripe-style, generic HTTP, and mock CRM sample payloads.
  - `packages/core/src/adapters.ts`: framework-agnostic provider adapters and adapter registry.
  - `packages/core/src/normalized-event.ts`: provider-independent normalized event contract and payload hashing.
  - `packages/core/src/retry-policy.ts`: pure retry policy contract and delay/status helpers.
  - `packages/core/src/signature.ts`: generic signature verifier contracts and fake Stripe-style HMAC verifier.
- ## **Non-goals / out of scope:**

---

## 3. Source-of-truth files

Use this section to define document responsibility and avoid conflicting instructions.

| File                  | Responsibility                                                             | Update trigger                               |
| --------------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| `README.md`           | Setup, quickstart, common developer entry points                           | Install/dev workflow changes                 |
| `REQ.md`              | Product requirements, user stories, acceptance criteria                    | Requirement or scope changes                 |
| `DESIGN.md`           | Technical design, architecture, trade-offs, diagrams                       | Design or architecture changes               |
| `CONTEXT.md`          | Current project context, stack, repo map, commands, constraints            | Any implementation-context change            |
| `STATE.md`            | Current implementation state, completed work, next actions                 | Progress changes after meaningful work       |
| `TDD.md`              | Test strategy, test cases, acceptance checks, quality gate                 | Test strategy or coverage changes            |
| `RUNBOOK.md`          | Operations, deployment, rollback, incidents, recovery                      | Operational procedure changes                |
| `AGENTS.md`           | Agent-specific working rules, codebase conventions, automation constraints | Agent workflow or convention changes         |
| `ADR/` or `docs/adr/` | Durable architecture decisions                                             | Significant irreversible or costly decisions |

### Conflict resolution

If files conflict, resolve in this order unless the project defines a stricter rule:

1. Security, privacy, compliance, and legal constraints
2. Explicit user/product requirements in `REQ.md`
3. Accepted architecture decisions in `ADR/` or `DESIGN.md`
4. Operational safety rules in `RUNBOOK.md`
5. Current implementation facts in `CONTEXT.md` and `STATE.md`
6. Convenience instructions in `README.md` or informal notes

---

## 4. Repository map

Keep paths exact. Add only directories/files that matter for implementation, operations, or review.

| Path               | Purpose                                                                       | Notes / owner                                                                   |
| ------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `/`                | Project root                                                                  |                                                                                 |
| `/apps/api`        | Planned Hono API, webhook ingress, dashboard, health endpoints                | Package manifest only in Phase 0                                                |
| `/apps/worker`     | Planned BullMQ worker and retry processing                                    | Package manifest only in Phase 0                                                |
| `/packages/core`   | Provider contracts, schemas, signatures, status model, adapters, retry policy | Phase 1 pure TypeScript source and unit tests implemented                       |
| `/packages/db`     | Planned Drizzle schema, migrations, repository layer                          | Package manifest only in Phase 0                                                |
| `/packages/queue`  | Planned queue names, job contracts, enqueue helpers, retry policy             | Package manifest only in Phase 0                                                |
| `/tools/simulator` | Planned local demo/simulator commands                                         | Package manifest only in Phase 0                                                |
| `/infra`           | Local infrastructure definitions                                              | Docker Compose for PostgreSQL and Redis                                         |
| `/docs`            | Project documentation                                                         | Holder for later architecture notes, demo script, and manual verification notes |

### Important generated or ignored paths

| Path     | Reason                                  |
| -------- | --------------------------------------- |
| `<path>` | Generated; do not edit directly         |
| `<path>` | Build output; safe to delete/regenerate |

---

## 5. Tech stack and dependencies

| Area                      | Current choice                           | Notes                                                          |
| ------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| Frontend                  | Hono server-rendered dashboard           | Local portfolio/demo UI; no Next.js                            |
| Backend                   | Hono                                     | Webhook ingress, health/readiness, dashboard routes            |
| Runtime                   | Node.js + TypeScript                     | Local Node observed as `v24.16.0`                              |
| Package manager           | pnpm                                     | `packageManager` pins `pnpm@11.7.0`                            |
| Frameworks                | Hono                                     | API and server-rendered dashboard                              |
| Runtime validation        | Zod                                      | Provider schemas and config validation                         |
| Database/storage          | PostgreSQL + Drizzle                     | Local Docker Compose PostgreSQL                                |
| Queue/background jobs     | BullMQ                                   | Local Redis-backed delivery queue and worker                   |
| Cache                     | Redis                                    | Local Docker Compose Redis for BullMQ                          |
| Search/indexing           | none                                     | Not needed for the local demo                                  |
| Auth provider             | none                                     | Dashboard is local-demo only and unauthenticated               |
| External services         | mock downstream only                     | No real provider or paid APIs                                  |
| Third-party SDKs          | none for providers                       | Stripe-style sample uses local HMAC implementation             |
| Testing                   | Vitest                                   | Root test suite covers core, DB, API, queue, worker, simulator |
| Tooling                   | TypeScript, ESLint flat config, Prettier | Root scripts in `package.json`                                 |
| Docker                    | configured                               | `infra/docker-compose.yml` for PostgreSQL and Redis            |
| Hosting/deployment target | none                                     | Local portfolio/demo only                                      |
| CI/CD                     | not configured                           | Keep validation local-first unless later approved              |

### Dependency rules

- **Allowed dependency policy:**
- **Forbidden dependency policy:**
- **Version pinning policy:**
- **Upgrade policy:**
- **License constraints:**

---

## 6. Commands and quality gate

All commands should be runnable from the repository root unless stated otherwise.

| Purpose                 | Command                                                                                                          | Notes                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Install dependencies    | `pnpm install`                                                                                                   | Uses existing `pnpm-lock.yaml`                         |
| Run API                 | `pnpm dev:api`                                                                                                   | Starts Hono API/dashboard on the configured local port |
| Run worker              | `pnpm dev:worker`                                                                                                | Starts BullMQ delivery worker                          |
| Run tests               | `pnpm test -- --run`                                                                                             | Root Vitest suite                                      |
| Run API tests           | `pnpm api:test`                                                                                                  | Focused API test package script                        |
| Run worker tests        | `pnpm worker:test`                                                                                               | Focused worker test package script                     |
| Run queue tests         | `pnpm queue:test`                                                                                                | Focused queue test package script                      |
| Lint                    | `pnpm lint`                                                                                                      | ESLint flat config                                     |
| Format                  | `pnpm format:check`                                                                                              | Use `pnpm format` to write changes                     |
| Typecheck/build check   | `pnpm typecheck`                                                                                                 | Build-equivalent gate; no root `build` script exists   |
| Database migration      | `pnpm db:migrate`                                                                                                | Applies Drizzle migrations to local PostgreSQL         |
| Reset demo state        | `pnpm demo:reset`                                                                                                | Destructive local-only DB table and BullMQ queue reset |
| Seed fixtures/test data | `pnpm demo:seed`                                                                                                 | Optional local demo seed data                          |
| Smoke test              | `pnpm docker:up`, `pnpm docker:ps`, `pnpm db:migrate`, `pnpm demo:reset`, start API/worker, `pnpm simulator:all` | Local Docker/API/worker/simulator gate                 |
| Full quality gate       | `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test -- --run`                                         | Add smoke gate for runtime changes                     |

### Quality gate definition

A change is considered safe to merge only when the following pass:

1. `pnpm format:check`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. Docker Compose and simulator smoke validation when PostgreSQL, Redis, API, worker, or demo runtime behavior changes.

If no automated quality gate exists yet, state that explicitly and define the current manual check.

---

## 7. Domain model

### Entities

| Entity     | Responsibility | Persistence | Notes |
| ---------- | -------------- | ----------- | ----- |
| `<Entity>` |                |             |       |

### Relationships

- `<Entity A>` → `<Entity B>`:

### Invariants

- `INV-001`:
- `INV-002`:

### Validation rules

- `VAL-001`:
- `VAL-002`:

### Edge cases

- `EDGE-001`:
- `EDGE-002`:

---

## 8. Contracts and boundaries

### Public API contracts

| Method | Path / operation                                            | Purpose                         | Request schema                | Response schema                 | Errors                                                                                  |
| ------ | ----------------------------------------------------------- | ------------------------------- | ----------------------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| `GET`  | `/health`, `/healthz`                                       | Liveness check                  | none                          | `{ ok, service }`               | none expected                                                                           |
| `GET`  | `/readyz`                                                   | Database and queue readiness    | none                          | `{ ok, service, dependencies }` | `503` with safe dependency status                                                       |
| `POST` | `/webhooks/:provider`                                       | Provider webhook intake         | Provider-specific Zod schemas | queued/duplicate response       | `unsupported_provider`, `invalid_signature`, `invalid_payload`, rate/body/config errors |
| `GET`  | `/dashboard`, `/dashboard/events`, `/dashboard/dead-letter` | Local server-rendered dashboard | query params for list filters | HTML                            | safe JSON/HTML error responses                                                          |
| `GET`  | `/api/dashboard/*`                                          | Dashboard JSON data             | route/query params            | JSON data envelope              | validation/not-found errors                                                             |
| `POST` | `/api/dashboard/events/:eventId/replay`                     | Manual replay enqueue           | path event id                 | replay queue result             | `replay_not_allowed`, `replay_enqueue_failed`, not found                                |

### Internal contracts

| Type                     | Name                     | Producer             | Consumer                           | Contract location                           | Notes                                      |
| ------------------------ | ------------------------ | -------------------- | ---------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Event                    | `NormalizedWebhookEvent` | provider adapters    | API ingest, DB repositories, queue | `packages/core/src/normalized-event.ts`     | Normalized provider event contract         |
| Job                      | `DeliveryJobData`        | API/manual replay    | BullMQ worker                      | `packages/queue/src/delivery-job.ts`        | Includes replay metadata and attempt start |
| Function/module boundary | provider adapters        | raw webhook intake   | validation/signature/normalization | `packages/core/src/adapters.ts`             | Keeps provider-specific parsing in core    |
| Function/module boundary | dashboard repository     | API dashboard routes | HTML/JSON dashboard views          | `packages/db/src/repositories/dashboard.ts` | Read model for local health dashboard      |

### Integration boundaries

- **Database:** PostgreSQL through Drizzle repositories in `packages/db/src/repositories`.
- **External APIs:** None; downstream delivery is a local mock client.
- **UI/client:** Server-rendered Hono dashboard, no browser-side app framework.
- **Background jobs:** BullMQ delivery queue and worker through local Redis.
- **Files/blob storage:** None.
- **Notifications/email:** None.

### Error contract

- **Error shape:** API errors return `{ ok: false, error: { code, message }, correlationId }` with optional safe issue details.
- **Error code policy:** Stable snake_case codes; do not expose secrets or raw dependency URLs.
- **Validation errors:** Zod validation maps to `invalid_payload` or config validation errors.
- **Auth errors:** No user auth exists; webhook signature failures map to `invalid_signature`.
- **Retryable errors:** Worker records retryable downstream failures and schedules BullMQ retries.
- **Non-retryable errors:** Permanent downstream failures or exhausted retries become dead-letter records.

### Backward compatibility rules

- **Breaking-change policy:** Keep local simulator, README commands, and tests in sync with route/contract changes.
- **Deprecation policy:** Prefer additive local-demo compatibility routes such as `/health` beside `/healthz`.
- **Versioning policy:** No public versioned API yet; provider/job contracts are protected by tests.

---

## 9. Data and storage

- **Schema summary:** Webhook events, status history, delivery attempts, dead-letter events, manual replays, and Drizzle migrations.
- **Canonical schema location:** `packages/db/src/schema.ts`.
- **Migration policy:** Express schema in Drizzle schema and apply generated migrations through the db package.
- **Migration command:** `pnpm db:migrate`
- **Fixture/test data policy:** Synthetic local-only data only; no real provider payloads or secrets.
- **Seed data command:** `pnpm demo:seed`
- **Retention policy:** Not production-defined; local demo data may be reset.
- **Backup policy:** Not configured for local demo data.
- **Recovery procedure:** Recreate local state with `pnpm docker:up`, `pnpm db:migrate`, and simulator/seed commands.
- **Data deletion procedure:** `pnpm demo:reset` clears local application tables and BullMQ queue state.

### Data classification

| Data type              | Classification     | Storage location            | Retention              | Notes                                                           |
| ---------------------- | ------------------ | --------------------------- | ---------------------- | --------------------------------------------------------------- |
| Local webhook payloads | internal demo data | PostgreSQL `webhook_events` | local reset-controlled | Synthetic only; payload views avoid exposing secret-like values |
| Local credentials      | confidential       | `.env` only                 | user-managed           | Never commit; `.env.example` uses fake placeholders             |

---

## 10. Security, privacy, and compliance

- **Authentication:**
- **Authorization:**
- **Secrets handling:**
  - Location:
  - Rotation policy:
  - Local development policy:
- **PII/data classification:**
- **Compliance constraints:**
- **Forbidden data:**
- **Forbidden actions:**
- **Audit/logging requirements:**
- **Dependency vulnerability policy:**
- **Security review trigger:**

### Security defaults

- Do not commit secrets, credentials, private keys, tokens, or production data.
- Do not log sensitive values.
- Do not use production credentials or production data in local tests unless explicitly approved and documented.
- Treat new external integrations as security-relevant until reviewed.

---

## 11. Global engineering rules

- **Coding standards:**
- **Naming conventions:**
- **Branching strategy:**
- **Commit/PR policy:**
- **Versioning policy:**
- **Error handling policy:**
- **Logging/observability policy:**
- **Testing policy:**
- **Code generation policy:**
- **Review policy:**

### Agent/developer workflow rules

- Prefer small, reviewable changes.
- Before changing behavior, locate the relevant requirement, design note, test, or ADR.
- Update tests when changing behavior.
- Update documentation when changing commands, contracts, deployment, security posture, or architecture.
- Avoid broad refactors unless they are explicitly part of the current task.

---

## 12. Runtime operations

For detailed production operations, use `RUNBOOK.md`. This section is the compact operational summary.

| Operation    | Command / procedure                                            | Notes                                                           |
| ------------ | -------------------------------------------------------------- | --------------------------------------------------------------- |
| Start infra  | `pnpm docker:up`                                               | Starts local PostgreSQL and Redis                               |
| Start API    | `pnpm dev:api`                                                 | Local Hono API/dashboard                                        |
| Start worker | `pnpm dev:worker`                                              | Local BullMQ worker                                             |
| Stop locally | `pnpm docker:down`                                             | Stops local PostgreSQL and Redis without deleting named volumes |
| Safe reset   | `pnpm demo:reset`                                              | Destructive local-only reset of app tables and queue state      |
| Build        | `pnpm typecheck`                                               | Build-equivalent gate; no root `build` script exists            |
| Test         | `pnpm test -- --run`                                           | Root Vitest suite                                               |
| Deploy       | not configured                                                 | Local portfolio/demo only                                       |
| Rollback     | Revert local changes manually before commit                    | Codex must not rewrite Git history                              |
| View logs    | `docker compose -f .\infra\docker-compose.yml logs --tail=100` |                                                                 |
| Health check | `GET /health`, `GET /healthz`, `GET /readyz`                   | API liveness/readiness                                          |
| Smoke test   | `pnpm simulator:all`                                           | Run after Docker services, API, and worker are running          |

### Environments

| Environment | URL / identifier        | Purpose                   | Data source                                | Notes                              |
| ----------- | ----------------------- | ------------------------- | ------------------------------------------ | ---------------------------------- |
| Local       | `http://localhost:3000` | Development/demo          | `.env` or `.env.example` fake local values | Only supported runtime today       |
| Staging     | not configured          | Pre-production validation | n/a                                        | Add only in a later approved phase |
| Production  | not configured          | User-facing runtime       | n/a                                        | Not production-ready               |

### Operational safety

- **Safe stop/reset rules:** Stop foreground API/worker with Ctrl+C; use `pnpm docker:down` for local infra; use `pnpm demo:reset` only when local demo/test data loss is acceptable.
- **Rollback trigger:** Failed local gate or unwanted behavior change before manual commit.
- **Incident owner:** Local project owner.
- **Escalation path:** Stop and ask before destructive, credentialed, external-service, or Git history actions.
- **Known fragile operations:** Local port conflicts on `3000`, `5432`, or `6379`; pnpm engine warning from Codex bundled pnpm shim.

---

## 13. Performance, reliability, and cost constraints

| Area                | Target / constraint           | Measurement               | Notes                                   |
| ------------------- | ----------------------------- | ------------------------- | --------------------------------------- |
| Latency SLO         | not defined                   | local smoke only          | Portfolio/demo project                  |
| Throughput target   | not defined                   | local smoke only          | No load-test gate yet                   |
| Availability target | local process uptime only     | health/readiness routes   | No production deployment                |
| Error budget        | not defined                   | n/a                       | No production SLO                       |
| Resource limits     | local Docker/Desktop capacity | Docker and process health | Keep demo lightweight                   |
| Cost constraint     | zero paid API usage           | dependency and env review | Real provider/paid APIs remain disabled |

- **Known bottlenecks:** Not load-tested; BullMQ/PostgreSQL/Redis use local defaults.
- **Scalability assumptions:** Demo-scale traffic only.
- **Load test status:** Not configured.
- **Observability coverage:** Structured logs, correlation IDs, status history, delivery attempts, dashboard summary.

---

## 14. Architecture decision log

Record durable decisions here or link to full ADR files. Prefer separate ADR files for large decisions.

| ID      | Date       | Decision                                              | Context                                                   | Rationale                                                     | Consequences                                                          | Status   |
| ------- | ---------- | ----------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| ADR-001 | 2026-06-20 | Use pnpm workspace with Hono, Drizzle, BullMQ, Vitest | Local webhook reliability portfolio project               | Matches requested stack and keeps implementation local-first  | No Next.js, CI, provider SDKs, or deployment by default               | accepted |
| ADR-002 | 2026-06-22 | Keep simulator and downstream delivery fake/local     | Real provider and paid API usage is disallowed by default | Demonstrates reliability behavior without credentials or cost | Production provider integrations require a later approved phase       | accepted |
| ADR-003 | 2026-06-30 | Treat `pnpm typecheck` as the build-equivalent gate   | No root `build` script exists                             | Avoids inventing a build artifact before deployment exists    | Add a real build script only when deployable artifacts are introduced | accepted |

---

## 15. Current constraints

| Constraint                               | Type       | Impact                                             | Notes                                                    |
| ---------------------------------------- | ---------- | -------------------------------------------------- | -------------------------------------------------------- |
| Real provider APIs disabled by default   | security   | Prevents accidental paid or credentialed API usage | Use mocks/local-only values unless explicitly approved   |
| GitHub Actions not configured in Phase 0 | deployment | Validation is local-first                          | Add CI only in a later requested phase                   |
| Dashboard has no production auth         | security   | Do not expose publicly                             | Add auth/CSRF/deployment hardening before any public use |
| No CI/CD configured                      | deployment | Local gates are the source of truth                | Add only in a later approved phase                       |
| No real provider APIs or SDKs            | scope      | Simulator/mock behavior only                       | Requires explicit approval to expand                     |

---

## 16. Current risks

| ID       | Risk                                                                   | Probability         | Impact | Mitigation                                                                                    | Owner      | Status     |
| -------- | ---------------------------------------------------------------------- | ------------------- | ------ | --------------------------------------------------------------------------------------------- | ---------- | ---------- |
| RISK-001 | Local port conflict on `3000`, `5432`, or `6379` blocks smoke runs     | low                 | medium | Report conflict; do not kill unrelated processes without approval                             | User/Codex | monitoring |
| RISK-002 | Codex bundled pnpm shim uses Node `v24.14.0` and emits engine warnings | high in Codex shell | low    | Use system/Corepack pnpm in manual shell or update Codex runtime; do not lower project engine | User       | open       |
| RISK-003 | Dashboard is unauthenticated local-demo UI                             | medium if exposed   | high   | Keep local only; add auth/CSRF before any deployment                                          | User       | open       |

---

## 17. Known limitations

| ID        | Limitation                                       | User impact                                        | Workaround                         | Target resolution                              |
| --------- | ------------------------------------------------ | -------------------------------------------------- | ---------------------------------- | ---------------------------------------------- |
| LIMIT-001 | No production authentication or authorization    | Dashboard must stay local-only                     | Do not expose externally           | Later production-hardening phase               |
| LIMIT-002 | No automated browser visual/a11y regression gate | Human review still needed before portfolio capture | Use `docs/screenshot-checklist.md` | Later UI QA phase                              |
| LIMIT-003 | No root `build` script                           | `pnpm typecheck` is the build-equivalent gate      | Use `pnpm typecheck`               | Add build only when deployable artifacts exist |

---

## 18. Open questions

Track unknowns that block accurate implementation or operation. Resolve or move them into the relevant section when answered.

| ID    | Question                                                                                          | Owner | Needed by                      | Status |
| ----- | ------------------------------------------------------------------------------------------------- | ----- | ------------------------------ | ------ |
| Q-001 | Should the next phase add automated browser screenshots, or keep screenshot/video capture manual? | User  | Portfolio capture phase        | open   |
| Q-002 | Should CI/GitHub Actions be added after local QA, or remain out of scope?                         | User  | Future release-hardening phase | open   |

---

## 19. Review checklist

Before changing status to `active` or `frozen`, verify:

- [ ] Meta fields are filled.
- [ ] Repository map matches the current tree.
- [ ] Commands run from the repository root or document their working directory.
- [ ] Quality gate is explicit.
- [ ] API, data, security, and operational boundaries are documented.
- [ ] Risks and known limitations are current.
- [ ] Open questions are tracked rather than hidden as blanks.
- [ ] Links to source-of-truth files are correct.
