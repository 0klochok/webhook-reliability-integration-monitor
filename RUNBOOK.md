# RUNBOOK.md

## Meta

- Last updated: YYYY-MM-DD
- Owner: <owner>
- Status: draft | active
- Project: <project-slug>
- Repository: <repo-url-or-local-path>
- Primary environment: Windows / PowerShell

## 1. Project overview

- Purpose: <what this project does and why it exists>
- Primary users: <who uses or maintains it>
- Stack:
  - Runtime: <Node.js / Python / other>
  - Backend: <framework/package, if applicable>
  - Frontend: <framework/package, if applicable>
  - Database: <database, if applicable>
  - Infrastructure/services: <Docker / external APIs / queues / other>
- Repository path:

```powershell
Set-Location -LiteralPath "C:\Users\Санька\Documents\Coding Projects\<project-slug>"
```

- Main entry points:
  - Backend: `<path-or-module>`
  - Frontend: `<path-or-package>`
  - Scripts: `.\scripts\<important-script>.ps1`

> Keep this file operational. Replace placeholders with project-specific commands and delete sections that do not apply.

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

| Tool | Required version | Check command | Notes |
|---|---:|---|---|
| Node.js | `<version>` | `node --version` | Delete if not applicable. |
| pnpm | `<version>` | `pnpm --version` | Use through Corepack if applicable. |
| Python | `<version>` | `python --version` | Delete if not applicable. |
| uv | `<version>` | `uv --version` | Delete if not applicable. |
| Docker | `<version>` | `docker --version` | Delete if not applicable. |

### 3.2 Enter the project folder

```powershell
Set-Location -LiteralPath "C:\Users\Санька\Documents\Coding Projects\<project-slug>"
git status --short
```

### 3.3 Install dependencies

Use only the commands that apply to this project.

```powershell
# TypeScript / Node.js projects
corepack enable
pnpm install

# Python projects
uv sync

# Docker-backed services, if used
docker compose pull
docker compose up -d
```

## 4. Environment variables

1. Copy `.env.example` to `.env` only when local environment variables are required.
2. Fill local values manually.
3. Never commit `.env` or real secrets.
4. Keep `.env.example` current with placeholder values only.

| Variable | Required | Description | Example placeholder |
|---|---|---|---|
| `<VARIABLE_NAME>` | yes/no | `<what it controls>` | `<placeholder-value>` |

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
Set-Location -LiteralPath "C:\Users\Санька\Documents\Coding Projects\<project-slug>"
git status --short
# Optional, only when safe for the current branch/task:
# git pull --ff-only
```

## 6. Start services

Replace the placeholders with the actual commands for this project. Delete unused rows.

| Service | Purpose | Start command | URL / health check |
|---|---|---|---|
| Frontend | `<purpose>` | `pnpm dev` | `http://localhost:<port>` |
| Backend | `<purpose>` | `uv run uvicorn <package>.main:app --reload` | `http://localhost:<port>/health` |
| Docker services | `<purpose>` | `docker compose up -d` | `docker compose ps` |

Common command block:

```powershell
# Frontend
pnpm dev

# Backend
uv run uvicorn <package>.main:app --reload

# Docker services
docker compose up -d
docker compose ps
```

## 7. Run tests

Use only the commands that apply.

```powershell
# TypeScript / Node.js
pnpm test

# Python
uv run pytest

# End-to-end tests, if applicable
pnpm test:e2e
```

## 8. Run quality gate

The quality gate should be the default pre-commit validation command.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\quality-gate.ps1
```

Expected checks:

- Formatting
- Linting
- Type checking
- Unit tests
- Build check, if applicable

## 9. Run smoke tests

Run smoke tests after starting required services and before committing changes that affect runtime behavior.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\smoke.ps1
```

Smoke-test target:

| Area | Command or URL | Expected result |
|---|---|---|
| Frontend | `http://localhost:<port>` | `<expected page/status>` |
| Backend health | `http://localhost:<port>/health` | `<expected response>` |
| CLI/job | `<command>` | `<expected output>` |

## 10. Logs

| Source | How to inspect | Notes |
|---|---|---|
| Development server | Terminal running the service | `<what to look for>` |
| Tests | Test command output | `<where reports are written>` |
| Docker services | `docker compose logs --tail=100` | Add service name when useful. |

```powershell
# All Docker logs
docker compose logs --tail=100

# Follow all Docker logs
docker compose logs --tail=100 -f

# One service
docker compose logs --tail=100 <service-name>
```

## 11. Debugging common issues

| Symptom | Likely cause | Fix | Validation |
|---|---|---|---|
| `<symptom>` | `<cause>` | `<fix>` | `<command/check>` |
| Port already in use | Previous dev server still running | Stop the old process or change the port | Service starts successfully |
| Missing environment variable | `.env` incomplete or not loaded | Compare `.env` with `.env.example` | App starts without config error |
| Dependency command fails | Wrong package manager or stale install | Verify tool versions, reinstall dependencies if approved | Tests/quality gate pass |

## 12. Safe stop and reset

```powershell
# Stop a foreground dev server
# Press Ctrl+C in the terminal running it.

# Stop Docker services, if used
docker compose down
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
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\forbidden-search.ps1
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
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\quality-gate.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\smoke.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\forbidden-search.ps1
git diff -- .
```

## 17. Known limitations

| ID | Limitation | Impact | Workaround / decision |
|---|---|---|---|
| LIMIT-001 | `<limitation>` | `<impact>` | `<workaround>` |
| LIMIT-002 | `<limitation>` | `<impact>` | `<workaround>` |

## 18. Related documentation

- `README.md`: setup and high-level usage
- `CONTEXT.md`: project context and decisions
- `DESIGN.md`: architecture and design rationale
- `.env.example`: environment variable template
- `scripts/`: validation and helper scripts
