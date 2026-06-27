#!/usr/bin/env node
/** Universal business language validation — v25.22 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
if (index.includes("15 seconds") && index.includes("Executive Assessment")) {
  pass("BL-hero-clarity", "Homepage 15-second clarity");
} else fail("BL-hero-clarity", "missing hero clarity");

if (!index.includes("AI candidate")) pass("BL-no-candidate-home", "No 'AI candidate' on homepage");
else fail("BL-no-candidate-home", "homepage still uses AI candidate");

const pricing = fs.readFileSync(path.join(root, "pricing.html"), "utf8");
if (pricing.includes("data-label-work-items") && pricing.includes("data-label-ai-related")) {
  pass("BL-preview-labels", "Dynamic preview stat labels");
} else fail("BL-preview-labels", "missing data-label attrs");

if (pricing.includes("assess exported work items") && pricing.includes("Continuous AI Governance inside Jira")) {
  pass("BL-marketplace-split", "Website vs Marketplace business copy");
} else fail("BL-marketplace-split", "marketplace split unclear");

if (fs.existsSync(path.join(root, "assets/js/business-terminology.js"))) {
  pass("BL-terminology-js", "business-terminology.js present");
} else fail("BL-terminology-js", "missing");

if (fs.existsSync(path.join(root, "api/lib/business-labels.js"))) {
  pass("BL-labels-api", "business-labels.js present");
} else fail("BL-labels-api", "missing");

const reportHtml = fs.readFileSync(path.join(root, "api/lib/report-html-v22.js"), "utf8");
if (reportHtml.includes("business-labels.js") && reportHtml.includes("AI_RELATED_SHORT")) {
  pass("BL-report-labels", "Report uses business labels");
} else fail("BL-report-labels", "report not wired");

const reportEngine = fs.readFileSync(path.join(root, "api/lib/report-engine.js"), "utf8");
if (!reportEngine.includes("AI CANDIDATE") && !reportEngine.includes("AI candidate")) {
  pass("BL-no-candidate-report", "No candidate jargon in text reports");
} else fail("BL-no-candidate-report", "report-engine still uses candidate jargon");

if (reportEngine.includes("business-labels.js") && reportEngine.includes("AI_RELATED_INVENTORY_HEADING")) {
  pass("BL-report-engine-labels", "Text report uses business-labels");
} else fail("BL-report-engine-labels", "report-engine not wired to business-labels");

const health = fs.readFileSync(path.join(root, "api/health.js"), "utf8");
if (health.includes('"25.22"')) pass("BL-version", "Version 25.22");
else fail("BL-version", "version mismatch");

console.log("\nUniversal Business Language v25.22 Tests\n");
for (const r of results) {
  console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed\n`);
process.exit(failed ? 1 : 0);
