/**
 * AI Governance Hub v25.0 — Action tracker (delegates to workspace storage)
 */
import {
  taskStats,
  updateTask,
  exportTasksCsv,
  migrateLegacyItem,
} from "./workspace-core.js";
import { loadWorkspace, saveWorkspace, ensureWorkspaceTasks } from "./workspace-storage.js";

export { ensureWorkspaceTasks as ensureActionsFromSnapshots };
export const actionTrackerStats = taskStats;

export async function loadActionTracker(email, keySecret) {
  const ws = await loadWorkspace(email, keySecret);
  return {
    email: ws.email,
    items: ws.tasks.map((t) => ({
      ...t,
      recommendationTitle: t.title,
      targetDate: t.dueDate,
      status: t.status === "todo" ? "not_started" : t.status,
    })),
    updatedAt: ws.updatedAt,
  };
}

export async function saveActionTracker(email, keySecret, tracker) {
  const ws = await loadWorkspace(email, keySecret);
  ws.tasks = (tracker.items || tracker.tasks || []).map(migrateLegacyItem);
  await saveWorkspace(email, keySecret, ws);
  return tracker;
}

export function updateActionItem(tracker, id, patch) {
  const tasks = (tracker.items || []).map(migrateLegacyItem);
  const mapped = { ...patch };
  if (mapped.targetDate != null) mapped.dueDate = mapped.targetDate;
  const updated = updateTask(tasks, id, mapped);
  if (!updated) return null;
  tracker.items = tasks.map((t) => ({
    ...t,
    recommendationTitle: t.title,
    targetDate: t.dueDate,
    status: t.status === "todo" ? "not_started" : t.status,
  }));
  return tracker.items.find((i) => i.id === id);
}

export function exportActionsCsv(tracker) {
  return exportTasksCsv((tracker.items || []).map(migrateLegacyItem));
}
