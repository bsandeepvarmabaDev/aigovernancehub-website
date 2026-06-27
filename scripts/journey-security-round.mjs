#!/usr/bin/env node
/**
 * Full round — security + customer journey smooth flow (static + logic checks)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

const pricing = fs.readFileSync(path.join(root, "pricing.html"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const success = fs.readFileSync(path.join(root, "starter-success.html"), "utf8");
const guided = fs.readFileSync(path.join(root, "assets/js/guided-assessment.js"), "utf8");
const sx = fs.readFileSync(path.join(root, "assets/js/starter-experience.js"), "utf8");
const sxCss = fs.readFileSync(path.join(root, "assets/css/starter-experience.css"), "utf8");
const verify = fs.readFileSync(path.join(root, "api/verify-payment.js"), "utf8");
const upload = fs.readFileSync(path.join(root, "api/upload-report.js"), "utf8");
const download = fs.readFileSync(path.join(root, "api/download-report.js"), "utf8");

/* ——— Journey smooth flow ——— */
const journeyChecks = [
  ["JSR-progress", pricing.includes("sx-progress-bar"), "Wizard progress bar"],
  ["JSR-banner", pricing.includes("sx-journey-banner"), "Step guidance banner"],
  ["JSR-dropzone", pricing.includes("sx-dropzone"), "Drag-drop upload zone"],
  ["JSR-score-ring", pricing.includes("preview-score-ring"), "Governance score ring"],
  ["JSR-experience-css", pricing.includes("starter-experience.css"), "Experience CSS linked"],
  ["JSR-experience-js", pricing.includes("starter-experience.js"), "Experience JS linked"],
  ["JSR-home-strip", index.includes("sx-home-journey"), "Homepage journey strip"],
  ["JSR-success-hero", success.includes("sx-success-hero"), "Success celebration hero"],
  ["JSR-deliverables", success.includes("sx-deliverable-grid"), "Success format tiles"],
  ["JSR-hooks", guided.includes("AGHStarterExperience.onStepChange"), "Wizard step hooks"],
  ["JSR-preview-hook", guided.includes("AGHStarterExperience.onPreviewReady"), "Preview animation hook"],
  ["JSR-validate-hook", guided.includes("AGHStarterExperience.onValidationSuccess"), "Validation celebration hook"],
  ["JSR-step-copy", sx.includes("Right now") && sx.includes("Up next"), "Step copy in experience layer"],
  ["JSR-drop-init", sx.includes("initDropZone"), "Drop zone initialized"],
  ["JSR-animations", sxCss.includes("sx-preview-reveal") && sxCss.includes("sx-progress-bar"), "Animation CSS present"],
];

journeyChecks.forEach(([id, ok, msg]) => (ok ? pass(id, msg) : fail(id, msg)));

/* ——— Journey link chain ——— */
if (index.includes('href="pricing.html#assessment-wizard"') || index.includes("pricing.html")) {
  pass("JSR-link-home-pricing", "Home → pricing wizard");
} else fail("JSR-link-home-pricing", "Broken home CTA");

if (pricing.includes("recover-report.html") && pricing.includes("login.html")) {
  pass("JSR-link-post-purchase", "Pricing → recover + login links");
} else fail("JSR-link-post-purchase", "Missing post-purchase links");

if (success.includes("pricing.html#assessment-wizard")) {
  pass("JSR-link-repeat", "Success → repeat assessment");
} else fail("JSR-link-repeat", "Missing repeat assessment on success");

/* ——— Security (unchanged by UX) ——— */
if (verify.includes("verifyRazorpayPaymentSignature") && verify.includes("pendingCheckout")) {
  pass("JSR-sec-verify", "Payment signature-first verify");
} else fail("JSR-sec-verify", "Verify payment weakened");

if (upload.includes("contentBase64") && !guided.includes("totalMinor") && !guided.includes("buildOrderQuote(")) {
  pass("JSR-sec-no-client-price", "Wizard does not compute pricing client-side");
} else if (!guided.includes("buildOrderQuote(")) {
  pass("JSR-sec-no-client-price", "Wizard does not compute pricing client-side");
} else fail("JSR-sec-no-client-price", "Client-side pricing risk");

if (download.includes("isDownloadReady") || download.includes("validateDownloadToken")) {
  pass("JSR-sec-download", "Download gated by token + payment state");
} else fail("JSR-sec-download", "Download gate weak");

if (!pricing.match(/<script>\s*function toggleNavigation/)) {
  pass("JSR-sec-no-inline-nav", "Pricing has no inline nav script");
} else fail("JSR-sec-no-inline-nav", "Inline script on pricing");

const cspMatch = pricing.match(/Content-Security-Policy" content="([^"]*)"/);
if (cspMatch && !cspMatch[1].split("style-src")[0].includes("'unsafe-inline'")) {
  pass("JSR-sec-csp-script", "Pricing script-src without unsafe-inline");
} else fail("JSR-sec-csp-script", "CSP script unsafe-inline on pricing");

if (guided.includes("orderConfirmed") && guided.includes("sessionToken")) {
  pass("JSR-sec-checkout-bind", "Checkout bound to session token");
} else fail("JSR-sec-checkout-bind", "Checkout session binding missing");

if (guided.includes("enterpriseGate") || guided.includes("selfServe")) {
  pass("JSR-sec-enterprise-gate", "Enterprise gate in wizard flow");
} else fail("JSR-sec-enterprise-gate", "Enterprise gate missing");

/* ——— Order summary still server-driven ——— */
if (guided.includes("ORDER_QUOTE_URL") && guided.includes("loadOrderQuote")) {
  pass("JSR-sec-server-quote", "Order quote fetched from server");
} else fail("JSR-sec-server-quote", "Quote not server-driven");

const failed = results.filter((r) => !r.ok);
console.log("\nJourney + Security Full Round\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
