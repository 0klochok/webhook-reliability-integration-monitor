# STATE.md

> Purpose: single source of truth for current project state, especially across contributors, AI/Codex sessions, and handoffs. Keep it brief, factual, and evidence-based. Update after any material change, validation run, blocker, decision, or phase transition.

## Meta

- Last updated: YYYY-MM-DD HH:mm TZ
- Owner: <name/team>
- Contributors: <names/roles>
- Repository path: <path-or-url>
- Current branch: <branch>
- Current phase: Phase N — <name>
- Overall status: on-track | at-risk | blocked
- Quality gate status: unknown | baseline captured | green | red
- Completion: 0-100%
- Main blocker: none | <blocker>

## Update rules

- Keep entries concise: prefer paths, commands, dates, commit hashes, PRs, and direct evidence.
- Move finished work out of **Active tasks** into **Completed since last update**.
- Mark quality as **green** only when every required gate is `pass` or explicitly `n/a` with a reason.
- Any blocker must appear in **Known issues** or **Risks** with an owner and next action.
- Do not use this file as a full changelog; summarize and link to commits, PRs, logs, or docs.

## 1. Current objective

- Phase objective: <what this phase is trying to achieve>
- Deadline / target date: YYYY-MM-DD | none
- Definition of done: <specific completion criteria>
- Primary user-visible signal: <what the user should see when this is working>
- Secondary checks: <supporting checks, metrics, or edge cases>
- Out of scope: <what should not be changed now>

## 2. Status snapshot

- Summary: <one-paragraph current state>
- Since last update: <most important change>
- Current focus: <what is being worked on now>
- Main uncertainty: none | <unknown / assumption to verify>

## 3. Completed phases / milestones

| Phase | Date | Summary | Quality gate | Commit / PR |
|---|---|---|---|---|
| Phase 0 — <name> | YYYY-MM-DD | <summary> | pass/partial/fail/n/a | <hash-or-link> |

## 4. Completed since last update

- YYYY-MM-DD: <completed item> — evidence: <commit/PR/log/path>

## 5. Changed files

| Path | Purpose | Status | Notes |
|---|---|---|---|
| <path> | <why changed> | created/updated/deleted/renamed | <important notes> |

## 6. Validation and quality gates

### Required gates

| Gate | Command | Status | Evidence / notes |
|---|---|---|---|
| format | <command> | pass/fail/not run/n/a | <output, log path, or reason> |
| lint | <command> | pass/fail/not run/n/a | <output, log path, or reason> |
| typecheck | <command> | pass/fail/not run/n/a | <output, log path, or reason> |
| unit tests | <command> | pass/fail/not run/n/a | <output, log path, or reason> |
| integration tests | <command> | pass/fail/not run/n/a | <output, log path, or reason> |
| build | <command> | pass/fail/not run/n/a | <output, log path, or reason> |
| smoke/manual | <steps-or-command> | pass/fail/not run/n/a | <evidence or scenario> |
| docs check | <command-or-review> | pass/fail/not run/n/a | <output, log path, or reason> |
| forbidden scan | <command> | pass/fail/not run/n/a | <secrets, debug logs, TODO policy, generated files, etc.> |

### Optional / skipped gates

| Gate | Status | Reason | Follow-up |
|---|---|---|---|
| e2e | skipped/not run/pass/fail/n/a | <why> | <when/how to run> |
| performance | skipped/not run/pass/fail/n/a | <why> | <when/how to run> |
| accessibility | skipped/not run/pass/fail/n/a | <why> | <when/how to run> |

## 7. Active tasks

| ID | Priority | Task | Owner | Status | ETA | Notes |
|---|---|---|---|---|---|---|
| TASK-001 | P0/P1/P2/P3 | <task> | <owner> | todo/in-progress/review/blocked | YYYY-MM-DD | <notes> |

## 8. Backlog / long horizon

| Priority | Item | Impact | Effort | Status | Notes |
|---|---|---|---|---|---|
| P0/P1/P2/P3 | <item> | low/med/high | low/med/high | proposed/accepted/deferred/rejected | <notes> |

## 9. Known issues

| ID | Issue | Severity | Owner / layer | Next action | Target |
|---|---|---|---|---|---|
| ISSUE-001 | <issue> | P0/P1/P2/P3 | <owner-or-layer> | <next action> | YYYY-MM-DD |

## 10. Risks

| ID | Risk | Probability | Impact | Mitigation | Owner | Trigger / watch signal |
|---|---|---|---|---|---|---|
| RISK-001 | <risk> | low/med/high | low/med/high | <mitigation> | <owner> | <signal> |

## 11. Decisions since last update

| ID | Date | Decision | Rationale | Tradeoff / consequence |
|---|---|---|---|---|
| DEC-001 | YYYY-MM-DD | <decision> | <why> | <tradeoff> |

## 12. Open questions

| ID | Question | Owner | Needed by | Current best answer / assumption |
|---|---|---|---|---|
| Q-001 | <question> | <owner> | YYYY-MM-DD | <assumption> |

## 13. Next 3 actions

1. <owner>: <action> — expected result: <result>
2. <owner>: <action> — expected result: <result>
3. <owner>: <action> — expected result: <result>

## 14. Handoff notes

- Start here next: <path/command/task ID>
- Read first: <files/docs/issues>
- Commands to run first: <commands>
- Do not change: <protected paths/decisions/scope>
- Watch for: <risk, flaky test, migration, hidden dependency>
- Suggested next prompt: <prompt for next AI/Codex session>
