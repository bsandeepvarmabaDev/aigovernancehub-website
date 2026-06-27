#!/usr/bin/env node
/** Run all production readiness test suites — v25.14 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const suites = [
  "enterprise-gate-test.mjs",
  "launch-hardening-test.mjs",
  "customer-journey-test.mjs",
  "payment-architecture-test.mjs",
  "production-audit-test.mjs",
  "resilience-test.mjs",
  "v25-workspace-test.mjs",
  "v22-report-quality-test.mjs",
  "operations-test.mjs",
  "staging-validation-test.mjs",
  "security-fix-test.mjs",
  "performance-smoke-test.mjs",
  "csp-hardening-test.mjs",
  "accessibility-test.mjs",
  "business-language-test.mjs",
  "business-excellence-test.mjs",
  "journey-security-round.mjs",
];

let failed = 0;
console.log("\n=== AI Governance Hub — Full Test Run v25.14 ===\n");

for (const suite of suites) {
  const script = path.join(root, "scripts", suite);
  console.log(`--- ${suite} ---`);
  const r = spawnSync(process.execPath, [script], { cwd: root, stdio: "inherit", env: process.env });
  if (r.status !== 0) failed += 1;
  console.log("");
}

console.log(`\n=== Summary ===`);
if (failed === 0) {
  console.log(`ALL ${suites.length} SUITES PASSED\n`);
  process.exit(0);
}
console.log(`${failed}/${suites.length} SUITE(S) FAILED\n`);
process.exit(1);
