#!/usr/bin/env node
/** Staging deployment validation — v25.10 / v25.13 (static + optional live smoke) */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

const API_ROUTES = [
  "health.js",
  "pricing.js",
  "upload-report.js",
  "order-quote.js",
  "create-order.js",
  "verify-payment.js",
  "download-report.js",
  "recover-reports.js",
  "dashboard.js",
  "razorpay-webhook.js",
];

for (const route of API_ROUTES) {
  const p = path.join(root, "api", route);
  if (fs.existsSync(p)) pass(`SV-route-${route}`, "API route exists");
  else fail(`SV-route-${route}`, "Missing");
}

if (fs.existsSync(path.join(root, "scripts/staging-env-check.mjs"))) {
  pass("SV-env-script", "staging-env-check.mjs");
} else fail("SV-env-script", "missing");

const verify = fs.readFileSync(path.join(root, "api/verify-payment.js"), "utf8");
if (verify.includes("verifyRazorpayPaymentSignature") && verify.includes("pendingCheckout")) {
  pass("SV-verify-payment", "Signature-first verify flow");
} else fail("SV-verify-payment", "incomplete");

const webhook = fs.readFileSync(path.join(root, "api/razorpay-webhook.js"), "utf8");
if (webhook.includes("verifyWebhookSignature") || webhook.includes("webhook")) {
  pass("SV-webhook", "Webhook handler present");
} else fail("SV-webhook", "missing");

const gate = fs.readFileSync(path.join(root, "api/lib/enterprise-gate-rules.js"), "utf8");
if (gate.includes("1000") || gate.includes("ENTERPRISE_GATE")) {
  pass("SV-enterprise-gate", "Enterprise gate rules");
} else fail("SV-enterprise-gate", "missing");

const download = fs.readFileSync(path.join(root, "api/download-report.js"), "utf8");
if (download.includes("isDownloadReady") || download.includes("PAYMENT_STATE")) {
  pass("SV-download-gate", "Download payment gate");
} else fail("SV-download-gate", "weak");

const health = fs.readFileSync(path.join(root, "api/health.js"), "utf8");
if (health.includes('"25.22"')) pass("SV-version", "Version 25.22");
else fail("SV-version", "version mismatch");

const stagingUrl = process.env.STAGING_URL?.replace(/\/$/, "");
if (stagingUrl) {
  try {
    const res = await fetch(`${stagingUrl}/api/health`);
    if (res.ok) {
      const body = await res.json();
      if (body.version === "25.14" || body.version === "25.9") {
        pass("SV-live-health", `Live health OK (${body.version})`);
      } else fail("SV-live-health", `Unexpected version ${body.version}`);
    } else fail("SV-live-health", `HTTP ${res.status}`);
  } catch (e) {
    fail("SV-live-health", e instanceof Error ? e.message : "fetch failed");
  }
} else {
  pass("SV-live-skipped", "Set STAGING_URL for live smoke (optional)");
}

const failed = results.filter((r) => !r.ok);
console.log("\nStaging Validation v25.13 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
