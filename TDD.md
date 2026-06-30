# TDD.md

## Meta

- Last updated: 2026-05-28
- Owner: `<name/team>`
- Status: `draft` | `active` | `enforced`
- Applies to: `<repo/app/service>`
- Related docs: `REQ.md`, `CONTEXT.md`, `STATE.md`, `ARCHITECTURE.md`, `SECURITY.md`

## 1. Purpose and scope

This file is the source of truth for how tests are designed, written, run, and enforced in this project. It defines the TDD workflow, required test layers, CI quality gates, regression handling, flakiness protocol, and accepted exceptions.

Use this document for:

- new feature work;
- bug fixes and regressions;
- refactors that change behavior, contracts, state, persistence, performance, security posture, or UI flows;
- release readiness and phase-completion checks.

## 2. Testing policy

- Primary approach: strict TDD where feasible: red -> green -> refactor.
- Write tests first for behavior, contracts, validation, persistence, integrations, state transitions, authentication, authorization, error handling, risky business logic, and non-trivial UI.
- Scaffolding before tests is allowed only when needed to make tests runnable.
- Define expected behavior before implementation.
- Do not weaken, delete, skip, or rewrite tests only to make implementation pass.
- New bug fixes require a regression test that fails before the fix, unless infeasible and recorded as a known gap.
- Automated tests must not call live external APIs unless explicitly approved, isolated, marked, and safe to rerun.
- Production data must not be used in tests unless sanitized, approved, and documented.
- Any skipped applicable test or gate must be recorded with rationale, risk, owner, and next action.

## 3. Testing strategy

- Test pyramid: prioritize fast deterministic unit tests; support them with integration and contract tests; use E2E tests sparingly for critical user flows.
- Prefer testing public behavior and observable outcomes over implementation details.
- Prefer deterministic tests over sleeps, timing assumptions, network dependency, or shared mutable state.
- Prefer factories/builders over large brittle fixtures.
- Use mocks and stubs at process or system boundaries, not to hide behavior that should be tested.
- Use contract tests for APIs, adapters, schemas, events, queues, and third-party boundaries.
- Treat coverage as a signal, not proof of quality. Critical behavior and regressions take priority over arbitrary percentages.

## 4. Test environments

| Environment       | Purpose                                | Data policy                       | Command / URL        | Notes                                                |
| ----------------- | -------------------------------------- | --------------------------------- | -------------------- | ---------------------------------------------------- |
| Local             | Fast development feedback              | Synthetic or sanitized only       | `pnpm test -- --run` | Must run targeted or full local tests before commit. |
| CI                | Mandatory quality gate                 | Synthetic or sanitized only       | not configured       | Add only in a later approved phase.                  |
| Preview / staging | Integrated validation and smoke checks | Non-production or sanitized only  | not configured       | This project is local portfolio/demo only.           |
| Production smoke  | Post-release verification only         | Read-only or explicitly safe data | not configured       | No production deployment exists.                     |

## 5. Test layers

| Layer               | Required when                                                                            | Examples                                                 | Tool / location                                                                | Command                                                                      | Required for done?          |
| ------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------- |
| Unit                | Core logic, validation, transformations, state machines, utilities, business rules       | Pure functions, domain services, validators              | `packages/core/test`, `tools/simulator/test`                                   | `pnpm test -- --run`                                                         | yes                         |
| Integration         | Persistence, adapters, API handlers, queues, file systems, service boundaries            | Repository tests, API + DB tests, adapter tests          | `apps/api/test`, `apps/worker/test`, `packages/db/test`, `packages/queue/test` | `pnpm test -- --run`                                                         | yes                         |
| Contract            | Public APIs, schemas, events, third-party integrations, provider/consumer boundaries     | Provider payload compatibility and job contracts         | `packages/core/src/schemas`, `packages/queue/src/delivery-job.ts`              | `pnpm test -- --run`                                                         | yes                         |
| E2E                 | Critical UI or system flows where unit/integration tests cannot prove behavior           | Local webhook intake through worker/dashboard            | `tools/simulator/src/scenarios`, `docs/manual-verification-checklist.md`       | `pnpm simulator:all` after local services are running                        | yes for demo/runtime phases |
| Smoke               | Runnable app, service, worker, CLI, or release candidate exists                          | App boots, health endpoint, CLI help, basic workflow     | API, worker, Docker Compose, simulator                                         | `pnpm docker:up`, `pnpm docker:ps`, API/worker startup, `pnpm simulator:all` | yes for runtime phases      |
| Security / safety   | Secrets, auth, permissions, risky actions, external integrations, destructive operations | Access control, unsafe input, secret leakage, guardrails | `.env.example`, redaction/error tests, docs review                             | `pnpm test -- --run`, `git diff --check`, manual diff review                 | yes                         |
| Visual regression   | UI layout or design-critical screens exist                                               | Screenshots, responsive states                           | `docs/screenshot-checklist.md`                                                 | Manual browser review                                                        | no automated gate yet       |
| Performance smoke   | Latency, throughput, memory, startup time, or scale-sensitive code exists                | Baseline request time, job duration, render time         | n/a                                                                            | not configured                                                               | no                          |
| Accessibility smoke | User-facing UI exists                                                                    | Keyboard flow, labels, contrast, semantic structure      | dashboard pages                                                                | Manual browser review                                                        | no automated gate yet       |

