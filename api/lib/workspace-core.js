/**
 * AI Governance Hub v25.0 — Governance workspace core (pure logic)
 */
import crypto from "crypto";

export const TASK_STATUSES = ["todo", "in_progress", "blocked", "completed"];
export const KANBAN_COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "completed", label: "Completed" },
];
export const VALID_PRIORITY = new Set(["Critical", "High", "Medium", "Low"]);

export function normalizeStatus(status) {
  if (status === "not_started") return "todo";
  if (TASK_STATUSES.includes(status)) return status;
  return "todo";
}

export function taskStats(tasks) {
  const items = tasks || [];
  const now = Date.now();
  let overdue = 0;
  items.forEach((t) => {
    if (t.status !== "completed" && t.dueDate && new Date(t.dueDate).getTime() < now) overdue += 1;
  });
  return {
    total: items.length,
    todo: items.filter((t) => normalizeStatus(t.status) === "todo").length,
    inProgress: items.filter((t) => normalizeStatus(t.status) === "in_progress").length,
    blocked: items.filter((t) => normalizeStatus(t.status) === "blocked").length,
    completed: items.filter((t) => normalizeStatus(t.status) === "completed").length,
    overdue,
    pending: items.filter((t) => normalizeStatus(t.status) !== "completed").length,
  };
}

