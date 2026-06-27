#!/usr/bin/env node
/**
 * Production resilience tests — v25.8
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import {
  getSessionSigningSecret,
  getDownloadSigningSecret,
  getEnterpriseSigningSecret,
  getRateLimitSecret,
  getAuthSigningSecret,
  createSessionToken,
  validateSessionToken,
  createSuccessToken,
  validateSuccessToken,
  createEnterprisePayToken,
  validateEnterprisePayToken,
  createRecoveryToken,
  validateRecoveryToken,
} from "../api/lib/tokens.js";
import {
  PAYMENT_STATE,
  REPORT_STATE,
  isDownloadReady,
  isPendingCheckoutExpired,
  canTransitionPayment,
} from "../api/lib/payment-state.js";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "../api/lib/razorpay-client.js";
import { retentionSummary, getPendingCheckoutExpiresAt } from "../api/lib/retention.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "test-razorpay-secret";
process.env.SESSION_TOKEN_SECRET = "test-session-secret";
process.env.DOWNLOAD_TOKEN_SECRET = "test-download-secret";
process.env.ENTERPRISE_TOKEN_SECRET = "test-enterprise-secret";
process.env.RATE_LIMIT_SECRET = "test-rate-limit-secret";
process.env.AUTH_TOKEN_SECRET = "test-auth-secret";

if (getSessionSigningSecret() === "test-session-secret") pass("R1-session-secret", "Session secret isolated");
else fail("R1-session-secret", getSessionSigningSecret());

if (getDownloadSigningSecret() === "test-download-secret") pass("R2-download-secret", "Download secret isolated");
else fail("R2-download-secret", getDownloadSigningSecret());

if (getEnterpriseSigningSecret() === "test-enterprise-secret") pass("R3-enterprise-secret", "Enterprise secret isolated");
else fail("R3-enterprise-secret", getEnterpriseSigningSecret());

if (getRateLimitSecret() === "test-rate-limit-secret") pass("R4-rate-secret", "Rate limit secret isolated");
else fail("R4-rate-secret", getRateLimitSecret());

if (getAuthSigningSecret() === "test-auth-secret") pass("R5-auth-secret", "Auth secret isolated");
else fail("R5-auth-secret", getAuthSigningSecret());

const sessionTok = createSessionToken("sess_1", "hash_abc", null);
if (validateSessionToken(sessionTok, null)?.sessionId === "sess_1") pass("R6-session-roundtrip", "Session token works");
else fail("R6-session-roundtrip", "failed");

const successTok = createSuccessToken("order_1", "pay_1", null);
if (validateSuccessToken(successTok, null)?.orderId === "order_1") pass("R7-success-token", "Success token works");
else fail("R7-success-token", "failed");

const entTok = createEnterprisePayToken("sess_e", "order_e", null);
if (validateEnterprisePayToken(entTok, null)?.orderId === "order_e") pass("R8-enterprise-token", "Enterprise token works");
else fail("R8-enterprise-token", "failed");

const recTok = createRecoveryToken("order_r", "pay_r", "a@b.com", null);
if (validateRecoveryToken(recTok, null, "a@b.com")?.orderId === "order_r") pass("R9-recovery-token", "Recovery token works");
else fail("R9-recovery-token", "failed");

const rateSrc = fs.readFileSync(path.join(root, "api/lib/rate-limit.js"), "utf8");
if (rateSrc.includes("unavailable: true") && rateSrc.includes("503")) pass("R10-rate-fail-closed", "Rate limit fails closed");
else fail("R10-rate-fail-closed", "missing fail-closed");

if (!canTransitionPayment(PAYMENT_STATE.REFUNDED, PAYMENT_STATE.PAID)) pass("R11-state-terminal", "Terminal state protected");
else fail("R11-state-terminal", "bad transition");

if (isPendingCheckoutExpired({ expiresAt: new Date(Date.now() - 1000).toISOString() })) {
  pass("R12-checkout-expired", "Expired checkout detected");
} else fail("R12-checkout-expired", "not detected");

if (!isPendingCheckoutExpired({ expiresAt: getPendingCheckoutExpiresAt() })) {
  pass("R13-checkout-valid", "Active checkout valid");
} else fail("R13-checkout-valid", "false positive");

if (isDownloadReady({ paymentStatus: "verified", reportStatus: REPORT_STATE.READY })) {
  pass("R14-download-ready", "Ready report downloadable");
} else fail("R14-download-ready", "not ready");

if (!isDownloadReady({ paymentStatus: "paid", reportStatus: REPORT_STATE.GENERATING })) {
  pass("R15-generating-blocked", "Generating report blocked");
} else fail("R15-generating-blocked", "should block");

if (!isDownloadReady({ paymentState: PAYMENT_STATE.REFUNDED, paymentStatus: "verified", reportStatus: REPORT_STATE.READY })) {
  pass("R16-refund-blocked", "Refunded report blocked");
} else fail("R16-refund-blocked", "should block");

const secret = "webhook-test-secret";
process.env.RAZORPAY_WEBHOOK_SECRET = secret;
const body = '{"event":"payment.captured"}';
const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
if (verifyRazorpayWebhookSignature(body, sig)) pass("R17-webhook-sig", "Webhook signature valid");
else fail("R17-webhook-sig", "invalid");

if (fs.existsSync(path.join(root, "api/razorpay-webhook.js"))) pass("R18-webhook-endpoint", "Webhook endpoint exists");
else fail("R18-webhook-endpoint", "missing");

const webhookSrc = fs.readFileSync(path.join(root, "api/razorpay-webhook.js"), "utf8");
if (webhookSrc.includes("isWebhookEventProcessed")) pass("R19-webhook-dedup", "Webhook deduplication");
else fail("R19-webhook-dedup", "missing");

const fulfillSrc = fs.readFileSync(path.join(root, "api/lib/payment-fulfillment.js"), "utf8");
if (fulfillSrc.includes("REPORT_STATE.GENERATING") && fulfillSrc.includes("retryReportGeneration")) {
  pass("R20-generation-resilience", "Generation stub + retry");
} else fail("R20-generation-resilience", "missing");

const verifySrc = fs.readFileSync(path.join(root, "api/verify-payment.js"), "utf8");
if (verifySrc.includes("isPendingCheckoutExpired") && verifySrc.includes("202")) {
  pass("R21-verify-resilience", "Verify handles expiry + gen failure");
} else fail("R21-verify-resilience", "missing");

const adminSrc = fs.readFileSync(path.join(root, "api/admin-actions.js"), "utf8");
if (adminSrc.includes("retry_generation") && adminSrc.includes("diagnostics") && adminSrc.includes("mark_refunded")) {
  pass("R22-admin-ops", "Admin retry + diagnostics");
} else fail("R22-admin-ops", "missing");

const paySig = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update("ord|pay").digest("hex");
if (verifyRazorpayPaymentSignature("ord", "pay", paySig, process.env.RAZORPAY_KEY_SECRET)) {
  pass("R23-payment-hmac", "Payment HMAC intact");
} else fail("R23-payment-hmac", "broken");

if (retentionSummary().reportDays === 90) pass("R24-retention", "Retention configurable");
else fail("R24-retention", JSON.stringify(retentionSummary()));

const health = fs.readFileSync(path.join(root, "api/health.js"), "utf8");
if (health.includes('"25.22"')) pass("R25-version", "Version 25.22");
else fail("R25-version", "not bumped");

const legacySecret = "legacy-razorpay-fallback";
process.env.RAZORPAY_KEY_SECRET = legacySecret;
delete process.env.SESSION_TOKEN_SECRET;
delete process.env.APP_SIGNING_SECRET;
const legacySessionTok = createSessionToken("legacy", "hash", null);
process.env.SESSION_TOKEN_SECRET = "new-session-secret";
if (validateSessionToken(legacySessionTok, null)?.sessionId === "legacy") {
  pass("R26-token-rotation", "Legacy token valid during rotation");
} else fail("R26-token-rotation", "rotation broke existing tokens");
process.env.SESSION_TOKEN_SECRET = "test-session-secret";

const failed = results.filter((r) => !r.ok);
console.log("\nProduction Resilience v25.8 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
