#!/usr/bin/env node
/** v25.8 production resilience tests */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

const pricing = fs.readFileSync(path.join(root, "pricing.html"), "utf8");
const faq = fs.readFileSync(path.join(root, "faq.html"), "utf8");
const guided = fs.readFileSync(path.join(root, "assets/js/guided-assessment.js"), "utf8");
const assessment = fs.readFileSync(path.join(root, "assessment.html"), "utf8");
const sampleReport = fs.readFileSync(path.join(root, "sample-report.html"), "utf8");

if (!pricing.includes("over 50 work items") && !pricing.includes("Uploads over 50")) {
  pass("CJ-faq-threshold", "Pricing FAQ aligned with 1000 gate");
} else fail("CJ-faq-threshold", "Stale 50-item enterprise copy in pricing");

if (pricing.includes("Secure Checkout") && pricing.includes("aria-current")) {
  pass("CJ-wizard-a11y", "Wizard steps use Secure Checkout + aria-current");
} else fail("CJ-wizard-a11y", "Wizard a11y/copy");

if (assessment.includes("pricing.html#assessment-wizard")) pass("CJ-assessment-redirect", "assessment.html redirects");
else fail("CJ-assessment-redirect", "Stale assessment page");

if (sampleReport.includes("sample-governance-report")) pass("CJ-sample-report", "sample-report redirects");
else fail("CJ-sample-report", "Dead sample-report page");

if (fs.existsSync(path.join(root, "sample-files.html"))) pass("CJ-sample-guide", "Sample files guide exists");
else fail("CJ-sample-guide", "Missing sample-files.html");

if (guided.includes("window.alert") === false) pass("CJ-no-alert", "No window.alert in wizard");
else fail("CJ-no-alert", "Alert fallback remains");

if (guided.includes("Expected response")) pass("CJ-enterprise-warmth", "Enterprise expected response time");
else fail("CJ-enterprise-warmth", "Missing enterprise warmth copy");

const engine = fs.readFileSync(path.join(root, "api/lib/report-engine.js"), "utf8");
if (engine.includes("couldn't be processed")) pass("CJ-friendly-errors", "Human-friendly upload errors");
else fail("CJ-friendly-errors", "Technical upload errors");

const health = fs.readFileSync(path.join(root, "api/health.js"), "utf8");
if (health.includes('"25.22"')) pass("CJ-version", "Health v25.22");
else fail("CJ-version", "Version mismatch");

const trust = fs.readFileSync(path.join(root, "trust-center.html"), "utf8");
if (trust.includes("Confidential upload handling") && trust.includes("legal-nav")) pass("CJ-trust-center", "Trust Center enterprise copy");
else fail("CJ-trust-center", "Trust Center weak");

const features = fs.readFileSync(path.join(root, "features.html"), "utf8");
if (features.includes("site-footer") && features.includes("audit trail")) pass("CJ-features", "Features page enterprise chrome");
else fail("CJ-features", "Features incomplete");

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
if (index.includes('id="company"') && index.includes("Who this is not for")) pass("CJ-company", "Company presence section");
else fail("CJ-company", "Missing company section");

if (pricing.includes("commercial-clarity") && pricing.includes("Included deliverables")) pass("CJ-commercial", "Commercial clarity panel");
else fail("CJ-commercial", "Missing commercial clarity");

if (fs.existsSync(path.join(root, "assets/js/site-nav.js"))) pass("CJ-site-nav", "External nav script for CSP");
else fail("CJ-site-nav", "missing site-nav.js");

if (fs.existsSync(path.join(root, "assets/js/starter-success.js"))) pass("CJ-starter-success-ext", "External payment success script");
else fail("CJ-starter-success-ext", "missing");

if (pricing.includes("sx-progress-bar") && pricing.includes("sx-journey-banner")) {
  pass("CJ-ux-progress", "Wizard progress + journey banner");
} else fail("CJ-ux-progress", "Missing UX progress guidance");

if (pricing.includes("sx-dropzone")) pass("CJ-ux-upload", "Drag-drop upload zone");
else fail("CJ-ux-upload", "Plain upload button only");

if (index.includes("sx-home-journey")) pass("CJ-ux-home-journey", "Homepage journey strip");
else fail("CJ-ux-home-journey", "Missing home journey");

if (fs.existsSync(path.join(root, "assets/js/starter-experience.js"))) pass("CJ-ux-layer", "Starter experience layer");
else fail("CJ-ux-layer", "Missing starter-experience.js");

if (
  pricing.includes("Website vs Atlassian Marketplace") &&
  pricing.includes("Executive Governance Assessment") &&
  pricing.includes("Continuous AI Governance inside Jira")
) {
  pass("CJ-marketplace-boundary", "Website vs Marketplace commercial boundary");
} else fail("CJ-marketplace-boundary", "Missing marketplace separation copy");

const failed = results.filter((r) => !r.ok);
console.log("\nCustomer Journey v25.14 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
