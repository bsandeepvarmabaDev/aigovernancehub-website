// AI Governance Hub API — download-report v22.0
import {
  getDownloadSigningSecret,
  validateDownloadToken,
} from "./_lib/tokens.js";
import { isDownloadReady, PAYMENT_STATE } from "./_lib/payment-state.js";
import {
  assertStorageConfigured,
  incrementDownloadCount,
  loadReportHtml,
  loadReportRecord,
  loadReportText,
  loadReportPdf,
  loadReportDocx,
  loadReportPptx,
} from "./_lib/storage.js";
import { enforceRateLimit, getClientIp, hashIp } from "./_lib/rate-limit.js";
import { AUDIT_EVENTS, logAudit } from "./_lib/audit.js";
import { trackEvent } from "./_lib/analytics.js";
import { applySecurityHeaders, sendError } from "./_lib/security.js";
import { getCorrelationId, attachCorrelation } from "./_lib/correlation.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  try {
    assertStorageConfigured();
  } catch {
    return sendError(res, 503, "Download service is temporarily unavailable.");
  }

  const keySecret = getDownloadSigningSecret();
  if (!keySecret) {
    return sendError(res, 503, "Download service is not configured.");
  }

  const body = req.body || {};
  const token =
    typeof body.confirmationToken === "string"
      ? body.confirmationToken
      : typeof body.downloadToken === "string"
        ? body.downloadToken
        : typeof body.recoveryToken === "string"
          ? body.recoveryToken
          : "";
  const formatRaw = typeof body.format === "string" ? body.format.toLowerCase() : "html";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  const rateLimited = await enforceRateLimit(req, "download-report", email);
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  const tokenData = validateDownloadToken(token, keySecret, email || undefined);
  if (!tokenData) {
    return sendError(res, 403, "Download not authorized. Token is invalid or expired.");
  }

  const report = await loadReportRecord(tokenData.orderId);
  if (!report || !isDownloadReady(report)) {
    if (report?.reportStatus === "generating") {
      return sendError(res, 409, "Report is still being prepared. Please try again in a few minutes.");
    }
    if (report?.paymentState === PAYMENT_STATE.REFUNDED) {
      return sendError(res, 410, "This report is no longer available.");
    }
    return sendError(res, 404, "Report is not available.");
  }

  const allowedFormats = report.availableFormats || ["html", "text"];
  const format = allowedFormats.includes(formatRaw) ? formatRaw : "html";

  if (report.paymentId !== tokenData.paymentId) {
    return sendError(res, 403, "Download not authorized.");
  }

  if (report.downloadDisabled) {
    return sendError(res, 403, "Download has been disabled for this report.");
  }

  if (tokenData.tokenType === "recovery" && email && report.buyerEmail !== email) {
    return sendError(res, 403, "Download not authorized.");
  }

  const expiresAt = report.expiresAt ? Date.parse(report.expiresAt) : null;
  if (expiresAt && Date.now() > expiresAt) {
    return sendError(res, 410, "Report has expired. Contact support@aigovernancehub.ai.");
  }

  let content;
  let contentType;
  let filename;

  const baseName = `ai-governance-executive-report-${String(tokenData.orderId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "report"}`;

  switch (format) {
    case "text":
      content = await loadReportText(tokenData.orderId);
      contentType = "text/plain; charset=utf-8";
      filename = `${baseName}.txt`;
      break;
    case "pdf": {
      const pdfBuf = await loadReportPdf(tokenData.orderId);
      if (!pdfBuf) return sendError(res, 404, "PDF format is not available for this report.");
      content = pdfBuf;
      contentType = "application/pdf";
      filename = `${baseName}.pdf`;
      break;
    }
    case "docx": {
      const docxBuf = await loadReportDocx(tokenData.orderId);
      if (!docxBuf) return sendError(res, 404, "DOCX format is not available for this report.");
      content = docxBuf;
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      filename = `${baseName}.docx`;
      break;
    }
    case "pptx": {
      const pptxBuf = await loadReportPptx(tokenData.orderId);
      if (!pptxBuf) return sendError(res, 404, "PowerPoint format is not available for this report.");
      content = pptxBuf;
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      filename = `${baseName}.pptx`;
      break;
    }
    default:
      content = await loadReportHtml(tokenData.orderId);
      contentType = "text/html; charset=utf-8";
      filename = `${baseName}.html`;
  }

  if (!content) {
    return sendError(res, 404, "Report content could not be retrieved.");
  }

  const ipHash = hashIp(getClientIp(req), keySecret);
  await incrementDownloadCount(tokenData.orderId, ipHash);
  await logAudit(tokenData.orderId, AUDIT_EVENTS.REPORT_DOWNLOADED, {
    format,
    ipHash,
    tokenType: tokenData.tokenType || "success",
    correlationId: report.correlationId || correlationId,
  });
  await trackEvent("report_downloaded", req, { correlationId, format });

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).send(content);
}
