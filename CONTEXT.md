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

| Field | Value |
|---|---|
| Last updated | YYYY-MM-DD |
| Owner | <name/team> |
| Status | draft \| active \| frozen |
| Current phase | discovery \| build \| stabilization \| production \| maintenance |
| Repository | <repo name / URL> |
| Primary runtime | <local / staging / production / other> |

### Status meanings

- `draft`: incomplete or being established.
- `active`: current working context; keep updated as the project changes.
- `frozen`: preserved for a release, migration, audit, or archived state.

---

## 2. System overview

- **Product domain:**
- **Primary users:**
- **Problem solved:**
- **High-level architecture:**
- **Current architecture:**
- **Current phase:**
- **Main runtime surfaces:**
  - Frontend/UI:
  - Backend/API:
  - Workers/jobs:
  - CLI/scripts:
  - External integrations:
- **Critical user-visible flows:**
  1.
  2.
  3.
- **Core modules:**
  - `<module>`:
- **Non-goals / out of scope:**
  -

---

## 3. Source-of-truth files

Use this section to define document responsibility and avoid conflicting instructions.

| File | Responsibility | Update trigger |
|---|---|---|
| `README.md` | Setup, quickstart, common developer entry points | Install/dev workflow changes |
| `REQ.md` | Product requirements, user stories, acceptance criteria | Requirement or scope changes |
| `DESIGN.md` | Technical design, architecture, trade-offs, diagrams | Design or architecture changes |
| `CONTEXT.md` | Current project context, stack, repo map, commands, constraints | Any implementation-context change |
| `STATE.md` | Current implementation state, completed work, next actions | Progress changes after meaningful work |
| `TDD.md` | Test strategy, test cases, acceptance checks, quality gate | Test strategy or coverage changes |
| `RUNBOOK.md` | Operations, deployment, rollback, incidents, recovery | Operational procedure changes |
| `AGENTS.md` | Agent-specific working rules, codebase conventions, automation constraints | Agent workflow or convention changes |
| `ADR/` or `docs/adr/` | Durable architecture decisions | Significant irreversible or costly decisions |

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

| Path | Purpose | Notes / owner |
|---|---|---|
| `/` | Project root |  |
| `/app` | Application frontend or primary app code |  |
| `/api` | API/server code |  |
| `/src` | Shared source code, if applicable |  |
| `/tests` | Automated tests |  |
| `/docs` | Project documentation |  |
| `/scripts` | Local or operational scripts |  |
| `/config` | Configuration files |  |
| `/infra` | Infrastructure/deployment definitions |  |
| `<path>` | `<purpose>` | `<notes>` |

### Important generated or ignored paths

| Path | Reason |
|---|---|
| `<path>` | Generated; do not edit directly |
| `<path>` | Build output; safe to delete/regenerate |

---

## 5. Tech stack and dependencies

| Area | Current choice | Notes |
|---|---|---|
| Frontend | TBD |  |
| Backend | TBD |  |
| Runtime | TBD | Example: Node.js, Python, Bun, Deno, JVM, Go |
| Package manager | TBD | Example: npm, pnpm, yarn, uv, pip, poetry |
| Frameworks | TBD |  |
| Database/storage | TBD |  |
| Queue/background jobs | TBD |  |
| Cache | TBD |  |
| Search/indexing | TBD |  |
| Auth provider | TBD |  |
| External services | TBD |  |
| Third-party SDKs | TBD |  |
| Testing | TBD |  |
| Tooling | TBD | Formatters, linters, typecheckers, codegen |
| Docker | not configured \| configured |  |
| Hosting/deployment target | TBD |  |
| CI/CD | not configured \| configured | Do not assume configured unless explicitly added |

### Dependency rules

- **Allowed dependency policy:**
- **Forbidden dependency policy:**
- **Version pinning policy:**
- **Upgrade policy:**
- **License constraints:**

---

## 6. Commands and quality gate

All commands should be runnable from the repository root unless stated otherwise.

