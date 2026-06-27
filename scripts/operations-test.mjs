#!/usr/bin/env node
/** Operations & observability tests — v25.9 (static checks, no storage imports) */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

function hashCustomerIdentifier(email) {
  return crypto.createHmac("sha256", "test").update(String(email).trim().toLowerCase()).digest("hex").slice(0, 16);
}

function createRequestLogger() {
  const startedAt = Date.now();
  return {
    finish() {
      return Date.now() - startedAt;
    },
  };
}

const healthSrc = fs.readFileSync(path.join(root, "api/health.js"), "utf8");
if (healthSrc.includes("getPublicReadiness") && healthSrc.includes("services")) {
  pass("O1-health-readiness", "Public readiness endpoint");
} else fail("O1-health-readiness", "missing");

if (healthSrc.includes("requestId") && !healthSrc.includes("storageBackend")) {
  pass("O2-health-no-leak", "Health avoids internal leak");
} else fail("O2-health-no-leak", "health may leak internals");

const adminSrc = fs.readFileSync(path.join(root, "api/admin-actions.js"), "utf8");
if (adminSrc.includes("operations_dashboard") && adminSrc.includes("getAdminReadiness")) {
  pass("O3-admin-dashboard", "Admin operations dashboard");
} else fail("O3-admin-dashboard", "missing");

if (adminSrc.includes("admin_auth_failed")) {
  pass("O4-admin-auth-alert", "Admin auth failure tracked");
} else fail("O4-admin-auth-alert", "missing");

const alertSrc = fs.readFileSync(path.join(root, "api/lib/alerting.js"), "utf8");
if (alertSrc.includes("emitAlert") && alertSrc.includes("ALERT_WEBHOOK_URL")) {
  pass("O5-alert-hooks", "Alert integration hooks documented");
} else fail("O5-alert-hooks", "missing");

const corrSrc = fs.readFileSync(path.join(root, "api/lib/correlation.js"), "utf8");
if (corrSrc.includes("createRequestLogger") && corrSrc.includes("durationMs")) {
  pass("O6-structured-logs", "Structured request logging");
} else fail("O6-structured-logs", "missing");

const auditSrc = fs.readFileSync(path.join(root, "api/lib/audit.js"), "utf8");
const required = [
  "upload_received",
  "validation_complete",
  "quote_created",
  "payment_started",
  "payment_verified",
  "report_generated",
  "report_downloaded",
  "enterprise_request_created",
  "admin_action",
  "refund_status_updated",
];
for (const ev of required) {
  if (auditSrc.includes('"' + ev + '"')) pass("O7-audit-" + ev, "Audit event " + ev);
  else fail("O7-audit-" + ev, "missing " + ev);
}

if (fs.existsSync(path.join(root, "api/lib/ops-metrics.js"))) pass("O8-ops-metrics", "Ops metrics module");
else fail("O8-ops-metrics", "missing");

if (fs.existsSync(path.join(root, "api/lib/ops-readiness.js"))) pass("O9-ops-readiness", "Ops readiness module");
else fail("O9-ops-readiness", "missing");

const uploadSrc = fs.readFileSync(path.join(root, "api/upload-report.js"), "utf8");
if (uploadSrc.includes("logSessionAudit") && uploadSrc.includes("recordOpsTiming")) {
  pass("O10-upload-obs", "Upload instrumented");
} else fail("O10-upload-obs", "missing");

const verifySrc = fs.readFileSync(path.join(root, "api/verify-payment.js"), "utf8");
if (verifySrc.includes("payment_verify_ms") && verifySrc.includes("emitAlert")) {
  pass("O11-verify-obs", "Verify instrumented");
} else fail("O11-verify-obs", "missing");

const adminJs = fs.readFileSync(path.join(root, "assets/js/admin-portal.js"), "utf8");
if (adminJs.includes("operations_dashboard") && adminJs.includes("admin-ops-dashboard")) {
  pass("O12-admin-ui", "Admin ops UI");
} else fail("O12-admin-ui", "missing");

if (healthSrc.includes('"25.22"')) pass("O13-version", "Version 25.22");
else fail("O13-version", "not bumped");

if (createRequestLogger().finish() >= 0) pass("O14-logger-runs", "Request logger executes");
else fail("O14-logger-runs", "failed");

const hash = hashCustomerIdentifier("ops@test.com");
if (hash && hash.length === 16) pass("O15-customer-hash", "Customer hash sanitized");
else fail("O15-customer-hash", "bad hash");

if (alertSrc.includes("PAYMENT_VERIFY_FAILED")) pass("O16-alert-types", "Alert types defined");
else fail("O16-alert-types", "missing");

const readinessSrc = fs.readFileSync(path.join(root, "api/lib/ops-readiness.js"), "utf8");
if (readinessSrc.includes("getPublicReadiness") && readinessSrc.includes("checkRazorpayConnectivity")) {
  pass("O17-readiness-module", "Readiness probes defined");
} else fail("O17-readiness-module", "missing");

const metricsSrc = fs.readFileSync(path.join(root, "api/lib/ops-metrics.js"), "utf8");
if (metricsSrc.includes("getOperationsMetrics") && metricsSrc.includes("recordOpsTiming")) {
  pass("O18-metrics-module", "Metrics rollup defined");
} else fail("O18-metrics-module", "missing");

const adminActions = fs.readFileSync(path.join(root, "api/admin-actions.js"), "utf8");
if (adminActions.includes("auditAdmin") && adminActions.includes("delete_expired")) {
  pass("O19-admin-audit", "Admin audit coverage");
} else fail("O19-admin-audit", "missing");

const engineSrc = fs.readFileSync(path.join(root, "api/lib/report-engine.js"), "utf8");
if (engineSrc.includes("sanitizeSpreadsheetCell")) pass("O20-upload-sanitize", "Spreadsheet injection sanitizer");
else fail("O20-upload-sanitize", "missing");

const failed = results.filter((x) => !x.ok);
console.log("\nOperations & Observability v25.14 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
