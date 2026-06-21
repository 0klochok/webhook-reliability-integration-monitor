import { eventStatuses, type EventStatus } from "@webhook-monitor/core";
import type { DashboardEventListItem } from "@webhook-monitor/db";

import { formatDateTime, formatStatus } from "./formatters.js";
import { emptyState, escapeAttribute, escapeHtml, linkTo, tableCell } from "./html.js";
import { renderLayout } from "./layout.js";

const renderStatusFilter = (selectedStatus: EventStatus | undefined): string => `
  <form class="toolbar" method="get" action="/dashboard/events">
    <label>
      Status
      <select name="status">
        <option value="">All statuses</option>
        ${eventStatuses
          .map(
            (status) =>
              `<option value="${escapeAttribute(status)}"${
                selectedStatus === status ? " selected" : ""
              }>${escapeHtml(formatStatus(status))}</option>`
          )
          .join("")}
      </select>
    </label>
    <button type="submit">Filter events</button>
  </form>
`;

const renderRows = (events: ReadonlyArray<DashboardEventListItem>): string =>
  events
    .map(
      (event) => `<tr>
        <td>${linkTo(`/dashboard/events/${event.id}`, event.id)}</td>
        ${tableCell(event.providerId)}
        ${tableCell(event.externalEventId)}
        ${tableCell(event.eventType)}
        <td><span class="status">${escapeHtml(formatStatus(event.currentStatus))}</span></td>
        ${tableCell(formatDateTime(event.receivedAt))}
        ${tableCell(formatDateTime(event.lastSuccessfulAt))}
        ${tableCell(event.attemptCount)}
        ${tableCell(event.isDeadLettered ? "Yes" : "No")}
      </tr>`
    )
    .join("");

export const renderEventListView = (
  events: ReadonlyArray<DashboardEventListItem>,
  selectedStatus: EventStatus | undefined
): string =>
  renderLayout({
    title: "Events",
    body: `
      <h2>Recent Events</h2>
      ${renderStatusFilter(selectedStatus)}
      ${
        events.length === 0
          ? emptyState("No webhook events match the current filter.")
          : `<table>
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Provider</th>
                  <th>External event ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Received at</th>
                  <th>Last successful at</th>
                  <th>Attempts</th>
                  <th>Dead-letter</th>
                </tr>
              </thead>
              <tbody>${renderRows(events)}</tbody>
            </table>`
      }
    `
  });
