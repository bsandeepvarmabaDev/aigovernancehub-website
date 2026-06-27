#!/usr/bin/env node
/** Business excellence & enterprise operations — v25.22 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const pricing = fs.readFileSync(path.join(root, "pricing.html"), "utf8");
const procurement = fs.readFileSync(path.join(root, "enterprise-procurement.html"), "utf8");
const support = fs.readFileSync(path.join(root, "support.html"), "utf8");

if (index.includes("be-product-split") && index.includes("Executive Governance Assessment")) {
  pass("BE-product-split", "Homepage dual-product clarity");
} else fail("BE-product-split", "missing product split");

if (pricing.includes("id=\"enterprise-buying\"") && pricing.includes("How do I get an invoice")) {
  pass("BE-enterprise-buying", "Enterprise buying FAQ on pricing");
} else fail("BE-enterprise-buying", "missing enterprise buying");

if (procurement.includes("be-sales-path") && procurement.includes("Marketplace")) {
  pass("BE-sales-workflow", "Enterprise sales workflow documented");
} else fail("BE-sales-workflow", "missing sales path");

if (support.includes("After you purchase")) {
  pass("BE-customer-success-support", "Post-purchase clarity on support");
} else fail("BE-customer-success-support", "missing after-purchase");

if (fs.existsSync(path.join(root, "assets/css/business-excellence.css"))) {
  pass("BE-css", "business-excellence.css present");
} else fail("BE-css", "missing css");

const security = fs.readFileSync(path.join(root, "api/lib/security.js"), "utf8");
if (security.includes("default-src 'none'") && security.includes("Cross-Origin-Opener-Policy")) {
  pass("BE-security-intact", "API security headers unchanged");
} else fail("BE-security-intact", "security regression risk");

if (pricing.includes("Executive Governance Assessment") && pricing.includes("Continuous AI Governance inside Jira")) {
  pass("BE-marketplace-language", "P2 marketplace vs website labels");
} else fail("BE-marketplace-language", "marketplace labels missing");

console.log("\nBusiness Excellence v25.22 Tests\n");
for (const r of results) {
  console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed\n`);
process.exit(failed ? 1 : 0);
