#!/usr/bin/env node
/** Package AI Governance Hub website v25.15 — executive buyer review */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outZip = path.join(root, "aigovernancehub-website-v25.15-executive-buyer-review.zip");
const exclude = new Set([
  "node_modules", ".env", ".env.local", ".vercel",
  ".v25.15-staging", "certification-v25", "certification-final-v25",
]);

function shouldInclude(rel) {
  if (rel.endsWith(".zip")) return false;
  return !rel.split(/[/\\]/).some((p) => exclude.has(p));
}
function collectFiles(dir, base = "") {
  const entries = [];
  for (const name of fs.readdirSync(dir)) {
    const rel = base ? `${base}/${name}` : name;
    if (!shouldInclude(rel)) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) entries.push(...collectFiles(full, rel));
    else entries.push({ rel, full });
  }
  return entries;
}

const staging = path.join(root, ".v25.15-staging");
if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });
for (const f of collectFiles(root)) {
  const dest = path.join(staging, f.rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(f.full, dest);
}
if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
try {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${staging.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
    { stdio: "inherit" }
  );
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
console.log(`Created: ${outZip}`);
