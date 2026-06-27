#!/usr/bin/env node
/**
 * Launch hardening v25.3 — Razorpay-only + enterprise gate
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  countWorkItems,
  validateUploadStructure,
  parseUploadContent,
} from "../api/lib/report-engine.js";
import {
  isEnterpriseGated,
  assertSelfServeAllowed,
  rejectClientPricingTamper,
  ENTERPRISE_STATUS,
  enterpriseStatusLabel,
} from "../api/lib/enterprise-gate-rules.js";
import { detectPlanTier, ENTERPRISE_GATE_WORK_ITEMS } from "../api/lib/assessment-config.js";
import { buildOrderQuote } from "../api/lib/pricing.js";
import { getActivePaymentProvider, listPaymentProviders } from "../api/lib/payment-provider.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

const headers = ["Issue Key", "Summary", "Description", "Issue Type", "Status", "Project"];
function makeRecords(count) {
  return Array.from({ length: count }, (_, i) => ({
    "Issue Key": `P-${i + 1}`,
    Summary: `Item ${i}`,
    Description: "Desc",
    "Issue Type": "Story",
    Status: "Open",
    Project: "Alpha",
  }));
}

for (const n of [50, 500, 1000]) {
  const m = countWorkItems(makeRecords(n), headers);
  if (m.totalWorkItems === n && !m.enterpriseGate) pass(`LH-self-${n}`, `${n} items self-service`);
  else fail(`LH-self-${n}`, JSON.stringify(m));
}

for (const n of [1001, 5000]) {
  const m = countWorkItems(makeRecords(n), headers);
  if (m.totalWorkItems === n && m.enterpriseGate) pass(`LH-ent-${n}`, `${n} items enterprise gate`);
  else fail(`LH-ent-${n}`, JSON.stringify(m));
}

const dup = makeRecords(100).map((r, i) => (i < 10 ? { ...r, "Issue Key": "P-DUP" } : r));
const dm = countWorkItems(dup, headers);
if (dm.duplicateRecords === 9) pass("LH-duplicates", "Duplicate keys detected");
else fail("LH-duplicates", JSON.stringify(dm));

const tamper = rejectClientPricingTamper({ taskCount: 50, priceMinor: 100, amount: 1 });
if (tamper === "taskCount" || tamper === "amount") pass("LH-tamper-count", "Client task count rejected");
else fail("LH-tamper-count", String(tamper));

const tamperPrice = rejectClientPricingTamper({ totalMinor: 1, planTier: "starter" });
if (tamperPrice === "totalMinor" || tamperPrice === "planTier") pass("LH-tamper-price", "Client price rejected");
else fail("LH-tamper-price", String(tamperPrice));

const providers = listPaymentProviders();
if (providers.length === 1 && providers[0] === "razorpay") pass("LH-razorpay-only", "Single provider Razorpay");
else fail("LH-razorpay-only", JSON.stringify(providers));

if (getActivePaymentProvider() === "razorpay") pass("LH-active-provider", "Active provider razorpay");
else fail("LH-active-provider", getActivePaymentProvider());

const entQuote = buildOrderQuote("enterprise", "INR");
if (!entQuote.checkoutAvailable) pass("LH-no-ent-checkout", "Enterprise plan no checkout");
else fail("LH-no-ent-checkout", "Should block");

const starterQuote = buildOrderQuote("starter", "INR");
if (starterQuote.checkoutAvailable && starterQuote.totalMinor > 0) pass("LH-starter-quote", "Starter quote OK");
else fail("LH-starter-quote", JSON.stringify(starterQuote));

if (ENTERPRISE_STATUS.SALES_REVIEW_PENDING === "sales_review_pending") pass("LH-status", "Enterprise status constant");
else fail("LH-status", ENTERPRISE_STATUS.SALES_REVIEW_PENDING);

if (enterpriseStatusLabel(ENTERPRISE_STATUS.SALES_REVIEW_PENDING).includes("review")) {
  pass("LH-status-label", "Status label human readable");
} else fail("LH-status-label", enterpriseStatusLabel(ENTERPRISE_STATUS.SALES_REVIEW_PENDING));

if (ENTERPRISE_GATE_WORK_ITEMS === 1000) pass("LH-threshold", "Threshold 1000");
else fail("LH-threshold", String(ENTERPRISE_GATE_WORK_ITEMS));

const stripeFiles = [
  "api/create-stripe-checkout.js",
  "api/stripe-webhook.js",
  "api/lib/stripe-client.js",
];
for (const f of stripeFiles) {
  if (!fs.existsSync(path.join(root, f))) pass("LH-no-stripe-" + f, "Stripe removed");
  else fail("LH-no-stripe-" + f, "Stripe file still present");
}

for (const f of [
  "api/lib/enterprise-gate-rules.js",
  "api/lib/enterprise-gate.js",
  "api/enterprise-request-status.js",
  "api/admin-enterprise-requests.js",
  "admin.html",
  "assets/js/admin-portal.js",
]) {
  if (fs.existsSync(path.join(root, f))) pass("LH-file-" + f, "Present");
  else fail("LH-file-" + f, "Missing");
}

const guided = fs.readFileSync(path.join(root, "assets/js/guided-assessment.js"), "utf8");
if (guided.includes("Secure Checkout") && !guided.includes("Pay with Razorpay")) {
  pass("LH-secure-checkout-copy", "Secure Checkout wording");
} else fail("LH-secure-checkout-copy", "Copy check failed");

const failed = results.filter((r) => !r.ok);
console.log("\nLaunch Hardening v25.3 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
