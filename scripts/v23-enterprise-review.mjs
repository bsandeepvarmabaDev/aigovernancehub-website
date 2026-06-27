#!/usr/bin/env node
/**
 * v23.0 Enterprise Launch Readiness — automated checks (TEST ONLY semantics for CI)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const checks = [];
function pass(id, msg) {
  checks.push({ id, ok: true, msg });
}
function fail(id, msg) {
  checks.push({ id, ok: false, msg });
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

// P0 — Security: no secrets in frontend
const jsFiles = ["assets/js/guided-assessment.js", "assets/js/dashboard.js", "assets/js/auth.js"];
for (const f of jsFiles) {
  const c = read(f);
  if (/sk_live|sk_test|rzp_live|API_SECRET|process\.env/i.test(c)) {
    fail("P0-secrets-" + f, "Possible secret reference in " + f);
  } else {
    pass("P0-secrets-" + f, "No obvious secrets in " + f);
  }
}

// P0 — enterprise-ux present on customer flows
const pagesWithUx = [
  "pricing.html",
  "dashboard.html",
  "login.html",
  "recover-report.html",
  "starter-success.html",
];
for (const p of pagesWithUx) {
  if (read(p).includes("enterprise-ux.js")) pass("P2-ux-script-" + p, p + " loads enterprise-ux.js");
  else fail("P2-ux-script-" + p, p + " missing enterprise-ux.js");
}

// P1 — version bump
for (const api of ["api/health.js", "api/pricing.js"]) {
  const c = read(api);
  if (c.includes('"23.0"')) pass("P1-version-" + api, api + " at 23.0");
  else fail("P1-version-" + api, api + " not at 23.0");
}

// P2 — empty states
if (read("assets/js/dashboard.js").includes("showEmptyState")) pass("P2-empty-dashboard", "Dashboard empty state wired");
else fail("P2-empty-dashboard", "Dashboard missing showEmptyState");

if (read("assets/js/recover-report.js").includes("showEmptyState")) pass("P2-empty-recover", "Recover empty state wired");
else fail("P2-empty-recover", "Recover missing showEmptyState");

// P2 — progress on upload
if (read("assets/js/guided-assessment.js").includes("showProgress")) pass("P2-upload-progress", "Upload progress steps wired");
else fail("P2-upload-progress", "Upload missing showProgress");

// P2 — multi-format success
if (read("starter-success.html").includes("availableFormats")) pass("P2-success-formats", "Success page dynamic formats");
else fail("P2-success-formats", "Success page missing format gating");

// P2 — skip links
for (const p of ["dashboard.html", "login.html", "recover-report.html", "starter-success.html"]) {
  if (read(p).includes('class="skip-link"')) pass("P2-a11y-skip-" + p, p + " has skip link");
  else fail("P2-a11y-skip-" + p, p + " missing skip link");
}

// P3 — lazy images on v23 pages
for (const p of pagesWithUx) {
  if (read(p).includes('loading="lazy"')) pass("P3-lazy-" + p, p + " lazy images");
  else fail("P3-lazy-" + p, p + " missing loading=lazy on brand icon");
}

// Deliverables
const docs = [
  "CHANGELOG-v23.0.md",
  "SECURITY-REPORT-v23.0.md",
  "ENTERPRISE-READINESS-REPORT-v23.0.md",
  "PERFORMANCE-REPORT-v23.0.md",
  "TEST-CHECKLIST-v23.0.md",
];
for (const d of docs) {
  if (exists(d)) pass("DOC-" + d, d + " present");
  else fail("DOC-" + d, d + " missing");
}

if (exists("assets/js/enterprise-ux.js")) pass("P2-enterprise-ux", "enterprise-ux.js exists");
else fail("P2-enterprise-ux", "enterprise-ux.js missing");

const failed = checks.filter((c) => !c.ok);
console.log("\n=== v23.0 Enterprise Review ===\n");
for (const c of checks) {
  console.log((c.ok ? "PASS" : "FAIL") + "  " + c.id + ": " + c.msg);
}
console.log("\nTotal: " + checks.length + " | Passed: " + (checks.length - failed.length) + " | Failed: " + failed.length);
process.exit(failed.length ? 1 : 0);
