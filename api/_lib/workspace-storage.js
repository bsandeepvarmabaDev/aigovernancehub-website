/**
 * AI Governance Hub v25.0 — Workspace persistence
 */
import crypto from "crypto";
import { getJson, putJson } from "./storage.js";
import {
  seedTasksFromSnapshots,
  migrateLegacyItem,
  appendActivity,
} from "./workspace-core.js";

function emailHash(email, keySecret) {
  return crypto.createHmac("sha256", keySecret).update(String(email).toLowerCase().trim()).digest("hex");
}

function workspaceKey(email, keySecret) {
  return `workspace/${emailHash(email, keySecret)}.json`;
}

function legacyActionsKey(email, keySecret) {
  return `indexes/actions/${emailHash(email, keySecret)}.json`;
}

export async function loadWorkspace(email, keySecret) {
  let data = await getJson(workspaceKey(email, keySecret));
  if (!data) {
    const legacy = await getJson(legacyActionsKey(email, keySecret));
    if (legacy?.items?.length) {
      data = {
        version: "25.0",
        email: email.toLowerCase().trim(),
        tasks: legacy.items.map(migrateLegacyItem),
        activity: [],
        updatedAt: legacy.updatedAt,
      };
    }
  }
  if (!data) {
    data = {
      version: "25.0",
      email: email.toLowerCase().trim(),
      tasks: [],
      activity: [],
      updatedAt: null,
    };
  }
  data.tasks = (data.tasks || []).map(migrateLegacyItem);
  return data;
}

export async function saveWorkspace(email, keySecret, workspace) {
  workspace.updatedAt = new Date().toISOString();
  await putJson(workspaceKey(email, keySecret), workspace);
  return workspace;
}

export async function ensureWorkspaceTasks(email, keySecret, snapshots) {
  const workspace = await loadWorkspace(email, keySecret);
  const before = workspace.tasks.length;
  workspace.tasks = seedTasksFromSnapshots(workspace.tasks, snapshots);
  if (workspace.tasks.length > before) {
    appendActivity(workspace, {
      type: "tasks_seeded",
      message: `${workspace.tasks.length - before} new task(s) from assessment recommendations`,
      actor: "system",
    });
    await saveWorkspace(email, keySecret, workspace);
  }
  return workspace;
}
