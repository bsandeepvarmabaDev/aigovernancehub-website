#!/usr/bin/env node
/** Apply CSP v25.14 — remove unsafe-inline from script-src across HTML files */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === "node_modules") continue;
      walk(full, files);
    } else if (name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

const NAV_INLINE = /<script>\s*function toggleNavigation\(\)[\s\S]*?<\/script>\s*/g;
const NAV_ONCLICK = /\s*onclick="toggleNavigation\(\)"/g;

const STANDARD_CSP =
  "default-src 'self'; script-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:";

const RAZORPAY_CSP =
  "default-src 'self'; script-src 'self' https://checkout.razorpay.com; connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.razorpay.com; frame-src https://api.razorpay.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:";

const INDEX_CSP =
  "default-src 'self'; script-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://i.ytimg.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:";

let updated = 0;
for (const file of walk(root)) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  html = html.replace(NAV_INLINE, "");
  html = html.replace(NAV_ONCLICK, "");

  if (html.includes('class="nav-toggle"') && !html.includes("site-nav.js")) {
    const navScript = file.includes(`${path.sep}docs${path.sep}`)
      ? '  <script src="../assets/js/site-nav.js" defer></script>\n'
      : '  <script src="assets/js/site-nav.js" defer></script>\n';
    html = html.replace(/<\/body>/i, navScript + "</body>");
  }

  if (path.basename(file) === "starter-success.html") {
    html = html.replace(/\n  <script>\s*\(function \(\)[\s\S]*?<\/script>/, "");
    if (!html.includes("starter-success.js")) {
      html = html.replace(
        '<script src="assets/js/enterprise-ux.js" defer></script>',
        '<script src="assets/js/enterprise-ux.js" defer></script>\n  <script src="assets/js/starter-success.js" defer></script>'
      );
    }
  }

  const base = path.basename(file);
  if (base === "index.html" && html.includes("Content-Security-Policy")) {
    html = html.replace(
      /<meta http-equiv="Content-Security-Policy" content="[^"]*">/,
      `<meta http-equiv="Content-Security-Policy" content="${INDEX_CSP}">`
    );
  } else if (["pricing.html", "enterprise-checkout.html"].includes(base)) {
    html = html.replace(
      /<meta http-equiv="Content-Security-Policy" content="[^"]*">/,
      `<meta http-equiv="Content-Security-Policy" content="${RAZORPAY_CSP}">`
    );
  } else if (html.includes("Content-Security-Policy") && !html.includes("checkout.razorpay.com")) {
    html = html.replace(
      /<meta http-equiv="Content-Security-Policy" content="[^"]*">/,
      `<meta http-equiv="Content-Security-Policy" content="${STANDARD_CSP}">`
    );
  }

  html = html.replace(/script-src 'self' 'unsafe-inline'/g, "script-src 'self'");

  if (!html.includes("Content-Security-Policy") && !file.includes("node_modules")) {
    const cspMeta = '  <meta http-equiv="Content-Security-Policy" content="' + STANDARD_CSP + '">\n';
    html = html.replace(/<meta name="viewport"[^>]*>\n/, (m) => m + cspMeta);
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    updated += 1;
    console.log("Updated:", path.relative(root, file));
  }
}
console.log(`\nCSP apply complete — ${updated} file(s) modified`);
