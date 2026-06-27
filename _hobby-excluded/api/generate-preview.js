// AI Governance Hub API — generate-preview v18.0
import { buildPreview } from "./lib/report-engine.js";
import { getKeySecret, validateSessionToken } from "./lib/tokens.js";
import { assertStorageConfigured, loadSessionRecord } from "./lib/storage.js";
import { applySecurityHeaders, sendError, sendJson } from "./lib/security.js";
import { trackEvent } from "./lib/analytics.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

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
    return sendError(res, 503, "Preview service is temporarily unavailable.");
  }

  const keySecret = getKeySecret();
  if (!keySecret) {
    return sendError(res, 503, "Preview service is not configured.");
  }

  const body = req.body || {};
  const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken : "";

  const tokenData = validateSessionToken(sessionToken, keySecret);
  if (!tokenData) {
    return sendError(res, 400, "Session is invalid or expired. Upload your file again.");
  }

  const session = await loadSessionRecord(tokenData.sessionId);
  if (!session || session.contentHash !== tokenData.contentHash) {
    return sendError(res, 404, "Upload session not found. Upload your file again.");
  }

  await trackEvent("preview_completed", req, { correlationId, sessionId: tokenData.sessionId });

  return sendJson(res, 200, {
    preview: buildPreview(session.analysis, session.validation),
    sessionId: tokenData.sessionId,
    plan: session.validation?.plan || session.planTier,
  });
}
