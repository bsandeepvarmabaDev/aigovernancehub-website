#!/usr/bin/env node
/**
 * v25.0 Governance Workspace — automated tests
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  seedTasksFromSnapshots,
  updateTask,
  addComment,
  groupKanban,
  buildProjectHealth,
  buildScoreHistory,
  buildReAssessmentCompare,
  buildActionEffectiveness,
  taskStats,
  exportTasksCsv,
} from "../api/lib/workspace-core.js";
import { restApiManifest } from "../api/lib/rest-api-v1.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) {
  results.push({ id, ok: true, msg });
}
function fail(id, msg) {
  results.push({ id, ok: false, msg });
}

const snap = {
  orderId: "o1",
  projectLabel: "Platform",
  assessedAt: "2026-06-01T00:00:00Z",
  executiveSummary: { governanceScore: 70 },
  recommendations: [
    { id: "r1", title: "AI register", priority: "High", why: "Visibility", businessBenefit: "Risk down" },
  ],
  departmentAnalysis: [{ name: "Engineering", score: 72 }],
};

const tasks = seedTasksFromSnapshots([], [snap]);
if (tasks.length === 1 && tasks[0].title === "AI register") pass("P1-seed", "Tasks seeded from recommendations");
else fail("P1-seed", "Seed failed");

updateTask(tasks, tasks[0].id, { status: "completed", completionNotes: "Done", evidence: "Link" });
if (tasks[0].status === "completed") pass("P1-update", "Task update works");
else fail("P1-update", "Update failed");

addComment(tasks[0], "user@test.com", "Please review @owner@test.com");
if (tasks[0].comments.length === 1 && tasks[0].comments[0].mentions.length === 1) pass("P2-comment", "Comments and mentions");
else fail("P2-comment", "Comment failed");

const kanban = groupKanban(tasks);
if (kanban.length === 4 && kanban.find((c) => c.id === "completed").tasks.length === 1) pass("P2-kanban", "Kanban grouping");
else fail("P2-kanban", "Kanban failed");

const intel = {
  empty: false,
  executiveDashboard: { trend: { direction: "improving", delta: 5 } },
  trendAnalysis: {
    lastVsCurrent: {
      last: { governanceScore: 65, label: "A" },
      current: { governanceScore: 70, label: "B" },
      trend: { direction: "improving", delta: 5, label: "Improving" },
    },
  },
};
const health = buildProjectHealth(tasks, intel);
if (health.completedRecommendations === 1 && health.overallHealth) pass("P2-health", "Project health");
else fail("P2-health", "Health failed");

const history = buildScoreHistory([
  { assessedAt: "2026-01-01", projectLabel: "A", executiveSummary: { governanceScore: 60 }, departmentAnalysis: [] },
  { assessedAt: "2026-06-01", projectLabel: "B", executiveSummary: { governanceScore: 70 }, departmentAnalysis: [{ name: "Eng", score: 72 }] },
]);
if (history.timeline.length === 2) pass("P2-history", "Score history");
else fail("P2-history", "History failed");

const compare = buildReAssessmentCompare(intel);
if (compare.available && compare.improvement.delta === 5) pass("P2-reassess", "Re-assessment compare");
else fail("P2-reassess", "Compare failed");

const eff = buildActionEffectiveness(tasks, [
  { executiveSummary: { governanceScore: 70 } },
  { executiveSummary: { governanceScore: 65 } },
]);
if (eff.length === 1) pass("P2-effectiveness", "Action effectiveness");
else fail("P2-effectiveness", "Effectiveness failed");

const csv = exportTasksCsv(tasks);
if (csv.includes("AI register") && csv.includes("Evidence")) pass("P2-export-csv", "CSV export");
else fail("P2-export-csv", "CSV failed");

const manifest = restApiManifest();
if (manifest.integrations.planned.length >= 4) pass("P2-api-foundation", "REST API manifest");
else fail("P2-api-foundation", "Manifest incomplete");

for (const f of ["api/workspace.js", "api/workspace-export.js", "assets/js/governance-workspace.js"]) {
  if (fs.existsSync(path.join(root, f))) pass("FILE-" + f, "Present");
  else fail("FILE-" + f, "Missing");
}

const healthJs = fs.readFileSync(path.join(root, "api/health.js"), "utf8");
if (healthJs.includes('"25.22"')) pass("P1-version", "Version 25.22");
else fail("P1-version", "Version not bumped");

for (const f of ["api/workspace.js", "api/workspace-export.js"]) {
  const c = fs.readFileSync(path.join(root, f), "utf8");
  if (/sk_live|razp_live_secret/i.test(c)) fail("P0-" + f, "Secret leak");
  else pass("P0-" + f, "No secrets");
}

const failed = results.filter((r) => !r.ok);
console.log("\n=== v25.0 Workspace Tests ===\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + "  " + r.id + ": " + r.msg));
console.log("\n" + results.length + " tests | " + (results.length - failed.length) + " passed | " + failed.length + " failed");
process.exit(failed.length ? 1 : 0);
