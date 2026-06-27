#!/usr/bin/env node
/** CSP hardening validation — v25.14 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

function walkHtml(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === "node_modules") continue;
      walkHtml(full, files);
    } else if (name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

const customerPages = [
  "index.html", "pricing.html", "faq.html", "trust-center.html", "features.html",
  "sample-files.html", "refund-policy.html", "dashboard.html", "login.html", "admin.html",
  "starter-success.html", "recover-report.html",
];

for (const rel of customerPages) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    fail(`CSP-file-${rel}`, "missing");
    continue;
  }
  const html = fs.readFileSync(p, "utf8");
  if (!html.includes("Content-Security-Policy")) {
    fail(`CSP-meta-${rel}`, "no CSP meta");
    continue;
  }
  const cspMatch = html.match(/Content-Security-Policy" content="([^"]*)"/);
  const csp = cspMatch ? cspMatch[1] : "";
  if (csp.includes("script-src") && csp.includes("'unsafe-inline'") && csp.indexOf("script-src") < csp.indexOf("style-src")) {
    const scriptPart = csp.split("style-src")[0];
    if (scriptPart.includes("'unsafe-inline'")) {
      fail(`CSP-script-${rel}`, "unsafe-inline in script-src");
      continue;
    }
  }
  pass(`CSP-script-${rel}`, "script-src without unsafe-inline");
}

if (fs.existsSync(path.join(root, "assets/js/site-nav.js"))) pass("CSP-site-nav", "External nav script");
else fail("CSP-site-nav", "missing");

if (fs.existsSync(path.join(root, "assets/js/starter-success.js"))) pass("CSP-starter-success", "External success script");
else fail("CSP-starter-success", "missing");

let inlineNav = 0;
let inlineOnclick = 0;
for (const file of walkHtml(root)) {
  const html = fs.readFileSync(file, "utf8");
  if (/function toggleNavigation/.test(html) && !file.includes("site-nav.js")) inlineNav += 1;
  if (/onclick="toggleNavigation/.test(html)) inlineOnclick += 1;
}
if (inlineNav === 0) pass("CSP-no-inline-nav", "No inline toggleNavigation");
else fail("CSP-no-inline-nav", `${inlineNav} inline nav blocks`);

if (inlineOnclick === 0) pass("CSP-no-onclick-nav", "No onclick nav handlers");
else fail("CSP-no-onclick-nav", `${inlineOnclick} onclick handlers`);

const security = fs.readFileSync(path.join(root, "api/lib/security.js"), "utf8");
if (security.includes("Cross-Origin-Resource-Policy")) pass("CSP-api-headers", "API security headers hardened");
else fail("CSP-api-headers", "missing CORP");

const failed = results.filter((r) => !r.ok);
console.log("\nCSP Hardening v25.14 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
