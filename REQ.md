# REQ.md

> Source-of-truth product requirements template. If a requirement, constraint, or acceptance condition is not captured here, it is not committed scope.

## Template rules

- Keep IDs stable after approval. Do not renumber existing IDs; mark obsolete items as `deprecated` or `archived`.
- Every P0/P1 functional requirement must map to at least one acceptance criterion and one validation method.
- Use `TBD` only when the item also has an owner and a decision date in **Open questions**.
- Prefer testable language: observable behavior, explicit inputs/outputs, measurable targets, and clear failure handling.
- Priority scale: `P0 = required for launch`, `P1 = important`, `P2 = nice-to-have / later`.
- Status values: `proposed | approved | in progress | implemented | deferred | deprecated`.

---

## Meta

| Field                  | Value                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| Last updated           | YYYY-MM-DD                                                                                  |
| Owner                  | `<name>`                                                                                    |
| Status                 | draft \| active \| approved \| archived                                                     |
| Project type           | portfolio/demo \| client \| internal tool \| automation \| QA \| API/backend \| AI workflow |
| Version                | v0.1                                                                                        |
| Related docs           | PRD / TECH / TEST / DESIGN / API docs                                                       |
| Repository / workspace | `<link>`                                                                                    |
| Stakeholders           | `<names / roles>`                                                                           |

---

## 1. Product brief

- **Product / feature:**
- **One-line value proposition:**
- **Problem being solved:**
- **Why now:**
- **Target users:**
- **Primary user roles:**
- **Current workaround / alternative:**
- **Key constraints:**
- **Primary risks to value delivery:**

---

## 2. Target audience / ICP

| Segment                 | Description | Context of use | Pain points | Success need |
| ----------------------- | ----------- | -------------- | ----------- | ------------ |
| Primary                 |             |                |             |              |
| Secondary               |             |                |             |              |
| Excluded / not targeted |             |                |             |              |

---

## 3. Goals and success metrics

### 3.1 Business goals

| ID     | Goal | Rationale | Metric / target | Priority |
| ------ | ---- | --------- | --------------- | -------- |
| BG-001 |      |           |                 | P0/P1/P2 |
| BG-002 |      |           |                 | P0/P1/P2 |
| BG-003 |      |           |                 | P0/P1/P2 |

### 3.2 Success metrics

- **North star metric:**
- **Leading indicators:**
- **Guardrail metrics:**
- **Measurement source:**
- **Review cadence:**

### 3.3 Success definition

The project is successful when:

- [ ] P0 functional requirements are implemented.
- [ ] P0/P1 acceptance criteria pass.
- [ ] Required quality gates pass.
- [ ] Manual smoke test passes.
- [ ] Required documentation is current.
- [ ] Security, privacy, and secrets checks pass.
- [ ] No forbidden, unsafe, or explicitly out-of-scope behavior exists.

---

## 4. Jobs to be done

- **Primary JTBD:** When `[situation]`, I want to `[motivation/action]`, so I can `[desired outcome]`.
- **Core functional job:**
- **Emotional / social job:**
- **Desired outcome:**
- **Current friction:**

---

## 5. Scope

### 5.1 In scope

| ID         | Item | Priority | Notes / boundary |
| ---------- | ---- | -------- | ---------------- |
| REQ-IN-001 |      | P0/P1/P2 |                  |
| REQ-IN-002 |      | P0/P1/P2 |                  |
| REQ-IN-003 |      | P0/P1/P2 |                  |

### 5.2 Out of scope

| ID          | Item | Reason | Revisit trigger |
| ----------- | ---- | ------ | --------------- |
| REQ-OUT-001 |      |        |                 |
| REQ-OUT-002 |      |        |                 |
| REQ-OUT-003 |      |        |                 |

---

## 6. User and system flows

### 6.1 Happy path

1.
2.
3.

### 6.2 Edge cases

1.
2.
3.

### 6.3 Failure and recovery

1.
2.
3.

### 6.4 System boundaries

- **Actors:**
- **Systems involved:**
- **Trigger:**
- **Preconditions:**
- **Postconditions:**
- **Dependencies:**

---

## 7. Functional requirements

Functional requirements should describe observable product behavior, not implementation preferences unless the implementation is itself a requirement.

### 7.1 Summary

| ID     | Requirement | User story                                                 | Priority | Dependencies | Acceptance signal  | Status   |
| ------ | ----------- | ---------------------------------------------------------- | -------- | ------------ | ------------------ | -------- |
| FR-001 |             | As a `[role]`, I want `[capability]`, so that `[outcome]`. | P0/P1/P2 |              | test/manual signal | proposed |
| FR-002 |             | As a `[role]`, I want `[capability]`, so that `[outcome]`. | P0/P1/P2 |              | test/manual signal | proposed |
| FR-003 |             | As a `[role]`, I want `[capability]`, so that `[outcome]`. | P0/P1/P2 |              | test/manual signal | proposed |

### 7.2 Requirement detail

#### FR-001 — `[requirement name]`

- **Description:**
- **User story:** As a `[role]`, I want `[capability]`, so that `[outcome]`.
- **Inputs:**
- **Outputs:**
- **Business rules:**
- **Validation:**
- **Error handling:**
- **Data touched:**
- **Logging / analytics:**
- **Accessibility / localization notes:**
- **Acceptance criteria:** AC-001, AC-002
- **Validation method:** unit / integration / E2E / manual / review
- **Status:** proposed | approved | in progress | implemented | deferred | deprecated

#### FR-002 — `[requirement name]`