| Purpose | Command | Notes |
|---|---|---|
| Install dependencies | `TBD` |  |
| Run dev server | `TBD` |  |
| Run tests | `TBD` |  |
| Run unit tests | `TBD` |  |
| Run integration tests | `TBD` |  |
| Lint | `TBD` |  |
| Format | `TBD` |  |
| Typecheck | `TBD` |  |
| Build | `TBD` |  |
| Database migration | `TBD` |  |
| Seed fixtures/test data | `TBD` |  |
| Smoke test | `TBD` |  |
| Full quality gate | `TBD` | Must pass before merge/release |

### Quality gate definition

A change is considered safe to merge only when the following pass:

1. `TBD`
2. `TBD`
3. `TBD`

If no automated quality gate exists yet, state that explicitly and define the current manual check.

---

## 7. Domain model

### Entities

| Entity | Responsibility | Persistence | Notes |
|---|---|---|---|
| `<Entity>` |  |  |  |

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
|---|---|---|---|---|---|
| `TBD` | `TBD` |  |  |  |  |

### Internal contracts

| Type | Name | Producer | Consumer | Contract location | Notes |
|---|---|---|---|---|---|
| Event | `TBD` |  |  |  |  |
| Job | `TBD` |  |  |  |  |
| Function/module boundary | `TBD` |  |  |  |  |

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

| Data type | Classification | Storage location | Retention | Notes |
|---|---|---|---|---|
| `<data>` | public \| internal \| confidential \| restricted |  |  |  |

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

| Operation | Command / procedure | Notes |
|---|---|---|
| Start locally | `TBD` |  |
| Stop locally | `TBD` |  |
| Safe reset | `TBD` | Include data-loss warnings |
| Build | `TBD` |  |
| Test | `TBD` |  |
| Deploy | `TBD` |  |
| Rollback | `TBD` |  |
| View logs | `TBD` |  |
| Health check | `TBD` |  |
| Smoke test | `TBD` |  |

### Environments

| Environment | URL / identifier | Purpose | Data source | Notes |
|---|---|---|---|---|
| Local |  | Development |  |  |
| Staging |  | Pre-production validation |  |  |
| Production |  | User-facing runtime |  |  |

### Operational safety

- **Safe stop/reset rules:**
- **Rollback trigger:**
- **Incident owner:**
- **Escalation path:**
- **Known fragile operations:**

---

## 13. Performance, reliability, and cost constraints

| Area | Target / constraint | Measurement | Notes |
|---|---|---|---|
| Latency SLO | TBD |  |  |
| Throughput target | TBD |  |  |
| Availability target | TBD |  |  |
| Error budget | TBD |  |  |
| Resource limits | TBD |  |  |
| Cost constraint | TBD |  |  |

- **Known bottlenecks:**
- **Scalability assumptions:**
- **Load test status:**
- **Observability coverage:**

---

## 14. Architecture decision log

Record durable decisions here or link to full ADR files. Prefer separate ADR files for large decisions.

| ID | Date | Decision | Context | Rationale | Consequences | Status |
|---|---|---|---|---|---|---|
| ADR-001 | YYYY-MM-DD |  |  |  |  | proposed \| accepted \| superseded |

---

## 15. Current constraints

| Constraint | Type | Impact | Notes |
|---|---|---|---|
| `TBD` | budget \| security \| deployment \| time \| technical \| product |  |  |

---

## 16. Current risks

| ID | Risk | Probability | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| RISK-001 |  | low \| med \| high | low \| med \| high |  |  | open \| monitoring \| mitigated |

---

## 17. Known limitations

| ID | Limitation | User impact | Workaround | Target resolution |
|---|---|---|---|---|
| LIMIT-001 |  |  |  |  |
| LIMIT-002 |  |  |  |  |

---

## 18. Open questions

Track unknowns that block accurate implementation or operation. Resolve or move them into the relevant section when answered.

| ID | Question | Owner | Needed by | Status |
|---|---|---|---|---|
| Q-001 |  |  | YYYY-MM-DD | open |

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
