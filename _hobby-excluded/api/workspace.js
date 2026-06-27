// AI Governance Hub API — governance workspace v25.0
import { getKeySecret } from "./lib/tokens.js";
import { listReportIdsForEmail, loadReportRecord } from "./lib/storage.js";
import { requireAuth } from "./lib/auth.js";
import { buildPortfolioIntelligence } from "./lib/portfolio-intelligence.js";
import { snapshotFromLegacyReport } from "./lib/intelligence-snapshot.js";
import { loadWorkspace, saveWorkspace, ensureWorkspaceTasks } from "./lib/workspace-storage.js";
import {
  taskStats,
  updateTask,
  addComment,
  addAttachmentMeta,
  appendActivity,
  groupKanban,
  buildProjectHealth,
  buildScoreHistory,
  buildReAssessmentCompare,
  buildActionEffectiveness,
  buildTimelineView,
  buildCalendarView,
} from "./lib/workspace-core.js";
import { enforceRateLimit } from "./lib/rate-limit.js";
import { trackEvent } from "./lib/analytics.js";
import { applySecurityHeaders, sendError, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

async function loadContext(email, keySecret) {
  const orderIds = await listReportIdsForEmail(email, keySecret);
  const reports = [];
  for (const orderId of orderIds) {
    const report = await loadReportRecord(orderId);
    if (!report || report.buyerEmail !== email || report.paymentStatus !== "verified") continue;
    reports.push(report);
  }
  const snapshots = reports
    .map((r) => r.intelligenceSnapshot || snapshotFromLegacyReport(r))
    .filter(Boolean)
    .sort((a, b) => new Date(b.assessedAt) - new Date(a.assessedAt));
  return { reports, snapshots };
}

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  const session = await requireAuth(req);
  if (!session) {
    return sendError(res, 401, "Sign in required.");
  }

  const keySecret = getKeySecret();
  const { reports, snapshots } = await loadContext(session.email, keySecret);
  await ensureWorkspaceTasks(session.email, keySecret, snapshots);
  const workspace = await loadWorkspace(session.email, keySecret);
  const stats = taskStats(workspace.tasks);
  const intelligence = buildPortfolioIntelligence(reports, { actionStats: stats });
  const health = buildProjectHealth(workspace.tasks, intelligence);

  if (req.method === "GET") {
    await trackEvent("workspace_viewed", req, { correlationId });
    res.setHeader("Cache-Control", "private, max-age=30");
    return sendJson(res, 200, {
      version: "25.0",
      email: session.email,
      tasks: workspace.tasks,
      stats,
      kanban: groupKanban(workspace.tasks),
      health,
      scoreHistory: buildScoreHistory(snapshots),
      reAssessment: buildReAssessmentCompare(intelligence),
      effectiveness: buildActionEffectiveness(workspace.tasks, snapshots),
      timeline: buildTimelineView(workspace.tasks),
      calendar: buildCalendarView(workspace.tasks),
      activity: (workspace.activity || []).slice(0, 50),
      intelligence: intelligence.empty ? null : { assessmentCount: intelligence.assessmentCount },
    });
  }

  if (req.method === "PATCH" || req.method === "POST") {
    const rateLimited = await enforceRateLimit(req, "workspace");
    if (rateLimited) {
      return sendError(res, rateLimited.status, rateLimited.error);
    }

    const body = req.body || {};
    const action = body.action || "update_task";

    if (action === "comment") {
      const taskId = typeof body.taskId === "string" ? body.taskId.trim() : "";
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!taskId || !text) return sendError(res, 400, "Task ID and comment text are required.");
      const task = workspace.tasks.find((t) => t.id === taskId);
      if (!task) return sendError(res, 404, "Task not found.");
      const comment = addComment(task, session.email, text);
      appendActivity(workspace, {
        type: "comment",
        taskId,
        message: `Comment on "${task.title}"`,
        actor: session.email,
      });
      await saveWorkspace(session.email, keySecret, workspace);
      return sendJson(res, 200, { success: true, comment, stats: taskStats(workspace.tasks) });
    }

    if (action === "attachment") {
      const taskId = typeof body.taskId === "string" ? body.taskId.trim() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "Reference";
      const note = typeof body.note === "string" ? body.note.trim() : "";
      if (!taskId) return sendError(res, 400, "Task ID is required.");
      const task = workspace.tasks.find((t) => t.id === taskId);
      if (!task) return sendError(res, 404, "Task not found.");
      const att = addAttachmentMeta(task, name, note);
      appendActivity(workspace, {
        type: "attachment",
        taskId,
        message: `Attachment note added to "${task.title}"`,
        actor: session.email,
      });
      await saveWorkspace(session.email, keySecret, workspace);
      return sendJson(res, 200, { success: true, attachment: att });
    }

    const taskId = typeof body.id === "string" ? body.id.trim() : typeof body.taskId === "string" ? body.taskId.trim() : "";
    if (!taskId) return sendError(res, 400, "Task ID is required.");

    const updated = updateTask(workspace.tasks, taskId, body);
    if (!updated) return sendError(res, 404, "Task not found.");

    appendActivity(workspace, {
      type: "task_update",
      taskId,
      message: `Updated task "${updated.title}" → ${updated.status}`,
      actor: session.email,
    });
    await saveWorkspace(session.email, keySecret, workspace);
    await trackEvent("workspace_task_updated", req, { correlationId, taskId });
    return sendJson(res, 200, {
      success: true,
      task: updated,
      stats: taskStats(workspace.tasks),
      kanban: groupKanban(workspace.tasks),
      health: buildProjectHealth(workspace.tasks, intelligence),
    });
  }

  res.setHeader("Allow", "GET, PATCH, POST");
  return sendError(res, 405, "Method not allowed.");
}
