# DESIGN.md

## Meta

- Last updated: YYYY-MM-DD
- Owner: [name/team]
- Status: draft | active | frozen
- Scope: [project / feature / subsystem]
- Related docs: [README.md, SPEC.md, TEST.md, RUNBOOK.md, ADRs]
- Review cadence: [per release / monthly / when architecture changes]

> This file is the source of truth for how the system is designed. Update it before or alongside any architecture-impacting implementation change.

## 1. Design objective

Describe what this project or feature is designed to do, why it exists, and what a user can observe once it works.

- User-observable outcome:
- Primary goals:
- Non-goals:
- Success criteria:
- Constraints and assumptions:

## 2. Architecture summary

Describe the system in 1-3 paragraphs. Include the main architecture pattern, the core execution path, and the major tradeoffs.

| Area                  | Current design                                                             |
| --------------------- | -------------------------------------------------------------------------- |
| Implementation format | [library / service / CLI / web app / worker / pipeline / hybrid]           |
| Main components       | [components and responsibilities]                                          |
| Data flow             | [how data enters, moves through, and leaves the system]                    |
| Runtime model         | [request/response, scheduled jobs, event-driven, batch, queue-based, etc.] |
| Integration points    | [external APIs, databases, queues, file stores, model providers, webhooks] |
| Testing strategy      | [unit, integration, E2E, smoke, contract, manual]                          |

## 3. Selected stack

| Layer                | Choice | Why | Local tooling / commands | Constraints |
| -------------------- | ------ | --- | ------------------------ | ----------- |
| Frontend             |        |     |                          |             |
| Backend              |        |     |                          |             |
| Database / storage   |        |     |                          |             |
| Integrations         |        |     |                          |             |
| Testing              |        |     |                          |             |
| Build / packaging    |        |     |                          |             |
| Deployment / runtime |        |     |                          |             |

## 4. Repository architecture

```text
[paste repository tree]
```

Repository conventions:

- Source code layout:
- Test layout:
- Configuration layout:
- Generated files:
- Files or directories that must not be edited manually:

## 5. Component map

| Component   | Path   | Responsibility   | Key dependencies | Public interface / contract           | Tests        |
| ----------- | ------ | ---------------- | ---------------- | ------------------------------------- | ------------ |
| [component] | [path] | [responsibility] | [dependencies]   | [API, CLI, event, function, UI route] | [test paths] |

## 6. Runtime / pipeline design

Describe request lifecycles, background jobs, automation steps, queues, ETL flows, AI/model pipelines, or scheduled work.

- Entry points:
- Request or job lifecycle:
- Background jobs / schedulers:
- Queues / event streams:
- ETL, AI, or automation pipeline steps:
- State transitions:
- Idempotency strategy:
- Concurrency and rate limits:
- Caching strategy:
- Deployment/runtime environment:

## 7. Data model and contracts

### Domain entities

| Entity   | Fields   | Invariants                    | Storage                  | Lifecycle / retention                   |
| -------- | -------- | ----------------------------- | ------------------------ | --------------------------------------- |
| [entity] | [fields] | [rules that must always hold] | [table/file/index/cache] | [create/update/delete/retention policy] |

### API / integration contracts

| Boundary   | Contract / schema                                | Validation boundary               | Failure handling                 | Versioning / compatibility |
| ---------- | ------------------------------------------------ | --------------------------------- | -------------------------------- | -------------------------- |
| [boundary] | [request/response, event, file format, API spec] | [where and how validation occurs] | [fallback, retry, error mapping] | [versioning policy]        |

Contract rules:

- Schema ownership:
- Backward compatibility policy:
- Required validation before persistence:
- Required validation before external calls:

## 8. Error handling and resilience design

- Expected errors:
- User-facing error behavior:
- Internal error classification:
- Logging behavior:
- Alerting behavior:
- Retry policy:
- Idempotency policy:
- Timeout policy:
- Circuit-breaker or backoff policy:
- Degraded-mode behavior:
- Recovery / backfill procedure:

## 9. Security, privacy, and safety design

- Secrets management:
- Auth/authz or permissions:
- Input validation:
- Output validation:
- Data privacy / PII handling:
- Logging redaction:
- External service trust boundaries:
- Unsafe operations avoided:
- Forbidden features:
- Threat model notes:

## 10. Observability and operations

- Structured logs:
- Metrics:
- Tracing:
- Dashboards:
- Alerts:
- Audit events:
- Health checks:
- Migrations:
- Rollback strategy:
- Local setup / developer workflow:

## 11. Validation design

- Unit tests:
- Integration tests:
- Contract tests:
- E2E tests:
- Smoke tests:
- Manual checks:
- Performance / load checks:
- Security checks:
- Forbidden-pattern checks:
- CI quality gate:

## 12. Phase plan / delivery model

| Phase | Name       | Objective | Done when | Quality gate | Owner | Status  |
| ----- | ---------- | --------- | --------- | ------------ | ----- | ------- |
| 0     | Foundation |           |           |              |       | planned |
| 1     |            |           |           |              |       | planned |

## 13. Current architecture decisions

| ID      | Decision   | Why      | Alternatives considered | Tradeoff             | Date       | Status   |
| ------- | ---------- | -------- | ----------------------- | -------------------- | ---------- | -------- |
| ADR-001 | [decision] | [reason] | [alternatives]          | [cost/risk accepted] | YYYY-MM-DD | proposed |

Decision status values: proposed | accepted | superseded | rejected.

## 14. Known limitations and risks

| ID    | Limitation / risk    | Impact   | Mitigation                    | Owner   | Status |
| ----- | -------------------- | -------- | ----------------------------- | ------- | ------ |
| R-001 | [limitation or risk] | [impact] | [mitigation or accepted risk] | [owner] | open   |

## 15. Open design questions

| ID     | Question   | Risk if unresolved | Proposed default                | Owner   | Status |
| ------ | ---------- | ------------------ | ------------------------------- | ------- | ------ |
| DQ-001 | [question] | [risk]             | [default decision if no answer] | [owner] | open   |

## 16. Change log

| Date       | Change               | Reason | Author |
| ---------- | -------------------- | ------ | ------ |
| YYYY-MM-DD | Initial design draft |        | [name] |
