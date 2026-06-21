import type { DashboardSummary } from "@webhook-monitor/db";

import { formatDateTime, formatSuccessRate } from "./formatters.js";
import { escapeHtml, linkTo } from "./html.js";
import { renderLayout } from "./layout.js";

const metric = (label: string, value: string | number): string =>
  `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;

export const renderSummaryView = (summary: DashboardSummary): string =>
  renderLayout({
    title: "Dashboard",
    body: `
      <section>
        <h2>Integration Health</h2>
        <div class="metrics">
          ${metric("Total event volume", summary.totalEventVolume)}
          ${metric("Success rate", formatSuccessRate(summary.successRate))}
          ${metric("Failed events", summary.failedEvents)}
          ${metric("Retry count", summary.retryCount)}
          ${metric("Dead-letter count", summary.deadLetterCount)}
          ${metric("Last successful event", formatDateTime(summary.lastSuccessfulEvent?.lastSuccessfulAt))}
        </div>
      </section>
      <section class="panel">
        <h2>Operator Views</h2>
        <p>${linkTo("/dashboard/events", "Recent events")}</p>
        <p>${linkTo("/dashboard/dead-letter", "Dead-letter list")}</p>
      </section>
    `
  });
