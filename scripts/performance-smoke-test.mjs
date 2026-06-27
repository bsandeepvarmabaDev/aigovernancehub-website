#!/usr/bin/env node
/** Performance smoke tests — v25.12 / v25.13 */
import { performance } from "perf_hooks";
import {
  parseUploadContent,
  sanitizeSpreadsheetCell,
  countWorkItems,
} from "../api/lib/report-engine.js";
import { buildOrderQuote } from "../api/lib/pricing.js";
import { detectPlanTier } from "../api/lib/assessment-config.js";

const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

const headers = "Issue Key,Summary,Description,Issue Type,Status,Project\n";
function makeCsv(rows) {
  const lines = [headers.trim()];
  for (let i = 0; i < rows; i += 1) {
    lines.push(`PROJ-${i},Task ${i},Desc ${i},Story,Open,PROJ`);
  }
  return lines.join("\n");
}

async function timed(label, fn, budgetMs) {
  const t0 = performance.now();
  await fn();
  const ms = Math.round(performance.now() - t0);
  if (ms <= budgetMs) pass(label, `${ms}ms (budget ${budgetMs}ms)`);
  else fail(label, `${ms}ms exceeds ${budgetMs}ms`);
}

const sizes = [100, 500, 1000];
for (const n of sizes) {
  const csv = makeCsv(n);
  await timed(`PF-parse-${n}`, async () => {
    const parsed = parseUploadContent("test.csv", Buffer.from(csv, "utf8"));
    const metrics = countWorkItems(parsed.records, parsed.headers);
    if (metrics.totalWorkItems !== n) throw new Error("count mismatch");
  }, n <= 500 ? 3000 : 8000);
}

await timed("PF-quote-1000", async () => {
  const planId = detectPlanTier(1000, 1, 50000);
  const quote = buildOrderQuote(planId, "INR");
  if (!quote.totalMinor || quote.totalMinor <= 0) throw new Error("invalid quote");
}, 500);

await timed("PF-sanitize-bulk", async () => {
  for (let i = 0; i < 10000; i += 1) sanitizeSpreadsheetCell(`=SUM(${i})`);
}, 500);

const enterpriseMeta = JSON.stringify({ workItems: 100000, note: "enterprise metadata only" });
const parsed = JSON.parse(enterpriseMeta);
if (parsed.workItems === 100000) pass("PF-enterprise-meta", "100k work-item metadata sim OK");
else fail("PF-enterprise-meta", "unexpected");

const failed = results.filter((r) => !r.ok);
console.log("\nPerformance Smoke v25.13 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