- **Description:**
- **User story:** As a `[role]`, I want `[capability]`, so that `[outcome]`.
- **Inputs:**
- **Outputs:**
- **Business rules:**
- **Validation:**
- **Error handling:**
- **Data touched:**
- **Logging / analytics:**
- **Accessibility / localization notes:**
- **Acceptance criteria:** AC-003
- **Validation method:** unit / integration / E2E / manual / review
- **Status:** proposed | approved | in progress | implemented | deferred | deprecated

---

## 8. Non-functional requirements

| ID      | Category          | Requirement | Target / threshold | Validation method                        | Priority |
| ------- | ----------------- | ----------- | ------------------ | ---------------------------------------- | -------- |
| NFR-001 | Performance       |             |                    | load test / benchmark / manual           | P0/P1/P2 |
| NFR-002 | Reliability       |             |                    | test / monitoring / review               | P0/P1/P2 |
| NFR-003 | Security          |             |                    | review / scan / test                     | P0/P1/P2 |
| NFR-004 | Accessibility     |             |                    | WCAG review / manual test                | P0/P1/P2 |
| NFR-005 | Localization      |             |                    | locale test / content review             | P0/P1/P2 |
| NFR-006 | Maintainability   |             |                    | code review / lint / architecture review | P0/P1/P2 |
| NFR-007 | Cost / budget     |             |                    | budget review / usage monitoring         | P0/P1/P2 |
| NFR-008 | Local development |             |                    | setup test / README check                | P0/P1/P2 |
| NFR-009 | Documentation     |             |                    | doc review                               | P0/P1/P2 |
| NFR-010 | Observability     |             |                    | logs / metrics / alerts review           | P0/P1/P2 |

---

## 9. Integration requirements

| ID      | External API / service | Purpose | Auth / secrets | Rate limits | Failure mode | Mock / test strategy | Live-test policy |
| ------- | ---------------------- | ------- | -------------- | ----------- | ------------ | -------------------- | ---------------- |
| INT-001 |                        |         |                |             |              |                      |                  |
| INT-002 |                        |         |                |             |              |                      |                  |

Additional notes:

- **Secrets storage:**
- **Required environment variables:**
- **Sandbox / staging availability:**
- **Fallback behavior:**
- **Third-party terms / compliance constraints:**

---

## 10. Data requirements

### 10.1 Entities

| ID       | Entity | Key fields | Source | Storage | Owner | PII / sensitive? |
| -------- | ------ | ---------- | ------ | ------- | ----- | ---------------- |
| DATA-001 |        |            |        |         |       | yes/no           |
| DATA-002 |        |            |        |         |       | yes/no           |

### 10.2 Data operations

- **Storage:**
- **Retention:**
- **Import / export:**
- **Backups:**
- **Migration / seed data:**
- **Deletion / privacy handling:**
- **Audit / activity logs:**
- **PII / sensitive data handling:**

---

## 11. Acceptance criteria and test plan

Acceptance criteria must be behavior-focused and mapped to requirements.

### 11.1 Acceptance criteria

| ID     | Requirement ref | Given | When | Then | Validation  | Priority |
| ------ | --------------- | ----- | ---- | ---- | ----------- | -------- |
| AC-001 | FR-001          |       |      |      | test/manual | P0/P1/P2 |
| AC-002 | FR-001          |       |      |      | test/manual | P0/P1/P2 |
| AC-003 | FR-002          |       |      |      | test/manual | P0/P1/P2 |

### 11.2 Quality gates

- [ ] P0/P1 requirements have acceptance criteria.
- [ ] Critical paths are covered by automated tests or documented manual validation.
- [ ] Error states and recovery behavior are tested.
- [ ] Integration mocks or sandbox tests pass.
- [ ] Security and secrets handling are reviewed.
- [ ] Accessibility baseline passes.
- [ ] Required documentation is current.

### 11.3 Manual smoke test

| Step | Action | Expected result | Pass / fail | Notes |
| ---- | ------ | --------------- | ----------- | ----- |
| 1    |        |                 |             |       |
| 2    |        |                 |             |       |
| 3    |        |                 |             |       |

---

## 12. Release and operational readiness

- **Target release / demo date:**
- **Release type:** demo | alpha | beta | production | internal-only
- **Rollout plan:**
- **Rollback plan:**
- **Monitoring / alerts:**
- **Support owner:**
- **Known limitations:**
- **Post-release validation:**

Readiness checklist:

- [ ] Scope is approved.
- [ ] P0 defects are resolved or explicitly accepted.
- [ ] Deployment / delivery steps are documented.
- [ ] Rollback path is documented.
- [ ] Stakeholders know what is included and excluded.

---

## 13. Risks, assumptions, and decisions

### 13.1 Risks and assumptions

| ID     | Type       | Description | Impact       | Likelihood   | Mitigation | Owner | Status      |
| ------ | ---------- | ----------- | ------------ | ------------ | ---------- | ----- | ----------- |
| RA-001 | assumption |             | low/med/high | low/med/high |            |       | open/closed |
| RA-002 | risk       |             | low/med/high | low/med/high |            |       | open/closed |

### 13.2 Decisions

| ID      | Decision | Rationale | Date       | Owner | Supersedes |
| ------- | -------- | --------- | ---------- | ----- | ---------- |
| DEC-001 |          |           | YYYY-MM-DD |       |            |

---

## 14. Open questions

| ID    | Question | Owner | Decision needed by | Impact if unresolved | Status      |
| ----- | -------- | ----- | ------------------ | -------------------- | ----------- |
| Q-001 |          |       | YYYY-MM-DD         |                      | open/closed |
| Q-002 |          |       | YYYY-MM-DD         |                      | open/closed |

---

## Appendix

### Glossary

| Term | Definition |
| ---- | ---------- |
|      |            |

### References

- `<link>`
- `<link>`
