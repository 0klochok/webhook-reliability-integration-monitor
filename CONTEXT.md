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

| Area                      | Current choice                           | Notes                                               |
| ------------------------- | ---------------------------------------- | --------------------------------------------------- |
| Frontend                  | Server-rendered dashboard planned        | No UI implementation in Phase 0                     |
| Backend                   | Hono planned                             | No API implementation in Phase 0                    |
| Runtime                   | Node.js + TypeScript                     | Local Node observed as `v24.16.0`                   |
| Package manager           | pnpm                                     | Local pnpm observed as `11.7.0`                     |
| Frameworks                | Hono planned later                       | Not installed in Phase 1                            |
| Runtime validation        | Zod                                      | Installed only in `@webhook-monitor/core`           |
| Database/storage          | PostgreSQL planned                       | Local Docker Compose service only in Phase 0        |
| Queue/background jobs     | BullMQ planned                           | Not installed in Phase 0                            |
| Cache                     | Redis planned                            | Local Docker Compose service only in Phase 0        |
| Search/indexing           | TBD                                      |                                                     |
| Auth provider             | TBD                                      |                                                     |
| External services         | TBD                                      |                                                     |
| Third-party SDKs          | TBD                                      |                                                     |
| Testing                   | Vitest                                   | Phase 1 has unit tests for core contracts           |
| Tooling                   | TypeScript, ESLint flat config, Prettier | Root scripts in `package.json`                      |
| Docker                    | configured                               | `infra/docker-compose.yml` for PostgreSQL and Redis |
| Hosting/deployment target | TBD                                      |                                                     |
| CI/CD                     | not configured                           | Keep validation local-first in Phase 0              |

### Dependency rules

- **Allowed dependency policy:**
- **Forbidden dependency policy:**
- **Version pinning policy:**
- **Upgrade policy:**
- **License constraints:**

---

## 6. Commands and quality gate

All commands should be runnable from the repository root unless stated otherwise.

| Purpose                 | Command                                                                                                                                                  | Notes                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Install dependencies    | `pnpm install`                                                                                                                                           | Generates `pnpm-lock.yaml`                          |
| Run dev server          | `TBD`                                                                                                                                                    | No runnable app in Phase 0                          |
| Run tests               | `pnpm test`                                                                                                                                              | Vitest, no tests expected in Phase 0                |
| Run unit tests          | `pnpm test`                                                                                                                                              | Same as test until suites split                     |
| Run integration tests   | `TBD`                                                                                                                                                    | No integration tests in Phase 0                     |
| Lint                    | `pnpm lint`                                                                                                                                              | ESLint flat config                                  |
| Format                  | `pnpm format:check`                                                                                                                                      | Use `pnpm format` to write changes                  |
| Typecheck               | `pnpm typecheck`                                                                                                                                         | TypeScript build mode                               |
| Build                   | `TBD`                                                                                                                                                    |                                                     |
| Database migration      | `TBD`                                                                                                                                                    |                                                     |
| Seed fixtures/test data | `TBD`                                                                                                                                                    |                                                     |
| Smoke test              | `docker compose -f .\infra\docker-compose.yml up -d; docker compose -f .\infra\docker-compose.yml ps; docker compose -f .\infra\docker-compose.yml down` | Local infra only                                    |
| Full quality gate       | `pnpm format:check; pnpm lint; pnpm typecheck; pnpm test`                                                                                                | Add Docker Compose validation when infra is touched |

### Quality gate definition

A change is considered safe to merge only when the following pass:

1. `pnpm format:check`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. Docker Compose validation when PostgreSQL/Redis infrastructure is changed.

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

| Method | Path / operation | Purpose | Request schema | Response schema | Errors |
| ------ | ---------------- | ------- | -------------- | --------------- | ------ |
| `TBD`  | `TBD`            |         |                |                 |        |

### Internal contracts

| Type                     | Name  | Producer | Consumer | Contract location | Notes |
| ------------------------ | ----- | -------- | -------- | ----------------- | ----- |
| Event                    | `TBD` |          |          |                   |       |
| Job                      | `TBD` |          |          |                   |       |
| Function/module boundary | `TBD` |          |          |                   |       |

### Integration boundaries

- **Database:**
- **External APIs:**
- **UI/client:**
- **Background jobs:**
- **Files/blob storage:**
- **Notifications/email:**

### Error contract

- **Error shape:**
- **Error code policy:**
- **Validation errors:**
- **Auth errors:**
- **Retryable errors:**
- **Non-retryable errors:**

### Backward compatibility rules

