// AI Governance Hub API — workspace export v25.0
import { getKeySecret } from "./lib/tokens.js";
import { requireAuth } from "./lib/auth.js";
import { loadWorkspace, ensureWorkspaceTasks } from "./lib/workspace-storage.js";
import { listReportIdsForEmail, loadReportRecord } from "./lib/storage.js";
import { snapshotFromLegacyReport } from "./lib/intelligence-snapshot.js";
import { exportTasksCsv, exportTasksJson, taskStats } from "./lib/workspace-core.js";
import { buildProjectHealth } from "./lib/workspace-core.js";
import { buildPortfolioIntelligence } from "./lib/portfolio-intelligence.js";
import { buildExcelCsv, buildManagementReportHtml, buildManagementReportPdf, buildWorkspacePptx } from "./lib/workspace-report.js";
import { applySecurityHeaders, sendError } from "./lib/security.js";
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
  if (!session) return sendError(res, 401, "Sign in required.");

  const keySecret = getKeySecret();
  const format = String(req.query?.format || "csv").toLowerCase();

  const orderIds = await listReportIdsForEmail(session.email, keySecret);
  const snapshots = [];
  const reports = [];
  for (const orderId of orderIds) {
    const report = await loadReportRecord(orderId);
    if (!report || report.buyerEmail !== session.email || report.paymentStatus !== "verified") continue;
    reports.push(report);
    const snap = report.intelligenceSnapshot || snapshotFromLegacyReport(report);
    if (snap) snapshots.push(snap);
  }

  await ensureWorkspaceTasks(session.email, keySecret, snapshots);
  const workspace = await loadWorkspace(session.email, keySecret);
  const intelligence = buildPortfolioIntelligence(reports, { actionStats: taskStats(workspace.tasks) });
  const health = buildProjectHealth(workspace.tasks, intelligence);

  if (format === "json") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="governance-workspace.json"');
    return res.status(200).send(exportTasksJson(workspace, intelligence, health));
  }

  if (format === "xlsx" || format === "excel") {
    res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="governance-workspace.xls"');
    return res.status(200).send(buildExcelCsv(workspace.tasks));
  }

  if (format === "pptx" || format === "powerpoint") {
    const pptx = await buildWorkspacePptx({ health, stats: taskStats(workspace.tasks), activity: workspace.activity });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", 'attachment; filename="governance-workspace.pptx"');
    return res.status(200).send(pptx);
  }

  if (format === "pdf") {
    const pdf = await buildManagementReportPdf("export", {
      health,
      stats: taskStats(workspace.tasks),
      activity: workspace.activity,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="governance-workspace.pdf"');
    return res.status(200).send(pdf);
  }

  if (format === "html") {
    const html = buildManagementReportHtml("export", {
      health,
      stats: taskStats(workspace.tasks),
      activity: workspace.activity,
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="governance-workspace.html"');
    return res.status(200).send(html);
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="governance-workspace.csv"');
  return res.status(200).send(exportTasksCsv(workspace.tasks));
}
