// AI Governance Hub API — admin search v18.0
import {
  adminSearch,
  loadAuditEvents,
  loadReportRecord,
  loadSessionRecord,
  maskOrderId,
  maskPaymentId,
} from "./lib/storage.js";
import { isAdminAuthorized } from "./lib/correlation.js";
import { enforceRateLimit } from "./lib/rate-limit.js";
import { applySecurityHeaders, sendError, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  if (!isAdminAuthorized(req)) {
    return sendError(res, 403, "Admin access denied.");
  }

  const rateLimited = await enforceRateLimit(req, "admin-search");
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  const body = req.body || {};
  const query = typeof body.query === "string" ? body.query.trim() : "";

  if (!query) {
    return sendError(res, 400, "Search query is required.");
  }

  const results = await adminSearch(query);
  const enriched = [];

  for (const item of results) {
    if (item.type === "session") {
      enriched.push(item);
      continue;
    }
    const audit = await loadAuditEvents(item.orderId);
    const session = item.sessionId ? await loadSessionRecord(item.sessionId) : null;
    enriched.push({
      orderId: item.orderId,
      orderRef: maskOrderId(item.orderId),
      paymentRef: maskPaymentId(item.paymentId),
      buyerName: item.buyerName,
      buyerEmail: item.buyerEmail,
      paymentStatus: item.paymentStatus,
      emailSent: item.emailSent,
      emailError: item.emailError,
      downloadCount: item.downloadCount,
      downloadDisabled: Boolean(item.downloadDisabled),
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      preview: item.preview || session?.preview,
      sessionId: item.sessionId,
      auditEvents: audit.slice(-20),
    });
  }

  return sendJson(res, 200, { query, results: enriched, correlationId });
}
