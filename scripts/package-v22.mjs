#!/usr/bin/env node
/**
 * Package aigovernancehub-website v22.0 as ZIP (excludes node_modules)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outZip = path.join(root, "aigovernancehub-website-v22.0.zip");

const exclude = new Set(["node_modules", ".env", ".env.local", ".vercel", "aigovernancehub-website-v22.0.zip"]);

function shouldInclude(rel) {
  const parts = rel.split(/[/\\]/);
  return !parts.some((p) => exclude.has(p));
}

function collectFiles(dir, base = "") {
  const entries = [];
  for (const name of fs.readdirSync(dir)) {
    const rel = base ? `${base}/${name}` : name;
    if (!shouldInclude(rel)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      entries.push(...collectFiles(full, rel));
    } else {
      entries.push({ rel, full });
    }
  }
  return entries;
}

// Use PowerShell Compress-Archive on Windows
const staging = path.join(root, ".v22-staging");
if (fs.existsSync(staging)) {
  fs.rmSync(staging, { recursive: true, force: true });
}
fs.mkdirSync(staging, { recursive: true });

const files = collectFiles(root);
for (const f of files) {
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
