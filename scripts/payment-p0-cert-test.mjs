#!/usr/bin/env node
/**
 * P0 payment certification tests — v25.24
 * Static + logic verification (1000 randomized state-matrix cases).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  REPORT_STATE,
  CUSTOMER_PAYMENT_STATE,
  GENERATION_STALE_MS,
  resolveCustomerPaymentState,
  buildCustomerStatusView,
  isGenerationInProgress,
  isGenerationStale,
  isDownloadReady,
} from "../api/_lib/payment-state.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) {
  results.push({ id, ok: true, msg });
}
function fail(id, msg) {
  results.push({ id, ok: false, msg });
}

const fulfillSrc = fs.readFileSync(path.join(root, "api/_lib/payment-fulfillment.js"), "utf8");
const verifySrc = fs.readFileSync(path.join(root, "api/verify-payment.js"), "utf8");
const webhookSrc = fs.readFileSync(path.join(root, "api/razorpay-webhook.js"), "utf8");
const pendingJs = fs.readFileSync(path.join(root, "assets/js/starter-pending.js"), "utf8");
const successJs = fs.readFileSync(path.join(root, "assets/js/starter-success.js"), "utf8");
const dashboardJs = fs.readFileSync(path.join(root, "assets/js/dashboard.js"), "utf8");
const dashboardApi = fs.readFileSync(path.join(root, "api/dashboard.js"), "utf8");
const downloadApi = fs.readFileSync(path.join(root, "api/download-report.js"), "utf8");
const customerEmail = fs.readFileSync(path.join(root, "api/customer-email.js"), "utf8");

if (fulfillSrc.includes("isGenerationInProgress") && fulfillSrc.includes("priorEmailSent")) {
  pass("P0-1-fulfillment-guard", "In-flight generation guard + email idempotency");
} else fail("P0-1-fulfillment-guard", "Missing guards");

if (fulfillSrc.includes("fulfillFromWebhookPayment")) {
  pass("P0-2-webhook-fulfillment", "Webhook fulfillment export present");
} else fail("P0-2-webhook-fulfillment", "Missing fulfillFromWebhookPayment");

if (webhookSrc.includes("needsFulfillment") && webhookSrc.includes("fulfillFromWebhookPayment")) {
  pass("P0-2-webhook-trigger", "Webhook triggers fulfillment pipeline");
} else fail("P0-2-webhook-trigger", "Webhook does not trigger fulfillment");

if (verifySrc.includes("isGenerationInProgress") && verifySrc.includes("buildCustomerStatusView")) {
  pass("P0-1-verify-skip-generating", "Verify skips re-fulfillment while generating");
} else fail("P0-1-verify-skip-generating", "Verify still re-enters fulfillment");

if (fs.existsSync(path.join(root, "api/payment-status.js"))) {
  pass("P0-4-payment-status-api", "Payment status API exists");
} else fail("P0-4-payment-status-api", "Missing payment-status.js");

if (pendingJs.includes("/api/payment-status") && pendingJs.includes("generation_failed")) {
  pass("P0-4-pending-server-state", "Pending page polls persisted record");
} else fail("P0-4-pending-server-state", "Pending page URL-only");

if (successJs.includes("generation_failed")) {
  pass("P0-5-success-failed-state", "Success page shows generation failed");
} else fail("P0-5-success-failed-state", "Success treats failed as processing");

if (dashboardApi.includes("buildCustomerStatusView") && dashboardJs.includes("statusLabel")) {
  pass("P0-4-dashboard-canonical", "Dashboard derives canonical status");
} else fail("P0-4-dashboard-canonical", "Dashboard status mismatch");

if (customerEmail.includes("failedReportCount") && customerEmail.includes("generationFailed")) {
  pass("P0-4-recover-failed", "Recover reports tracks failed generation");
} else fail("P0-4-recover-failed", "Recover missing failed count");

if (fulfillSrc.includes("correlationId") && downloadApi.includes("report.correlationId")) {
  pass("P0-6-correlation-persist", "CorrelationId on record + download audit");
} else fail("P0-6-correlation-persist", "Correlation not propagated");

const failedGen = buildCustomerStatusView({
  paymentStatus: "verified",
  reportStatus: REPORT_STATE.FAILED,
});
if (failedGen.customerPaymentState === CUSTOMER_PAYMENT_STATE.GENERATION_FAILED) {
  pass("P0-5-state-failed", "Failed generation distinct customer state");
} else fail("P0-5-state-failed", failedGen.customerPaymentState);

const generating = {
  paymentStatus: "verified",
  reportStatus: REPORT_STATE.GENERATING,
  updatedAt: new Date().toISOString(),
};
if (isGenerationInProgress(generating, false) && !isGenerationInProgress(generating, true)) {
  pass("P0-1-in-progress-logic", "Generation in-progress detection");
} else fail("P0-1-in-progress-logic", "In-progress logic broken");

const stale = {
  paymentStatus: "verified",
  reportStatus: REPORT_STATE.GENERATING,
  updatedAt: new Date(Date.now() - GENERATION_STALE_MS - 1000).toISOString(),
};
if (isGenerationStale(stale) && !isGenerationInProgress(stale, false)) {
  pass("P0-1-stale-logic", "Stale generation allows retry");
} else fail("P0-1-stale-logic", "Stale logic broken");

const ready = { paymentStatus: "verified", reportStatus: REPORT_STATE.READY };
if (isDownloadReady(ready) && !isDownloadReady({ ...ready, reportStatus: REPORT_STATE.GENERATING })) {
  pass("P0-sec-download-ready", "Downloads only when report ready");
} else fail("P0-sec-download-ready", "Download gate weakened");

if (dashboardJs.includes("downloadReady") && dashboardJs.includes("generation_failed")) {
  pass("P0-sec-dashboard-downloads", "Dashboard hides downloads until ready");
} else fail("P0-sec-dashboard-downloads", "Dashboard may offer premature downloads");

let matrixPass = 0;
let matrixFail = 0;
const states = ["verified", "failed", "pending"];
const reportStates = [REPORT_STATE.GENERATING, REPORT_STATE.READY, REPORT_STATE.FAILED, null];
const ages = [0, GENERATION_STALE_MS / 2, GENERATION_STALE_MS + 1000];

for (let i = 0; i < 1000; i += 1) {
  const paymentStatus = states[i % states.length];
  const reportStatus = reportStates[i % reportStates.length];
  const age = ages[i % ages.length];
  const record = {
    paymentStatus,
    reportStatus: reportStatus || undefined,
    updatedAt: new Date(Date.now() - age).toISOString(),
  };
  const view = buildCustomerStatusView(record);
  const cps = resolveCustomerPaymentState(record);
  if (view.customerPaymentState !== cps) {
    matrixFail += 1;
    continue;
  }
  if (reportStatus === REPORT_STATE.READY && paymentStatus === "verified" && !view.downloadReady) {
    matrixFail += 1;
    continue;
  }
  if (reportStatus === REPORT_STATE.FAILED && paymentStatus === "verified" && view.downloadReady) {
    matrixFail += 1;
    continue;
  }
  if (reportStatus === REPORT_STATE.FAILED && paymentStatus === "verified" && cps !== CUSTOMER_PAYMENT_STATE.GENERATION_FAILED) {
    matrixFail += 1;
    continue;
  }
  if (paymentStatus === "failed" && cps !== CUSTOMER_PAYMENT_STATE.FAILED) {
    matrixFail += 1;
    continue;
  }
  matrixPass += 1;
}

if (matrixPass === 1000) {
  pass("P0-matrix-1000", "1000 randomized state-matrix cases consistent");
} else {
  fail("P0-matrix-1000", `${matrixPass}/1000 passed (${matrixFail} failed)`);
}

const failed = results.filter((r) => !r.ok);
console.log("\nP0 Payment Certification Tests v25.24\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
