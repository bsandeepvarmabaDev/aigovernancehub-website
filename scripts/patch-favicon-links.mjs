#!/usr/bin/env node
/** Inject favicon + OG tags into HTML pages missing them. */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".vercel") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

function assetPrefix(fromDir) {
  const depth = relative(root, fromDir).split(/[/\\]/).filter(Boolean).length;
  return depth ? "../".repeat(depth) : "";
}

const brandBlock = (prefix) =>
  `  <link rel="icon" href="${prefix}favicon.ico" sizes="any" />\n` +
  `  <link rel="icon" href="${prefix}favicon.png" type="image/png" />\n` +
  `  <link rel="apple-touch-icon" href="${prefix}apple-touch-icon.png" />\n` +
  `  <meta property="og:image" content="https://aigovernancehub.ai/images/agh-logo-primary.png" />\n` +
  `  <meta name="twitter:card" content="summary_large_image" />\n` +
  `  <meta name="twitter:image" content="https://aigovernancehub.ai/images/agh-logo-primary.png" />\n`;

let patched = 0;
for (const file of walk(root)) {
  let html = readFileSync(file, "utf8");
  if (html.includes("favicon.ico")) continue;
  const prefix = assetPrefix(dirname(file));
  const block = brandBlock(prefix);
  if (html.includes("<head>")) {
    html = html.replace("<head>", "<head>\n" + block);
  } else if (html.match(/<head[^>]*>/)) {
    html = html.replace(/<head[^>]*>/, (m) => m + "\n" + block);
  } else continue;
  writeFileSync(file, html);
  patched++;
  console.log("patched", relative(root, file));
}
console.log("Done.", patched, "files patched");
