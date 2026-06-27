// AI Governance Hub API — enterprise request status (customer)
import { getKeySecret, validateSessionToken } from "./lib/tokens.js";
import { loadSessionRecord } from "./lib/storage.js";
import {
  loadSalesRequestBySession,
  publicEnterpriseStatus,
} from "./lib/enterprise-gate.js";
import { applySecurityHeaders, sendError, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

export default async function handler(req, res) {
  attachCorrelation(res, getCorrelationId(req));
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  const body = req.body || {};
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken : "";

  if (!sessionId || !sessionToken) {
    return sendError(res, 400, "Session required.");
  }

  const tokenData = validateSessionToken(sessionToken, getKeySecret());
  if (!tokenData || tokenData.sessionId !== sessionId) {
    return sendError(res, 400, "Session invalid or expired.");
  }

  const session = await loadSessionRecord(sessionId);
  if (!session || session.contentHash !== tokenData.contentHash) {
    return sendError(res, 404, "Session not found.");
  }

  if (!session.enterpriseGate) {
    return sendJson(res, 200, { enterpriseGate: false });
  }

  const record = await loadSalesRequestBySession(sessionId);
  return sendJson(res, 200, {
    enterpriseGate: true,
    request: publicEnterpriseStatus(record),
    salesEmail: "sales@aigovernancehub.ai",
    message:
      "Our sales team will review your assessment and send a secure payment link. Typical response within 1–2 business days.",
  });
}
