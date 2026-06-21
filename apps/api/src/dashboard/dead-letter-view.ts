import type { DashboardDeadLetterListItem } from "@webhook-monitor/db";

import { formatDateTime, formatNullable, formatStatus } from "./formatters.js";
import { emptyState, escapeAttribute, linkTo, tableCell } from "./html.js";
import { renderLayout } from "./layout.js";

const replayForm = (eventId: string): string => `
  <form method="post" action="/dashboard/events/${escapeAttribute(eventId)}/replay">
    <button type="submit">Replay event</button>
  </form>
`;

const renderRows = (events: ReadonlyArray<DashboardDeadLetterListItem>): string =>
  events
    .map(
      (event) => `<tr>
        <td>${linkTo(`/dashboard/events/${event.eventId}`, event.eventId)}</td>
        ${tableCell(event.providerId)}
        ${tableCell(event.externalEventId)}
        ${tableCell(event.eventType)}
        ${tableCell(formatStatus(event.currentStatus))}
        ${tableCell(event.reasonCode)}
        ${tableCell(formatNullable(event.errorMessage))}
        ${tableCell(formatNullable(event.finalAttemptNumber))}
        ${tableCell(formatDateTime(event.deadLetteredAt))}
        <td>${event.isReplayable ? replayForm(event.eventId) : "Not available"}</td>
      </tr>`
    )
    .join("");

export const renderDeadLetterView = (events: ReadonlyArray<DashboardDeadLetterListItem>): string =>
  renderLayout({
    title: "Dead Letter",
    body: `
      <h2>Dead-letter Events</h2>
      ${
        events.length === 0
          ? emptyState("No dead-letter records exist.")
          : `<table>
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Provider</th>
                  <th>External event ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Error</th>
                  <th>Final attempt</th>
                  <th>Dead-lettered at</th>
                  <th>Replay</th>
                </tr>
              </thead>
              <tbody>${renderRows(events)}</tbody>
            </table>`
      }
    `
  });
