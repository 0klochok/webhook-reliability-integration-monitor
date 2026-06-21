import type { DashboardEventDetail } from "@webhook-monitor/db";

import { formatDateTime, formatNullable, formatStatus } from "./formatters.js";
import { emptyState, escapeAttribute, escapeHtml, tableCell } from "./html.js";
import { renderLayout } from "./layout.js";

const detailRow = (label: string, value: string | number | null | undefined): string => `
  <tr>
    <th>${escapeHtml(label)}</th>
    <td>${escapeHtml(formatNullable(value))}</td>
  </tr>
`;

const replayForm = (eventId: string): string => `
  <form method="post" action="/dashboard/events/${escapeAttribute(eventId)}/replay">
    <button type="submit">Replay event</button>
  </form>
`;

const renderStatusHistory = (detail: DashboardEventDetail): string =>
  detail.statusHistory.length === 0
    ? emptyState("No status history exists for this event.")
    : `<table>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Reason</th>
            <th>Message</th>
            <th>Created at</th>
          </tr>
        </thead>
        <tbody>
          ${detail.statusHistory
            .map(
              (entry) => `<tr>
                ${tableCell(entry.fromStatus ? formatStatus(entry.fromStatus) : "None")}
                ${tableCell(formatStatus(entry.toStatus))}
                ${tableCell(formatNullable(entry.reasonCode))}
                ${tableCell(formatNullable(entry.message))}
                ${tableCell(formatDateTime(entry.createdAt))}
              </tr>`
            )
            .join("")}
        </tbody>
      </table>`;

const renderDeliveryAttempts = (detail: DashboardEventDetail): string =>
  detail.deliveryAttempts.length === 0
    ? emptyState("No delivery attempts exist for this event.")
    : `<table>
        <thead>
          <tr>
            <th>Attempt</th>
            <th>Status</th>
            <th>HTTP</th>
            <th>Error code</th>
            <th>Error message</th>
            <th>Duration ms</th>
            <th>Next retry at</th>
            <th>Started at</th>
            <th>Completed at</th>
          </tr>
        </thead>
        <tbody>
          ${detail.deliveryAttempts
            .map(
              (attempt) => `<tr>
                ${tableCell(attempt.attemptNumber)}
                ${tableCell(attempt.status)}
                ${tableCell(formatNullable(attempt.httpStatusCode))}
                ${tableCell(formatNullable(attempt.errorCode))}
                ${tableCell(formatNullable(attempt.errorMessage))}
                ${tableCell(formatNullable(attempt.durationMs))}
                ${tableCell(formatDateTime(attempt.nextRetryAt))}
                ${tableCell(formatDateTime(attempt.startedAt))}
                ${tableCell(formatDateTime(attempt.completedAt))}
              </tr>`
            )
            .join("")}
        </tbody>
      </table>`;

const renderDeadLetter = (detail: DashboardEventDetail): string =>
  detail.deadLetterEvent
    ? `<table>
        <tbody>
          ${detailRow("Reason code", detail.deadLetterEvent.reasonCode)}
          ${detailRow("Error message", detail.deadLetterEvent.errorMessage)}
          ${detailRow("Final attempt number", detail.deadLetterEvent.finalAttemptNumber)}
          ${detailRow("Dead-lettered at", formatDateTime(detail.deadLetterEvent.deadLetteredAt))}
        </tbody>
      </table>`
    : emptyState("This event is not on the dead-letter list.");

const renderManualReplays = (detail: DashboardEventDetail): string =>
  detail.manualReplays.length === 0
    ? emptyState("No manual replay audit records exist for this event.")
    : `<table>
        <thead>
          <tr>
            <th>Requested by</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Requested at</th>
            <th>Completed at</th>
          </tr>
        </thead>
        <tbody>
          ${detail.manualReplays
            .map(
              (replay) => `<tr>
                ${tableCell(replay.requestedBy)}
                ${tableCell(formatNullable(replay.reason))}
                ${tableCell(replay.status)}
                ${tableCell(formatDateTime(replay.requestedAt))}
                ${tableCell(formatDateTime(replay.completedAt))}
              </tr>`
            )
            .join("")}
        </tbody>
      </table>`;

export const renderEventDetailView = (
  detail: DashboardEventDetail,
  statusMessage?: string
): string =>
  renderLayout({
    title: "Event Detail",
    statusMessage,
    body: `
      <section class="panel">
        <h2>Event Detail</h2>
        <table>
          <tbody>
            ${detailRow("ID", detail.event.id)}
            ${detailRow("Provider", detail.event.providerId)}
            ${detailRow("External event ID", detail.event.externalEventId)}
            ${detailRow("Event type", detail.event.eventType)}
            ${detailRow("Current status", formatStatus(detail.event.currentStatus))}
            ${detailRow("Occurred at", formatDateTime(detail.event.occurredAt))}
            ${detailRow("Received at", formatDateTime(detail.event.receivedAt))}
            ${detailRow("Payload hash", detail.event.payloadHash)}
            ${detailRow("Idempotency key", detail.event.idempotencyKey)}
            ${detailRow("Schema version", detail.event.schemaVersion)}
            ${detailRow("Last successful at", formatDateTime(detail.event.lastSuccessfulAt))}
          </tbody>
        </table>
        ${
          detail.replayEligibility.replayable
            ? `<h3>Manual Replay</h3>${replayForm(detail.event.id)}`
            : `<p class="empty">Manual replay is not available for this status.</p>`
        }
      </section>
      <section class="panel">
        <h2>Status History</h2>
        ${renderStatusHistory(detail)}
      </section>
      <section class="panel">
        <h2>Delivery Attempts</h2>
        ${renderDeliveryAttempts(detail)}
      </section>
      <section class="panel">
        <h2>Dead-letter Record</h2>
        ${renderDeadLetter(detail)}
      </section>
      <section class="panel">
        <h2>Manual Replay Audit</h2>
        ${renderManualReplays(detail)}
      </section>
      <section class="panel">
        <h2>Payload Preview</h2>
        <details>
          <summary>Show trimmed payload preview</summary>
          <pre>${escapeHtml(detail.payloadPreview)}</pre>
        </details>
      </section>
    `
  });
