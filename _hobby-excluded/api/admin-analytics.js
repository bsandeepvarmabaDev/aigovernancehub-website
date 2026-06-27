// AI Governance Hub API — admin analytics v24.0
import { getAnalyticsSummary } from "./lib/analytics.js";
import { getPlatformAnalytics } from "./lib/platform-analytics.js";
import { isAdminAuthorized } from "./lib/correlation.js";
import { applySecurityHeaders, sendError, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendError(res, 405, "Method not allowed.");
  }

  if (!isAdminAuthorized(req)) {
    return sendError(res, 403, "Admin access denied.");
  }

  const days = Number(req.query?.days || 7);
  const bounded = Math.min(Math.max(days, 1), 30);
  const summary = await getAnalyticsSummary(bounded);
  const platform = await getPlatformAnalytics(bounded);

  return sendJson(res, 200, { summary, platform, version: "25.22", correlationId });
}
