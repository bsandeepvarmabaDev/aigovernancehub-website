// AI Governance Hub API — analytics track v18.0
import { trackEvent } from "./lib/analytics.js";
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

  const rateLimited = await enforceRateLimit(req, "analytics-track");
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  const body = req.body || {};
  const event = typeof body.event === "string" ? body.event : "";
  const metadata = typeof body.metadata === "object" && body.metadata ? body.metadata : {};

  if (!event) {
    return sendError(res, 400, "Event name is required.");
  }

  await trackEvent(event, req, { ...metadata, correlationId });
  return sendJson(res, 200, { tracked: true });
}