- **Breaking-change policy:**
- **Deprecation policy:**
- **Versioning policy:**

---

## 9. Data and storage

- **Schema summary:**
- **Canonical schema location:**
- **Migration policy:**
- **Migration command:** `TBD`
- **Fixture/test data policy:**
- **Seed data command:** `TBD`
- **Retention policy:**
- **Backup policy:**
- **Recovery procedure:**
- **Data deletion procedure:**

### Data classification

| Data type | Classification                                   | Storage location | Retention | Notes |
| --------- | ------------------------------------------------ | ---------------- | --------- | ----- |
| `<data>`  | public \| internal \| confidential \| restricted |                  |           |       |

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

| Operation     | Command / procedure                                            | Notes                                                           |
| ------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| Start locally | `pnpm docker:up`                                               | Starts local PostgreSQL and Redis only                          |
| Stop locally  | `pnpm docker:down`                                             | Stops local PostgreSQL and Redis without deleting named volumes |
| Safe reset    | `TBD`                                                          | Include data-loss warnings                                      |
| Build         | `TBD`                                                          |                                                                 |
| Test          | `pnpm test`                                                    |                                                                 |
| Deploy        | `TBD`                                                          |                                                                 |
| Rollback      | `TBD`                                                          |                                                                 |
| View logs     | `docker compose -f .\infra\docker-compose.yml logs --tail=100` |                                                                 |
| Health check  | `pnpm docker:ps`                                               | Local infra service status                                      |
| Smoke test    | `pnpm docker:up; pnpm docker:ps; pnpm docker:down`             |                                                                 |

### Environments

| Environment | URL / identifier | Purpose                   | Data source | Notes |
| ----------- | ---------------- | ------------------------- | ----------- | ----- |
| Local       |                  | Development               |             |       |
| Staging     |                  | Pre-production validation |             |       |
| Production  |                  | User-facing runtime       |             |       |

### Operational safety

- **Safe stop/reset rules:**
- **Rollback trigger:**
- **Incident owner:**
- **Escalation path:**
- **Known fragile operations:**

---

## 13. Performance, reliability, and cost constraints

| Area                | Target / constraint | Measurement | Notes |
| ------------------- | ------------------- | ----------- | ----- |
| Latency SLO         | TBD                 |             |       |
| Throughput target   | TBD                 |             |       |
| Availability target | TBD                 |             |       |
| Error budget        | TBD                 |             |       |
| Resource limits     | TBD                 |             |       |
| Cost constraint     | TBD                 |             |       |

- **Known bottlenecks:**
- **Scalability assumptions:**
- **Load test status:**
- **Observability coverage:**

---

## 14. Architecture decision log

Record durable decisions here or link to full ADR files. Prefer separate ADR files for large decisions.

| ID      | Date       | Decision | Context | Rationale | Consequences | Status                             |
| ------- | ---------- | -------- | ------- | --------- | ------------ | ---------------------------------- |
| ADR-001 | YYYY-MM-DD |          |         |           |              | proposed \| accepted \| superseded |

---

## 15. Current constraints

| Constraint                                       | Type       | Impact                                             | Notes                                                  |
| ------------------------------------------------ | ---------- | -------------------------------------------------- | ------------------------------------------------------ |
| Real provider APIs disabled by default           | security   | Prevents accidental paid or credentialed API usage | Use mocks/local-only values unless explicitly approved |
| GitHub Actions not configured in Phase 0         | deployment | Validation is local-first                          | Add CI only in a later requested phase                 |
| No ingress, persistence, queue, or UI in Phase 1 | technical  | Core contracts only                                | Implement handlers/workers/dashboard in later phases   |

---

## 16. Current risks

| ID       | Risk | Probability        | Impact             | Mitigation | Owner | Status                          |
| -------- | ---- | ------------------ | ------------------ | ---------- | ----- | ------------------------------- |
| RISK-001 |      | low \| med \| high | low \| med \| high |            |       | open \| monitoring \| mitigated |

---

## 17. Known limitations

| ID        | Limitation | User impact | Workaround | Target resolution |
| --------- | ---------- | ----------- | ---------- | ----------------- |
| LIMIT-001 |            |             |            |                   |
| LIMIT-002 |            |             |            |                   |

---

## 18. Open questions

Track unknowns that block accurate implementation or operation. Resolve or move them into the relevant section when answered.

| ID    | Question | Owner | Needed by  | Status |
| ----- | -------- | ----- | ---------- | ------ |
| Q-001 |          |       | YYYY-MM-DD | open   |

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
