// AI Governance Hub API — enterprise sales contact (v25.23)
import { getKeySecret, validateSessionToken } from "./_lib/tokens.js";
import { loadSessionRecord } from "./_lib/storage.js";
import {
  loadSalesRequestBySession,
  updateSalesRequestContact,
  notifySalesTeam,
} from "./_lib/enterprise-gate.js";
import { isEmailConfigured } from "./_lib/email.js";
import { enforceRateLimit } from "./_lib/rate-limit.js";
import { applySecurityHeaders, sendError, sendJson } from "./_lib/security.js";
import { getCorrelationId, attachCorrelation } from "./_lib/correlation.js";

function getSiteUrl() {
  return (
    (typeof process.env.SITE_URL === "string" && process.env.SITE_URL.trim()) ||
    "https://aigovernancehub.ai"
  ).replace(/\/$/, "");
}

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  const rateLimited = await enforceRateLimit(req, "enterprise-sales-request");
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  const keySecret = getKeySecret();
  if (!keySecret) {
    return sendError(res, 503, "Service is not configured.");
  }

  const body = req.body || {};
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";

  if (!sessionId || !sessionToken) {
    return sendError(res, 400, "Upload session is required.");
  }

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, 400, "Valid name and email are required.");
  }

  const tokenData = validateSessionToken(sessionToken, keySecret);
  if (!tokenData || tokenData.sessionId !== sessionId) {
    return sendError(res, 400, "Upload session is invalid or expired.");
  }

  const session = await loadSessionRecord(sessionId);
  if (!session || session.contentHash !== tokenData.contentHash) {
    return sendError(res, 404, "Upload session not found.");
  }

  if (!session.enterpriseGate) {
    return sendError(res, 400, "This upload does not require enterprise assessment.");
  }

  const record = await updateSalesRequestContact(sessionId, { name, email, company }, keySecret);
  if (!record) {
    return sendError(res, 404, "Enterprise sales request not found.");
  }

  const emailResult = await notifySalesTeam(record, getSiteUrl());
  const emailConfigured = isEmailConfigured();

  const baseMessage = emailResult.sent
    ? "Thank you. Our sales team has been notified and will send you a secure payment link after assessment scoping."
    : `Thank you. Your enterprise request is recorded (Request ID: ${record.secureReference}). Sales email is not configured — our team will follow up using the contact details you provided within 1–2 business days. You can also email sales@aigovernancehub.ai and include your Request ID.`;

  return sendJson(res, 200, {
    success: true,
    secureReference: record.secureReference,
    emailConfigured,
    salesNotified: emailResult.sent,
    message: baseMessage,
    correlationId,
  });
}
