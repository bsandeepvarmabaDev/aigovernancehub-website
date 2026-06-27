#!/usr/bin/env node
/**
 * Production audit v25.7 — static security checks
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import {
  verifyRazorpayPaymentSignature,
} from "../api/lib/razorpay-client.js";
import { getKeySecret, createRecoveryToken, validateRecoveryToken } from "../api/lib/tokens.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

const verifySrc = fs.readFileSync(path.join(root, "api/verify-payment.js"), "utf8");
if (verifySrc.indexOf("verifyRazorpayPaymentSignature") < verifySrc.indexOf("existingReport")) {
  pass("PA-verify-sig-first", "Signature verified before idempotent replay");
} else {
  fail("PA-verify-sig-first", "Signature must precede idempotent token re-issue");
}

if (verifySrc.includes("!session.pendingCheckout || session.pendingCheckout.orderId !== orderId")) {
  pass("PA-pending-required", "pendingCheckout required for self-serve verify");
} else {
  fail("PA-pending-required", "pendingCheckout binding missing");
}

if (verifySrc.includes("assertPaymentAmountMatches") || verifySrc.includes("fetchRazorpayPayment")) {
  pass("PA-amount-check", "Razorpay amount validation present");
} else {
  fail("PA-amount-check", "Amount validation missing");
}

if (verifySrc.includes("existingReport.sessionId") && verifySrc.includes("sessionId !== sessionId")) {
  pass("PA-idempotent-session", "Idempotent path binds sessionId");
} else {
  fail("PA-idempotent-session", "Idempotent session binding missing");
}

const recoverSrc = fs.readFileSync(path.join(root, "api/recover-reports.js"), "utf8");
if (!recoverSrc.includes("recoveryToken") && recoverSrc.includes("createMagicLinkRecord")) {
  pass("PA-recover-email", "Recovery uses email verification, no token leak");
} else {
  fail("PA-recover-email", "Recovery still returns tokens without verification");
}

const recoverJs = fs.readFileSync(path.join(root, "assets/js/recover-report.js"), "utf8");
if (!recoverJs.includes("recoveryToken")) {
  pass("PA-recover-ui", "Recovery UI does not expose tokens");
} else {
  fail("PA-recover-ui", "Recovery UI still uses inline tokens");
}

const uploadSrc = fs.readFileSync(path.join(root, "api/upload-report.js"), "utf8");
if (!uploadSrc.includes("error.message")) {
  pass("PA-upload-errors", "Upload errors do not leak parser internals");
} else {
  fail("PA-upload-errors", "Upload still returns error.message");
}

const healthSrc = fs.readFileSync(path.join(root, "api/health.js"), "utf8");
if (!healthSrc.includes("storageBackend") && !healthSrc.includes("checks:")) {
  pass("PA-health-recon", "Health endpoint reduced public recon");
} else {
  fail("PA-health-recon", "Health still exposes infra details");
}

const rateSrc = fs.readFileSync(path.join(root, "api/lib/rate-limit.js"), "utf8");
if (rateSrc.includes("unavailable: true")) {
  pass("PA-rate-fail-closed", "Rate limit fails closed on outage");
} else {
  fail("PA-rate-fail-closed", "Rate limit still fail-open");
}

const tokenSrc = fs.readFileSync(path.join(root, "api/lib/tokens.js"), "utf8");
if (tokenSrc.includes("SESSION_TOKEN_SECRET") && tokenSrc.includes("getSigningSecretsForPurpose")) {
  pass("PA-purpose-secrets", "Purpose-specific signing secrets");
} else {
  fail("PA-purpose-secrets", "Missing purpose secrets");
}

if (fs.existsSync(path.join(root, "api/razorpay-webhook.js"))) {
  pass("PA-webhook", "Razorpay webhook endpoint present");
} else {
  fail("PA-webhook", "Webhook missing");
}

if (rateSrc.includes('"admin-enterprise"')) {
  pass("PA-admin-rate", "Admin enterprise rate limit configured");
} else {
  fail("PA-admin-rate", "admin-enterprise rate limit missing");
}

const secret = getKeySecret() || "test-secret-for-audit-only";
const sig = crypto.createHmac("sha256", secret).update("order_test|pay_test").digest("hex");
if (verifyRazorpayPaymentSignature("order_test", "pay_test", sig, secret)) {
  pass("PA-razorpay-hmac", "Razorpay HMAC verification works");
} else {
  fail("PA-razorpay-hmac", "HMAC verification failed");
}

if (!verifyRazorpayPaymentSignature("order_test", "pay_test", "bad", secret)) {
  pass("PA-razorpay-reject", "Invalid signature rejected");
} else {
  fail("PA-razorpay-reject", "Invalid signature accepted");
}

process.env.DOWNLOAD_TOKEN_SECRET = process.env.DOWNLOAD_TOKEN_SECRET || "test-download-audit";
const token = createRecoveryToken("order_x", "pay_y", "buyer@example.com", null);
const valid = validateRecoveryToken(token, null, "buyer@example.com");
if (valid && valid.orderId === "order_x") {
  pass("PA-recovery-token", "Recovery token crypto intact");
} else {
  fail("PA-recovery-token", "Recovery token validation broken");
}

const apiDir = path.join(root, "api");
const apiFiles = fs.readdirSync(apiDir).filter((f) => f.endsWith(".js"));
let stackLeak = false;
for (const f of apiFiles) {
  const src = fs.readFileSync(path.join(apiDir, f), "utf8");
  if (/res\.(json|send|end)\([^)]*stack/i.test(src)) stackLeak = true;
}
if (!stackLeak) pass("PA-no-stack", "No stack traces in API responses");
else fail("PA-no-stack", "Stack trace may leak in API");

const stripeFiles = ["create-stripe-checkout.js", "stripe-webhook.js", "lib/stripe-client.js"];
for (const f of stripeFiles) {
  if (!fs.existsSync(path.join(apiDir, f))) pass("PA-no-stripe-" + f, "Stripe removed");
  else fail("PA-no-stripe-" + f, "Stripe file present");
}

const health = fs.readFileSync(path.join(root, "api/health.js"), "utf8");
if (health.includes('"25.22"')) pass("PA-version", "Version 25.22");
else fail("PA-version", "Version not bumped");

const failed = results.filter((r) => !r.ok);
console.log("\nProduction Audit v25.8 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