## 6. Red-green-refactor workflow

1. Define expected behavior and acceptance criteria.
2. Identify the smallest useful test scope: unit, integration, contract, E2E, smoke, security, visual, performance, or accessibility.
3. Write a failing test where feasible.
4. Run the failing test or explain why it cannot be run yet.
5. Implement the minimal passing change.
6. Run targeted tests until green.
7. Refactor only while tests are green.
8. Run broader relevant checks before marking the phase done.
9. Update `STATE.md`, documentation, test notes, and this file when policy or coverage expectations change.

## 7. Feature / change test plan template

Use this section for each non-trivial feature, bug fix, or behavior-changing refactor.

### Feature / change: `<name>`

- Requirement link: `REQ.md#...`
- Context link: `CONTEXT.md#...`
- Design / architecture link: `ARCHITECTURE.md#...`
- Owner: `<name>`
- Risk level: `low` | `medium` | `high`
- Affected components: `<components>`

### Behavior to verify

| Case                                               | Required? | Layer | Test name / location | Notes |
| -------------------------------------------------- | --------- | ----- | -------------------- | ----- |
| Happy path                                         | yes/no    |       |                      |       |
| Validation / invalid input                         | yes/no    |       |                      |       |
| Error handling / retry behavior                    | yes/no    |       |                      |       |
| Authentication / authorization                     | yes/no    |       |                      |       |
| State transition / persistence                     | yes/no    |       |                      |       |
| External integration / contract                    | yes/no    |       |                      |       |
| Edge conditions / boundaries                       | yes/no    |       |                      |       |
| Backward compatibility                             | yes/no    |       |                      |       |
| Regression coverage                                | yes/no    |       |                      |       |
| Observability: logs, metrics, traces, audit events | yes/no    |       |                      |       |

### Test data

- Fixtures: `<location>`
- Factories / builders: `<location>`
- Mocks / stubs: `<approach>`
- Seed data: `<location/command>`
- External systems: `<mocked/sandbox/live-approved>`
- Sensitive data handling: `<sanitized/synthetic/none>`

### Exit criteria

- Expected behavior is documented and linked.
- All mandatory test cases are implemented or recorded as known gaps.
- Required gates pass locally where practical and in CI where configured.
- No unowned flaky, skipped, or quarantined test remains.
- Regression coverage exists for fixed defects.
- Documentation and `STATE.md` are updated.

## 8. Quality gates

### Required gates

| Gate                    | Command                                                                                                            | Required when                                                        | Pass criteria                              | Required for phase done? |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------ | ------------------------ |
| Format                  | `pnpm format:check`                                                                                                | Code or docs are changed                                             | No formatting diff remains                 | yes                      |
| Lint                    | `pnpm lint`                                                                                                        | Code is changed                                                      | No lint errors                             | yes                      |
| Typecheck               | `pnpm typecheck`                                                                                                   | Typed code is changed                                                | No type errors                             | yes                      |
| Unit tests              | `pnpm test -- --run`                                                                                               | Any logic is changed                                                 | All relevant tests pass                    | yes                      |
| Integration tests       | `pnpm test -- --run`                                                                                               | Adapters, API, persistence, queues, files, or services are changed   | All relevant tests pass                    | yes                      |
| Contract tests          | `pnpm test -- --run`                                                                                               | Schemas, public APIs, events, or provider/consumer boundaries change | Contracts are compatible or versioned      | yes                      |
| Build                   | `pnpm typecheck`                                                                                                   | Typed code changes; no root `build` script exists                    | TypeScript build mode succeeds             | yes                      |
| Smoke                   | `pnpm docker:up`, `pnpm docker:ps`, `pnpm db:migrate`, `pnpm demo:reset`, API/worker startup, `pnpm simulator:all` | Runnable app/service/worker/CLI exists                               | Basic runtime path succeeds                | yes for runtime phases   |
| Forbidden / secret scan | `git diff --check` plus manual diff review                                                                         | Any code, config, or docs change                                     | No committed secrets or forbidden patterns | yes                      |
| Docs / state check      | Manual review                                                                                                      | Behavior, workflow, command, policy, or status changes               | Relevant docs and `STATE.md` are current   | yes                      |

