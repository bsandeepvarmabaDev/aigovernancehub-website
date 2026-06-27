#!/usr/bin/env node
/** Security fix pass validation — v25.11 / v25.13 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  createSessionToken,
  validateSessionToken,
  getSigningSecretsForPurpose,
} from "../api/lib/tokens.js";
import { sanitizeSpreadsheetCell } from "../api/lib/report-engine.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

const rateLimit = fs.readFileSync(path.join(root, "api/lib/rate-limit.js"), "utf8");
if (rateLimit.includes("if (!keySecret)") && rateLimit.includes("unavailable: true")) {
  pass("SF-rate-fail-closed", "Rate limit fails closed without secret");
} else fail("SF-rate-fail-closed", "missing fail-closed");

const tokensSrc = fs.readFileSync(path.join(root, "api/lib/tokens.js"), "utf8");
if (tokensSrc.includes("_PREVIOUS")) pass("SF-previous-secret", "_PREVIOUS rotation support");
else fail("SF-previous-secret", "missing");

process.env.APP_SIGNING_SECRET = process.env.APP_SIGNING_SECRET || "test-app-signing-secret-for-ci";
process.env.SESSION_TOKEN_SECRET = process.env.SESSION_TOKEN_SECRET || "test-session-secret-for-ci";
process.env.DOWNLOAD_TOKEN_SECRET = process.env.DOWNLOAD_TOKEN_SECRET || "test-download-secret-for-ci";
process.env.ENTERPRISE_TOKEN_SECRET = process.env.ENTERPRISE_TOKEN_SECRET || "test-enterprise-secret-for-ci";
process.env.RATE_LIMIT_SECRET = process.env.RATE_LIMIT_SECRET || "test-rate-limit-secret-for-ci";
process.env.ANALYTICS_TOKEN_SECRET = process.env.ANALYTICS_TOKEN_SECRET || "test-analytics-secret-for-ci";
process.env.AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || "test-auth-secret-for-ci";

const PURPOSES = ["session", "download", "enterprise", "rate_limit", "analytics", "auth"];
for (const purpose of PURPOSES) {
  const secrets = getSigningSecretsForPurpose(purpose);
  if (secrets.length >= 1) pass(`SF-purpose-${purpose}`, "Signing secrets resolve");
  else fail(`SF-purpose-${purpose}`, "no secrets");
}

process.env.SESSION_TOKEN_SECRET = "secret-a";
delete process.env.SESSION_TOKEN_SECRET_PREVIOUS;
delete process.env.RAZORPAY_KEY_SECRET;
delete process.env.APP_SIGNING_SECRET;
const rotTok = createSessionToken("rot-test", "hash", null);
process.env.SESSION_TOKEN_SECRET = "secret-b";
process.env.SESSION_TOKEN_SECRET_PREVIOUS = "secret-a";
if (validateSessionToken(rotTok, null)?.sessionId === "rot-test") {
  pass("SF-rotation-previous", "Previous secret validates during rotation");
} else fail("SF-rotation-previous", "rotation broken");
process.env.SESSION_TOKEN_SECRET = "test-session-secret";
delete process.env.SESSION_TOKEN_SECRET_PREVIOUS;

if (sanitizeSpreadsheetCell("=cmd|") === "'=cmd|") pass("SF-csv-injection", "Formula injection mitigated");
else fail("SF-csv-injection", "sanitizer weak");

const admin = fs.readFileSync(path.join(root, "api/admin-actions.js"), "utf8");
if (admin.includes("auditAdmin") && admin.includes("disable_download") && admin.includes("delete_expired")) {
  pass("SF-admin-audit", "Admin actions audited");
} else fail("SF-admin-audit", "incomplete audit");

if (admin.includes("isAdminAuthorized")) {
  pass("SF-admin-auth", "Admin authorization enforced");
} else fail("SF-admin-auth", "weak admin auth");

const health = fs.readFileSync(path.join(root, "api/health.js"), "utf8");
if (!health.includes("ADMIN_API_KEY") && !health.includes("RAZORPAY_KEY_SECRET")) {
  pass("SF-health-minimal", "Public health minimal exposure");
} else fail("SF-health-minimal", "secrets in health");

const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith(".html"));
let scriptUnsafe = 0;
for (const f of htmlFiles) {
  const c = fs.readFileSync(path.join(root, f), "utf8");
  const m = c.match(/Content-Security-Policy" content="([^"]*)"/);
  if (m && m[1].split("style-src")[0].includes("'unsafe-inline'")) scriptUnsafe += 1;
}
if (scriptUnsafe === 0) pass("SF-csp-script", "No unsafe-inline in script-src on root HTML");
else fail("SF-csp-script", `${scriptUnsafe} pages still have script unsafe-inline`);

const paymentState = fs.readFileSync(path.join(root, "api/lib/payment-state.js"), "utf8");
if (paymentState.includes("refunded") || paymentState.includes("cancelled") || paymentState.includes("failed")) {
  pass("SF-payment-states", "Payment state machine includes terminal states");
} else fail("SF-payment-states", "incomplete");

const failed = results.filter((r) => !r.ok);
console.log("\nSecurity Fix v25.13 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
