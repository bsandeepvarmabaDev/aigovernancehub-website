#!/usr/bin/env node
/**
 * Enterprise gate P0 — automated tests
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
  generateSecureReference,
} from "../api/lib/enterprise-gate-rules.js";
import {
  createEnterprisePayToken,
  validateEnterprisePayToken,
  createSessionToken,
} from "../api/lib/tokens.js";
import { detectPlanTier, ENTERPRISE_GATE_WORK_ITEMS } from "../api/lib/assessment-config.js";
import { buildOrderQuote } from "../api/lib/pricing.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) {
  results.push({ id, ok: true, msg });
}
function fail(id, msg) {
  results.push({ id, ok: false, msg });
}

const headers = [
  "Issue Key",
  "Summary",
  "Description",
  "Issue Type",
  "Status",
  "Project",
];

function makeRecords(count, duplicateKeys = 0) {
  const records = [];
  for (let i = 0; i < count; i += 1) {
    const keyNum = i < duplicateKeys ? 1 : i + 1;
    records.push({
      "Issue Key": `PROJ-${keyNum}`,
      Summary: `Item ${i}`,
      Description: "Test description",
      "Issue Type": "Story",
      Status: "Open",
      Project: i % 5 === 0 ? "Alpha" : "Beta",
    });
  }
  return records;
}

const small = makeRecords(50);
const smallMetrics = countWorkItems(small, headers);
if (smallMetrics.totalWorkItems === 50 && !smallMetrics.enterpriseGate) {
  pass("G1-count-small", "50 items not gated");
} else fail("G1-count-small", JSON.stringify(smallMetrics));

const large = makeRecords(1001);
const largeMetrics = countWorkItems(large, headers);
if (largeMetrics.totalWorkItems === 1001 && largeMetrics.enterpriseGate) {
  pass("G2-count-gate", ">1000 triggers enterprise gate");
} else fail("G2-count-gate", JSON.stringify(largeMetrics));

const dupes = makeRecords(100, 10);
const dupeMetrics = countWorkItems(dupes, headers);
if (dupeMetrics.duplicateRecords === 9 && dupeMetrics.uniqueWorkItems === 91) {
  pass("G3-duplicates", "Duplicate detection works");
} else fail("G3-duplicates", JSON.stringify(dupeMetrics));

if (dupeMetrics.projectCount === 2) pass("G4-projects", "Project count");
else fail("G4-projects", String(dupeMetrics.projectCount));

const planLarge = detectPlanTier(1001, 2, 1000);
if (planLarge.id === "enterprise" && !planLarge.selfServe) {
  pass("G5-plan-tier", "Plan tier enterprise for >1000");
} else fail("G5-plan-tier", planLarge.id);

const csvLines = [headers.join(",")];
for (let i = 0; i < 1002; i += 1) {
  csvLines.push(
    `KEY-${i},Summary ${i},Desc,Story,Open,Proj${i % 3},High,,,user@test.com,user@test.com,`
  );
}
const csvBuffer = Buffer.from(csvLines.join("\n"), "utf8");
const parsed = parseUploadContent("large.csv", csvBuffer);
const structure = validateUploadStructure(parsed, csvBuffer.length, csvLines.join("\n"), "csv");
if (structure.compatibility.enterpriseGate && !structure.selfServe) {
  pass("G6-validate-structure", "validateUploadStructure gates >1000");
} else fail("G6-validate-structure", JSON.stringify({ gate: structure.compatibility.enterpriseGate, selfServe: structure.selfServe }));

const selfServeSession = {
  workItemMetrics: { totalWorkItems: 100, uniqueWorkItems: 100, duplicateRecords: 0, projectCount: 1 },
  enterpriseGate: false,
  selfServeAllowed: true,
  planTier: "starter",
};
if (assertSelfServeAllowed(selfServeSession).allowed) pass("G7-self-serve-ok", "Self-serve allowed");
else fail("G7-self-serve-ok", "Blocked incorrectly");

const gatedSession = {
  workItemMetrics: { totalWorkItems: 1500, uniqueWorkItems: 1500, duplicateRecords: 0, projectCount: 2 },
  enterpriseGate: true,
  selfServeAllowed: false,
  planTier: "enterprise",
};
const gateBlock = assertSelfServeAllowed(gatedSession);
if (!gateBlock.allowed && gateBlock.enterpriseGate) pass("G8-self-serve-block", "Enterprise blocked");
else fail("G8-self-serve-block", JSON.stringify(gateBlock));

const enterpriseQuote = buildOrderQuote("enterprise", "INR");
if (!enterpriseQuote.checkoutAvailable) pass("G9-no-enterprise-quote", "No self-serve enterprise quote");
else fail("G9-no-enterprise-quote", "Quote should be blocked");

const secret = "test-secret-key-for-enterprise-gate-tests";
process.env.ENTERPRISE_TOKEN_SECRET = secret;
process.env.RAZORPAY_KEY_SECRET = secret;
const payToken = createEnterprisePayToken("sess-1", "order_1", null);
const payValid = validateEnterprisePayToken(payToken, null);
if (payValid && payValid.sessionId === "sess-1" && payValid.orderId === "order_1") {
  pass("G10-pay-token", "Enterprise pay token round-trip");
} else fail("G10-pay-token", "Token invalid");

const ref = generateSecureReference("abcdef12-3456-7890-abcd-ef1234567890");
if (ref.startsWith("ENT-")) pass("G11-secure-ref", "Secure reference format");
else fail("G11-secure-ref", ref);

if (ENTERPRISE_GATE_WORK_ITEMS === 1000) pass("G12-threshold", "Gate threshold is 1000");
else fail("G12-threshold", String(ENTERPRISE_GATE_WORK_ITEMS));

for (const f of [
  "api/lib/enterprise-gate.js",
  "api/enterprise-sales-request.js",
  "api/enterprise-checkout.js",
  "api/enterprise-request-status.js",
  "api/admin-enterprise-requests.js",
  "assets/js/enterprise-checkout.js",
  "enterprise-checkout.html",
  "admin.html",
]) {
  if (fs.existsSync(path.join(root, f))) pass("FILE-" + f, "Present");
  else fail("FILE-" + f, "Missing");
}

const failed = results.filter((r) => !r.ok);
console.log("\nEnterprise Gate P0 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