### Optional gates

| Gate                | Command                                  | Required when promoted to mandatory                      | Notes                                                 |
| ------------------- | ---------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| E2E                 | `pnpm simulator:all`                     | Critical flow cannot be sufficiently covered below E2E   | Requires Docker services, API, and worker.            |
| Visual regression   | Manual browser/screenshot checklist      | Visual layout is user-critical                           | No automated visual regression is configured.         |
| Performance smoke   | not configured                           | Latency, memory, throughput, or startup time is material | Track baseline and threshold before making mandatory. |
| Accessibility smoke | Manual dashboard keyboard/semantic check | User-facing UI changes                                   | Include keyboard and semantic checks.                 |
| Dependency audit    | `pnpm install`, manifest/lockfile review | Dependencies change or release is prepared               | No dependency audit gate is currently configured.     |

### Skipped gate record

A skipped applicable gate must be recorded here before the phase is considered done.

| Date       | Gate | Why skipped | Risk | Next action | Owner | Due date |
| ---------- | ---- | ----------- | ---- | ----------- | ----- | -------- |
| YYYY-MM-DD |      |             |      |             |       |          |

## 9. Fixtures, mocks, and test data

- Fixture location: `<path>`
- Factory / builder location: `<path>`
- Mocking approach: `<policy>`
- Stub server / fake service approach: `<policy>`
- Snapshot policy: `<when allowed, review rules>`
- Live API policy: disabled by default; allowed only with explicit approval, isolation, safe credentials, and clear test markers.
- Test data safety: use synthetic or sanitized data only; never commit secrets, production credentials, private customer data, or irreversible destructive test data.
- Determinism rule: tests must not depend on wall-clock time, random order, external network availability, or shared state unless controlled.

## 10. Coverage policy

- Project coverage target: `<none/project-specific threshold>`
- Minimum required coverage for critical paths: `<policy>`
- Coverage exclusions: `<generated code, migrations, build artifacts, etc.>`
- Coverage is a diagnostic signal, not the definition of quality.
- Prioritize meaningful tests for critical flows, security-sensitive logic, persistence, external contracts, and regressions.
- Raising coverage by testing implementation details is discouraged.

## 11. Regression policy

### Regression checklist

- Existing core flows are unaffected.
- Backward compatibility is validated or a migration/versioning plan is documented.
- Fixed defects have regression tests where feasible.
- Critical bug fixes include root-cause analysis.
- Related edge cases are checked, not only the exact reported scenario.
- Release notes or migration notes are updated when users or operators are affected.

### Regression log

| Bug ID  | Date       | Found in      | Root cause | Test added? | Test location | Preventive action | Owner    |
| ------- | ---------- | ------------- | ---------- | ----------- | ------------- | ----------------- | -------- |
| BUG-001 | YYYY-MM-DD | `<phase/env>` | `<cause>`  | yes/no      | `<path>`      | `<action>`        | `<name>` |

## 12. Flakiness protocol

- Do not ignore flaky tests.
- Do not delete flaky-test coverage without replacement.
- Mark suspected flaky tests in this section and in the test runner only if the runner supports clear quarantine semantics.
- Quarantine is temporary and must include owner, risk, and due date.
- Max quarantine period: `<duration>`
- While quarantined, the owner must either fix determinism, isolate the dependency, replace the test with stable coverage, or justify removal.

| Test               | First seen | Suspected cause | Quarantined? | Owner | Due date | Resolution |
| ------------------ | ---------- | --------------- | ------------ | ----- | -------- | ---------- |
| `<test name/path>` | YYYY-MM-DD |                 | yes/no       |       |          |            |

## 13. Known gaps and test debt

Known gaps are allowed only when explicit, owned, and time-bound.

| Gap     | Affected area | Risk            | Reason not covered now | Next action | Owner | Due date |
| ------- | ------------- | --------------- | ---------------------- | ----------- | ----- | -------- |
| `<gap>` |               | low/medium/high |                        |             |       |          |

## 14. Definition of done

A phase, feature, bug fix, or refactor is done only when:

- expected behavior is defined;
- tests were written first where feasible;
- applicable test layers are implemented or documented as gaps;
- required quality gates pass;
- skipped gates are recorded with risk and next action;
- no unowned flaky or quarantined tests remain;
- regressions have tests where feasible;
- docs, `STATE.md`, and related source-of-truth files are updated.
