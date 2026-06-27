// AI Governance Hub API — portfolio intelligence v24.0
import { getKeySecret } from "./lib/tokens.js";
import { listReportIdsForEmail, loadReportRecord, maskOrderId } from "./lib/storage.js";
import { requireAuth } from "./lib/auth.js";
import { buildPortfolioIntelligence } from "./lib/portfolio-intelligence.js";
import {
  ensureActionsFromSnapshots,
  loadActionTracker,
  actionTrackerStats,
} from "./lib/action-tracker.js";
import { snapshotFromLegacyReport } from "./lib/intelligence-snapshot.js";
import { cacheGet, cacheSet, cacheKey } from "./lib/cache.js";
import { trackEvent } from "./lib/analytics.js";
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

  const session = await requireAuth(req);
  if (!session) {
    return sendError(res, 401, "Sign in required.");
  }

  const keySecret = getKeySecret();
  const ck = cacheKey("portfolio", session.email);
  const cached = cacheGet(ck);
  if (cached) {
    res.setHeader("Cache-Control", "private, max-age=60");
    return sendJson(res, 200, cached);
  }

  const orderIds = await listReportIdsForEmail(session.email, keySecret);
  const reports = [];
  for (const orderId of orderIds) {
    const report = await loadReportRecord(orderId);
    if (!report || report.buyerEmail !== session.email || report.paymentStatus !== "verified") continue;
    reports.push(report);
  }

  const snapshots = reports
    .map((r) => r.intelligenceSnapshot || snapshotFromLegacyReport(r))
    .filter(Boolean);

  await ensureActionsFromSnapshots(session.email, keySecret, snapshots);
  const tracker = await loadActionTracker(session.email, keySecret);
  const actionStats = actionTrackerStats(tracker);

  const intelligence = buildPortfolioIntelligence(reports, { actionStats });
  const payload = {
    email: session.email,
    intelligence,
    actionTracker: {
      stats: actionStats,
      items: tracker.items.slice(0, 100),
    },
  };

  await trackEvent("portfolio_viewed", req, { correlationId });
  cacheSet(ck, payload, 60_000);
  res.setHeader("Cache-Control", "private, max-age=60");
  return sendJson(res, 200, payload);
}
