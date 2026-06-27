// AI Governance Hub API — management reports v25.0
import { getKeySecret } from "./lib/tokens.js";
import { requireAuth } from "./lib/auth.js";
import { loadWorkspace, ensureWorkspaceTasks } from "./lib/workspace-storage.js";
import { listReportIdsForEmail, loadReportRecord } from "./lib/storage.js";
import { snapshotFromLegacyReport } from "./lib/intelligence-snapshot.js";
import { taskStats, buildProjectHealth } from "./lib/workspace-core.js";
import { buildPortfolioIntelligence } from "./lib/portfolio-intelligence.js";
import { buildManagementReportHtml, buildManagementReportPdf } from "./lib/workspace-report.js";
import { applySecurityHeaders, sendError } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

const VALID_PERIODS = new Set(["weekly", "monthly", "quarterly"]);

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendError(res, 405, "Method not allowed.");
  }

  const session = await requireAuth(req);
  if (!session) return sendError(res, 401, "Sign in required.");

  const period = String(req.query?.period || "monthly").toLowerCase();
  const outFormat = String(req.query?.format || "html").toLowerCase();
  if (!VALID_PERIODS.has(period)) {
    return sendError(res, 400, "Period must be weekly, monthly, or quarterly.");
  }

  const keySecret = getKeySecret();
  const reports = [];
  const snapshots = [];
  for (const orderId of await listReportIdsForEmail(session.email, keySecret)) {
    const report = await loadReportRecord(orderId);
    if (!report || report.buyerEmail !== session.email || report.paymentStatus !== "verified") continue;
    reports.push(report);
    const snap = report.intelligenceSnapshot || snapshotFromLegacyReport(report);
    if (snap) snapshots.push(snap);
  }

  await ensureWorkspaceTasks(session.email, keySecret, snapshots);
  const workspace = await loadWorkspace(session.email, keySecret);
  const intelligence = buildPortfolioIntelligence(reports, { actionStats: taskStats(workspace.tasks) });
  const payload = {
    health: buildProjectHealth(workspace.tasks, intelligence),
    stats: taskStats(workspace.tasks),
    activity: workspace.activity,
  };

  if (outFormat === "pdf") {
    const pdf = await buildManagementReportPdf(period, payload);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="governance-${period}-report.pdf"`);
    return res.status(200).send(pdf);
  }

  const html = buildManagementReportHtml(period, payload);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="governance-${period}-report.html"`);
  return res.status(200).send(html);
}
