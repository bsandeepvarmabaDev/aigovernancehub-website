#!/usr/bin/env node
/**
 * Package AI Governance Hub website v26.0
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outZip = path.join(root, "aigovernancehub-website-v26.0.zip");
const exclude = new Set([
  "node_modules", ".env", ".env.local", ".vercel",
  "aigovernancehub-website-v22.0.zip", "aigovernancehub-website-v23.0.zip",
  "aigovernancehub-website-v24.0.zip", "aigovernancehub-website-v25.0.zip",
  "aigovernancehub-website-v25.3.zip", "aigovernancehub-website-v26.0.zip",
  ".v22-staging", ".v23-staging", ".v24-staging", ".v25-staging", ".v25.3-staging", ".v26-staging",
]);

function shouldInclude(rel) {
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

const staging = path.join(root, ".v26-staging");
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
