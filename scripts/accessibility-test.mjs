#!/usr/bin/env node
/** Accessibility static validation — v25.14 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

const keyPages = [
  "index.html", "pricing.html", "faq.html", "dashboard.html", "admin.html",
  "recover-report.html", "login.html", "starter-success.html", "payment-pending.html",
  "thank-you.html", "features.html", "sample-files.html", "refund-policy.html",
];

for (const rel of keyPages) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    fail(`A11Y-exists-${rel}`, "missing");
    continue;
  }
  const html = fs.readFileSync(p, "utf8");
  if (html.includes('class="skip-link"') || html.includes("skip-link")) {
    pass(`A11Y-skip-${rel}`, "Skip link present");
  } else {
    fail(`A11Y-skip-${rel}`, "No skip link");
  }
  if (html.includes('lang="en"')) pass(`A11Y-lang-${rel}`, "lang=en");
  else fail(`A11Y-lang-${rel}`, "missing lang");
}

const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
if (styles.includes(":focus-visible")) pass("A11Y-focus-visible", "Focus-visible styles defined");
else fail("A11Y-focus-visible", "missing");

const guided = fs.readFileSync(path.join(root, "assets/js/guided-assessment.js"), "utf8");
if (guided.includes("aria-live") || guided.includes("aria-busy")) pass("A11Y-wizard-live", "Wizard ARIA live regions");
else fail("A11Y-wizard-live", "missing");

const admin = fs.readFileSync(path.join(root, "admin.html"), "utf8");
if (admin.includes('for="admin-key"') && admin.includes("aria-live")) pass("A11Y-admin", "Admin labels + live region");
else fail("A11Y-admin", "incomplete");

const nav = fs.readFileSync(path.join(root, "assets/js/site-nav.js"), "utf8");
if (nav.includes("aria-expanded") && nav.includes("Escape")) pass("A11Y-nav-keyboard", "Nav keyboard support");
else fail("A11Y-nav-keyboard", "weak");

const recover = fs.readFileSync(path.join(root, "assets/js/recover-report.js"), "utf8");
if (recover.includes("tabindex") && recover.includes("focus")) pass("A11Y-recover-focus", "Recover focus management");
else fail("A11Y-recover-focus", "missing");

const success = fs.readFileSync(path.join(root, "assets/js/starter-success.js"), "utf8");
if (success.includes("focusVerifiedHeading")) pass("A11Y-success-focus", "Success page focus move");
else fail("A11Y-success-focus", "missing");

const failed = results.filter((r) => !r.ok);
console.log("\nAccessibility v25.14 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
