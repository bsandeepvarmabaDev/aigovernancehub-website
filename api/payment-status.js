// AI Governance Hub API — payment status (canonical record lookup) v25.24
import { isNonEmptyString } from "./_lib/tokens.js";
import {
  assertStorageConfigured,
  loadReportRecord,
} from "./_lib/storage.js";
import { enforceRateLimit } from "./_lib/rate-limit.js";
import { buildCustomerStatusView } from "./_lib/payment-state.js";
import { applySecurityHeaders, sendError, sendJson } from "./_lib/security.js";
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
    return sendError(res, 503, "Payment status is temporarily unavailable.");
  }

  const body = req.body || {};
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";

  if (!isNonEmptyString(orderId) || !isNonEmptyString(paymentId)) {
    return sendError(res, 400, "Order and payment references are required.");
  }

  const rateLimited = await enforceRateLimit(req, "payment-status", orderId);
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  const report = await loadReportRecord(orderId);
  if (!report) {
    return sendJson(res, 200, {
      found: false,
      verified: false,
      customerPaymentState: null,
      reportStatus: "pending",
      statusLabel: "Pending verification",
      message: "Payment captured. Server verification is still in progress.",
      downloadReady: false,
    });
  }

  if (report.paymentId && report.paymentId !== paymentId) {
    return sendError(res, 403, "Payment reference does not match this order.");
  }

  return sendJson(res, 200, {
    found: true,
    verified: report.paymentStatus === "verified",
    orderId: report.orderId,
    ...buildCustomerStatusView(report),
  });
}
