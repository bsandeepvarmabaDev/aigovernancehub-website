// AI Governance Hub API — enterprise sales contact (P0)
import { getKeySecret, validateSessionToken } from "./lib/tokens.js";
import { loadSessionRecord } from "./lib/storage.js";
import {
  loadSalesRequestBySession,
  updateSalesRequestContact,
  notifySalesTeam,
} from "./lib/enterprise-gate.js";
import { enforceRateLimit } from "./lib/rate-limit.js";
import { applySecurityHeaders, sendError, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

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

  await notifySalesTeam(record, getSiteUrl());

  return sendJson(res, 200, {
    success: true,
    secureReference: record.secureReference,
    message:
      "Thank you. Our sales team has been notified and will send you a secure payment link after assessment scoping.",
  });
}
