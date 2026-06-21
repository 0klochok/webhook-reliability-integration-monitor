export const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });

export const escapeAttribute = escapeHtml;

export const linkTo = (href: string, label: string): string =>
  `<a href="${escapeAttribute(href)}">${escapeHtml(label)}</a>`;

export const tableCell = (value: unknown): string => `<td>${escapeHtml(value)}</td>`;

export const emptyState = (message: string): string =>
  `<p class="empty">${escapeHtml(message)}</p>`;
