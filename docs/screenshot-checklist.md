# Screenshot Checklist

Use these screenshots for a portfolio README, project page, or case study. Capture after running the
demo sequence from the README.

| Screenshot                            | Purpose                              | Route or command                              | Expected visible evidence                                                               | Filename suggestion               |
| ------------------------------------- | ------------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------- |
| Dashboard summary after demo data     | Show business health view            | `http://localhost:3000/dashboard`             | Event volume, success rate, failed events, retries, dead letters, last successful event | `dashboard-summary.png`           |
| Recent events list                    | Show operational event visibility    | `http://localhost:3000/dashboard/events`      | Rows for delivered, rejected, retry, and dead-letter scenarios                          | `recent-events-list.png`          |
| Event detail with status history      | Show audit trail                     | `/dashboard/events/:eventId`                  | Event metadata, status history, payload preview                                         | `event-detail-status-history.png` |
| Delivery attempts after retry success | Show retry observability             | Retry-success event detail page               | Failed retryable attempt followed by succeeded attempt                                  | `retry-success-attempts.png`      |
| Dead-letter list                      | Show unrecoverable failures surfaced | `http://localhost:3000/dashboard/dead-letter` | Dead-lettered event, reason code, final attempt number                                  | `dead-letter-list.png`            |
| Manual replay audit/status            | Show operator recovery               | Manual replay event detail page               | Manual replay row plus successful replay attempt                                        | `manual-replay-audit.png`         |
| Simulator scenarios terminal          | Show repeatable demo automation      | Terminal running simulator commands           | Scenario names, API responses, dashboard URLs                                           | `simulator-terminal.png`          |
| Tests terminal                        | Show engineering quality gate        | `pnpm test -- --run`                          | Passing Vitest summary                                                                  | `tests-terminal.png`              |
| Architecture diagram                  | Show system flow                     | `README.md` or `docs/architecture.md`         | Mermaid diagram from provider to dashboard/replay                                       | `architecture-diagram.png`        |
| README local setup, optional          | Show clean-clone friendliness        | `README.md` local setup section               | PowerShell setup commands                                                               | `readme-local-setup.png`          |
| Health/readiness output, optional     | Show dependency checks               | `Invoke-RestMethod` health/ready commands     | `/healthz` and `/readyz` success JSON                                                   | `health-ready-output.png`         |

## Capture Order

1. Run the clean setup and demo sequence from `README.md`.
2. Capture the dashboard summary.
3. Capture the events list.
4. Open a delivered event and capture status history.
5. Open the retry-success event and capture delivery attempts.
6. Open the dead-letter page.
7. Run or show the manual replay scenario and capture the replay audit.
8. Capture the simulator terminal.
9. Run `pnpm test -- --run` and capture the passing result.
10. Capture the architecture diagram.

## Notes

- Do not show real credentials or private tokens.
- Keep terminal font large enough for portfolio viewers.
- Avoid exposing unrelated local paths or personal browser tabs where possible.
- Use fake/local values from `.env.example` only.
