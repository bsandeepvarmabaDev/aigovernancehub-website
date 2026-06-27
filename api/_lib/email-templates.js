/**
 * Premium SaaS email templates — v25.20 (presentation only; no logic changes).
 */
export function escapeHtmlEmail(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Stripe/Notion-inspired transactional layout — table-based for client compatibility.
 */
export function premiumEmailLayout(options) {
  const {
    preheader = "",
    headline,
    bodyHtml,
    primaryCta,
    secondaryCta,
    footerLines = [],
  } = options;

  const primaryBlock =
    primaryCta && primaryCta.href
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0"><tr><td style="border-radius:8px;background:#2563eb"><a href="${escapeHtmlEmail(primaryCta.href)}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${escapeHtmlEmail(primaryCta.label)}</a></td></tr></table>`
      : "";

  const secondaryBlock =
    secondaryCta && secondaryCta.href
      ? `<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.6;color:#475569"><a href="${escapeHtmlEmail(secondaryCta.href)}" style="color:#2563eb;text-decoration:none;font-weight:600">${escapeHtmlEmail(secondaryCta.label)}</a></p>`
      : "";

  const footerHtml = footerLines
    .map(
      (line) =>
        `<p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.5;color:#94a3b8">${line}</p>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlEmail(headline)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtmlEmail(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
        <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #f1f5f9">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#2563eb">AI Governance Hub</p>
        </td></tr>
        <tr><td style="padding:28px 32px">
          <h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:22px;font-weight:700;line-height:1.3;color:#0f172a">${escapeHtmlEmail(headline)}</h1>
          ${bodyHtml}
          ${primaryBlock}
          ${secondaryBlock}
        </td></tr>
        <tr><td style="padding:20px 32px 28px;background:#f8fafc;border-top:1px solid #f1f5f9">
          ${footerHtml}
          <p style="margin:12px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;color:#cbd5e1">© ${new Date().getFullYear()} AI Governance Hub</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function insightCardHtml(title, rows) {
  const rowsHtml = rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#475569"><strong style="color:#0f172a">${escapeHtmlEmail(r.label)}:</strong> ${escapeHtmlEmail(r.value)}</td></tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px"><tr><td style="padding:18px 20px">
    <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;color:#1e40af">${escapeHtmlEmail(title)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
  </td></tr></table>`;
}

export function paragraphHtml(text) {
  return `<p style="margin:0 0 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#334155">${text}</p>`;
}