export function migrateLegacyItem(item) {
  const status = normalizeStatus(item.status);
  return {
    id: item.id,
    orderId: item.orderId,
    assessmentLabel: item.assessmentLabel || "",
    title: item.title || item.recommendationTitle || "Untitled task",
    description: item.description || "",
    priority: VALID_PRIORITY.has(item.priority) ? item.priority : "Medium",
    owner: item.owner || "",
    department: item.department || "",
    dueDate: item.dueDate || item.targetDate || null,
    status,
    evidence: item.evidence || "",
    completionNotes: item.completionNotes || "",
    progress: typeof item.progress === "number" ? item.progress : status === "completed" ? 100 : 0,
    expectedImprovement: item.expectedImprovement ?? item.expectedGovernanceImprovement ?? null,
    comments: Array.isArray(item.comments) ? item.comments : [],
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

export function seedTasksFromSnapshots(existingTasks, snapshots) {
  const tasks = (existingTasks || []).map(migrateLegacyItem);
  const existing = new Set(tasks.map((t) => t.id));

  (snapshots || []).forEach((snap) => {
    const deptDefault = (snap.departmentAnalysis && snap.departmentAnalysis[0]?.name) || "Portfolio";
    (snap.recommendations || []).forEach((rec, idx) => {
      const id = hashTaskId(snap.orderId, rec.id || rec.title || String(idx));
      if (existing.has(id)) return;
      tasks.push({
        id,
        orderId: snap.orderId,
        assessmentLabel: snap.projectLabel || snap.filename || snap.orderId,
        title: rec.title,
        description: [rec.why, rec.businessBenefit].filter(Boolean).join("\n\n"),
        priority: rec.priority || "Medium",
        owner: "",
        department: deptDefault,
        dueDate: null,
        status: "todo",
        evidence: "",
        completionNotes: "",
        progress: 0,
        expectedImprovement: rec.estimatedImpact || rec.expectedGovernanceImprovement || null,
        comments: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      existing.add(id);
    });
  });
  return tasks;
}

export function hashTaskId(orderId, recKey) {
  return crypto.createHash("sha256").update(`${orderId}|${recKey}`).digest("hex").slice(0, 16);
}

export function updateTask(tasks, taskId, patch) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  if (patch.title != null) task.title = String(patch.title).slice(0, 200);
  if (patch.description != null) task.description = String(patch.description).slice(0, 4000);
  if (patch.owner != null) task.owner = String(patch.owner).slice(0, 120);
  if (patch.department != null) task.department = String(patch.department).slice(0, 120);
  if (patch.priority != null && VALID_PRIORITY.has(patch.priority)) task.priority = patch.priority;
  if (patch.dueDate != null) task.dueDate = patch.dueDate || null;
  if (patch.evidence != null) task.evidence = String(patch.evidence).slice(0, 2000);
  if (patch.completionNotes != null) task.completionNotes = String(patch.completionNotes).slice(0, 2000);
  if (patch.status != null && TASK_STATUSES.includes(normalizeStatus(patch.status))) {
    task.status = normalizeStatus(patch.status);
    if (task.status === "completed") task.progress = 100;
  }
  if (typeof patch.progress === "number") {
    task.progress = Math.max(0, Math.min(100, Math.round(patch.progress)));
    if (task.progress === 100) task.status = "completed";
    else if (task.progress > 0 && task.status === "todo") task.status = "in_progress";
  }
  task.updatedAt = new Date().toISOString();
  return task;
}

export function addComment(task, authorEmail, text) {
  const mentions = parseMentions(text);
  const comment = {
    id: crypto.randomUUID(),
    author: authorEmail,
    text: String(text).slice(0, 2000),
    mentions,
    createdAt: new Date().toISOString(),
  };
  task.comments = task.comments || [];
  task.comments.push(comment);
  task.updatedAt = new Date().toISOString();
  return comment;
}

export function addAttachmentMeta(task, name, note) {
  const att = {
    id: crypto.randomUUID(),
    name: String(name).slice(0, 120),
    note: String(note || "").slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  task.attachments = task.attachments || [];
  task.attachments.push(att);
  task.updatedAt = new Date().toISOString();
  return att;
}

function parseMentions(text) {
  const matches = String(text).match(/@[\w.+-]+@[\w.-]+\.\w+/g) || [];
  return [...new Set(matches.map((m) => m.slice(1)))];
}

export function appendActivity(workspace, entry) {
  workspace.activity = workspace.activity || [];
  workspace.activity.unshift({
    id: crypto.randomUUID(),
    ...entry,
    timestamp: new Date().toISOString(),
  });
  workspace.activity = workspace.activity.slice(0, 500);
}

export function groupKanban(tasks) {
  const groups = { todo: [], in_progress: [], blocked: [], completed: [] };
  (tasks || []).forEach((t) => {
    const s = normalizeStatus(t.status);
    groups[s].push(t);
  });
  return KANBAN_COLUMNS.map((col) => ({ ...col, tasks: groups[col.id] }));
}

export function buildProjectHealth(tasks, intelligence) {
  const stats = taskStats(tasks);
  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const trend = intelligence?.executiveDashboard?.trend || { direction: "stable", delta: 0 };
  let healthScore = completionRate;
  if (stats.overdue > 0) healthScore -= Math.min(20, stats.overdue * 5);
  if (trend.direction === "improving") healthScore += 5;
  if (trend.direction === "declining") healthScore -= 10;
  healthScore = Math.max(0, Math.min(100, healthScore));

  let healthLabel = "At Risk";
  if (healthScore >= 75) healthLabel = "Healthy";
  else if (healthScore >= 50) healthLabel = "Needs Attention";

  return {
    overallHealth: healthLabel,
    healthScore,
    completedRecommendations: stats.completed,
    pending: stats.pending,
    overdue: stats.overdue,
    governanceImprovement: trend.delta ?? 0,
    trendDirection: trend.direction,
    completionRatePercent: completionRate,
  };
}

export function buildScoreHistory(snapshots) {
  const sorted = [...(snapshots || [])].sort(
    (a, b) => new Date(a.assessedAt) - new Date(b.assessedAt)
  );
  return {
    timeline: sorted.map((s) => ({
      orderId: s.orderId,
      label: s.projectLabel,
      assessedAt: s.assessedAt,
      governanceScore: s.executiveSummary?.governanceScore,
      aiReadiness: s.executiveSummary?.aiReadiness,
    })),
    scoreTrend: sorted.map((s) => ({
      date: s.assessedAt,
      score: s.executiveSummary?.governanceScore,
    })),
    departmentProgress: mergeDepartmentTimeline(sorted),
  };
}

function mergeDepartmentTimeline(snapshots) {
  const latest = snapshots[snapshots.length - 1];
  if (!latest) return [];
  return (latest.departmentAnalysis || []).map((d) => ({
    name: d.name,
    score: d.score,
    workItems: d.workItems,
  }));
}

export function buildReAssessmentCompare(intelligence) {
  if (!intelligence || intelligence.empty) {
    return {
      available: false,
      message: "Run your first assessment to enable comparison.",
      runAssessmentUrl: "/pricing.html#assessment-wizard",
    };
  }
  const t = intelligence.trendAnalysis?.lastVsCurrent;
  return {
    available: Boolean(t?.last),
    runAssessmentUrl: "/pricing.html#assessment-wizard",
    previous: t?.last || null,
    current: t?.current || null,
    improvement: t?.trend || { direction: "stable", delta: 0, label: "Stable" },
  };
}

export function buildActionEffectiveness(tasks, snapshots) {
  const completed = (tasks || []).filter((t) => normalizeStatus(t.status) === "completed");
  const scoreDelta =
    snapshots?.length >= 2
      ? (snapshots[0].executiveSummary?.governanceScore ?? 0) -
        (snapshots[snapshots.length - 1].executiveSummary?.governanceScore ?? 0)
      : 0;
  const perTaskActual =
    completed.length > 0 ? Math.round((scoreDelta / completed.length) * 10) / 10 : 0;

  return completed.map((t) => {
    const expected = parseExpectedPoints(t.expectedImprovement);
    const actual = perTaskActual;
    return {
      taskId: t.id,
      title: t.title,
      completedAt: t.updatedAt,
      expectedImprovement: expected,
      actualImprovement: actual,
      variance: Math.round((actual - expected) * 10) / 10,
    };
  });
}

function parseExpectedPoints(value) {
  if (typeof value === "number") return value;
  if (!value) return 2;
  const m = String(value).match(/(\d+)/);
  return m ? Number(m[1]) : 2;
}

export function buildTimelineView(tasks) {
  return (tasks || [])
    .filter((t) => t.dueDate || t.createdAt)
    .map((t) => ({
      id: t.id,
      title: t.title,
      start: t.createdAt,
      end: t.dueDate || t.updatedAt,
      status: normalizeStatus(t.status),
      priority: t.priority,
    }))
    .sort((a, b) => new Date(a.end || a.start) - new Date(b.end || b.start));
}

export function buildCalendarView(tasks) {
  const map = {};
  (tasks || []).forEach((t) => {
    const key = t.dueDate ? t.dueDate.slice(0, 10) : null;
    if (!key) return;
    if (!map[key]) map[key] = [];
    map[key].push({ id: t.id, title: t.title, status: normalizeStatus(t.status), priority: t.priority });
  });
  return map;
}

export function exportTasksCsv(tasks) {
  const header =
    "ID,Title,Description,Priority,Owner,Department,Due Date,Status,Evidence,Completion Notes,Progress,Assessment";
  const rows = (tasks || []).map((t) =>
    [
      t.id,
      csvEsc(t.title),
      csvEsc(t.description),
      t.priority,
      csvEsc(t.owner),
      csvEsc(t.department),
      t.dueDate || "",
      normalizeStatus(t.status),
      csvEsc(t.evidence),
      csvEsc(t.completionNotes),
      String(t.progress),
      csvEsc(t.assessmentLabel),
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export function exportTasksJson(workspace, intelligence, health) {
  return JSON.stringify(
    {
      version: "25.0",
      exportedAt: new Date().toISOString(),
      tasks: workspace.tasks,
      stats: taskStats(workspace.tasks),
      health,
      intelligenceSummary: intelligence?.empty
        ? null
        : {
            assessmentCount: intelligence.assessmentCount,
            portfolioScore: intelligence.executiveDashboard?.portfolioScore,
          },
    },
    null,
    2
  );
}

function csvEsc(value) {
  const s = String(value || "").replace(/\r?\n/g, " ");
  if (/[",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Backward compat for v24 action tracker
export const actionTrackerStats = taskStats;
export function updateActionItem(tracker, id, patch) {
  const tasks = tracker.items || tracker.tasks || [];
  const updated = updateTask(tasks, id, patch);
  if (updated && tracker.items) tracker.items = tasks.map(migrateLegacyItem);
  if (updated && tracker.tasks) tracker.tasks = tasks;
  return updated ? migrateLegacyItem(updated) : null;
}
export function exportActionsCsv(tracker) {
  return exportTasksCsv((tracker.items || tracker.tasks || []).map(migrateLegacyItem));
}
export function seedActionItems(existing, snapshots) {
  return { items: seedTasksFromSnapshots(existing, snapshots).map((t) => ({
    ...t,
    recommendationTitle: t.title,
    targetDate: t.dueDate,
    status: t.status === "todo" ? "not_started" : t.status,
  })) };
}
export function hashActionId(orderId, recKey) {
  return hashTaskId(orderId, recKey);
}
