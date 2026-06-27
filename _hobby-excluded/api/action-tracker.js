// AI Governance Hub API — action tracker v24.0
import { getKeySecret } from "./lib/tokens.js";
import { requireAuth } from "./lib/auth.js";
import {
  loadActionTracker,
  saveActionTracker,
  updateActionItem,
  exportActionsCsv,
  actionTrackerStats,
} from "./lib/action-tracker.js";
import { enforceRateLimit } from "./lib/rate-limit.js";
import { applySecurityHeaders, sendError, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  const session = await requireAuth(req);
  if (!session) {
    return sendError(res, 401, "Sign in required.");
  }

  const keySecret = getKeySecret();

  if (req.method === "GET") {
    const exportCsv = req.query?.export === "csv";
    const tracker = await loadActionTracker(session.email, keySecret);
    if (exportCsv) {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="ai-governance-actions.csv"');
      return res.status(200).send(exportActionsCsv(tracker));
    }
    return sendJson(res, 200, {
      stats: actionTrackerStats(tracker),
      items: tracker.items,
    });
  }

  if (req.method === "PATCH" || req.method === "POST") {
    const rateLimited = await enforceRateLimit(req, "action-tracker");
    if (rateLimited) {
      return sendError(res, rateLimited.status, rateLimited.error);
    }

    const body = req.body || {};
    const actionIdValue = typeof body.id === "string" ? body.id.trim() : "";
    if (!actionIdValue) {
      return sendError(res, 400, "Action ID is required.");
    }

    const tracker = await loadActionTracker(session.email, keySecret);
    const updated = updateActionItem(tracker, actionIdValue, body);
    if (!updated) {
      return sendError(res, 404, "Action item not found.");
    }

    await saveActionTracker(session.email, keySecret, tracker);
    return sendJson(res, 200, { success: true, item: updated, stats: actionTrackerStats(tracker) });
  }

  res.setHeader("Allow", "GET, PATCH, POST");
  return sendError(res, 405, "Method not allowed.");
}
