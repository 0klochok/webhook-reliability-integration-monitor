import { escapeHtml, linkTo } from "./html.js";

export interface RenderLayoutInput {
  readonly title: string;
  readonly body: string;
  readonly statusMessage?: string;
}

const styles = `
  :root {
    color-scheme: light;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f6f7f9;
    color: #1c2633;
  }
  body {
    margin: 0;
  }
  header {
    background: #102033;
    color: #ffffff;
    padding: 18px 28px;
  }
  header h1 {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 700;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  nav a {
    color: #dbeafe;
    text-decoration: none;
    font-weight: 600;
  }
  main {
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px;
  }
  .notice {
    border-left: 4px solid #2563eb;
    background: #eff6ff;
    padding: 12px 14px;
    margin-bottom: 20px;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
    margin: 18px 0 28px;
  }
  .metric,
  .panel {
    background: #ffffff;
    border: 1px solid #d7dde5;
    border-radius: 6px;
    padding: 16px;
  }
  .metric strong {
    display: block;
    margin-top: 8px;
    font-size: 24px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 12px;
    margin-bottom: 16px;
  }
  label {
    display: grid;
    gap: 4px;
    font-weight: 600;
  }
  select,
  button,
  .button {
    min-height: 36px;
    border-radius: 6px;
    border: 1px solid #aeb8c6;
    background: #ffffff;
    color: #1c2633;
    padding: 7px 10px;
    font: inherit;
  }
  button,
  .button {
    cursor: pointer;
    background: #174ea6;
    border-color: #174ea6;
    color: #ffffff;
    font-weight: 700;
    text-decoration: none;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: #ffffff;
    border: 1px solid #d7dde5;
  }
  th,
  td {
    border-bottom: 1px solid #e3e7ee;
    padding: 10px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: #edf1f6;
    font-size: 13px;
  }
  code,
  pre {
    font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
  }
  pre {
    white-space: pre-wrap;
    word-break: break-word;
    background: #0f172a;
    color: #e2e8f0;
    border-radius: 6px;
    padding: 14px;
    overflow: auto;
  }
  .status {
    display: inline-block;
    border-radius: 999px;
    background: #e7eef8;
    padding: 3px 8px;
    font-size: 12px;
    font-weight: 700;
  }
  .empty {
    color: #5d6b7c;
    font-style: italic;
  }
  .danger {
    color: #9f1239;
  }
`;

export const renderLayout = (input: RenderLayoutInput): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(input.title)} - Webhook Monitor</title>
    <style>${styles}</style>
  </head>
  <body>
    <header>
      <h1>Webhook Reliability Monitor</h1>
      <nav>
        ${linkTo("/dashboard", "Dashboard")}
        ${linkTo("/dashboard/events", "Events")}
        ${linkTo("/dashboard/dead-letter", "Dead Letter")}
        ${linkTo("/healthz", "Health")}
      </nav>
    </header>
    <main>
      ${input.statusMessage ? `<div class="notice">${escapeHtml(input.statusMessage)}</div>` : ""}
      ${input.body}
    </main>
  </body>
</html>`;

export const renderErrorPage = (statusCode: number, title: string, message: string): string =>
  renderLayout({
    title,
    body: `<section class="panel"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><p>${linkTo("/dashboard", "Back to dashboard")}</p></section>`
  });
