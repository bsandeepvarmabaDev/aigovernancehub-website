#!/usr/bin/env node
/** Staging environment validation — v25.10 / v25.13 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "ADMIN_API_KEY",
  "SITE_URL",
];

const PURPOSE_SECRETS = [
  "SESSION_TOKEN_SECRET",
  "DOWNLOAD_TOKEN_SECRET",
  "RECOVERY_TOKEN_SECRET",
  "AUTH_TOKEN_SECRET",
  "ENTERPRISE_TOKEN_SECRET",
  "RATE_LIMIT_SECRET",
];

const SMTP_ANY = ["SMTP_HOST", "ZOHO_SMTP_HOST", "EMAIL_SMTP_HOST"];

function present(name) {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

const missing = REQUIRED.filter((k) => !present(k));
const smtpOk = SMTP_ANY.some(present);
const purposeMissing = PURPOSE_SECRETS.filter((k) => !present(k));

console.log("\nStaging Environment Check — v25.13\n");

if (missing.length === 0) passBlock("Required core vars", REQUIRED);
else {
  console.log("FAIL Required core vars missing:", missing.join(", "));
}

if (smtpOk) console.log("PASS SMTP — at least one SMTP host configured");
else console.log("WARN SMTP — configure SMTP_HOST or ZOHO_SMTP_HOST for email delivery");

if (purposeMissing.length === 0) {
  console.log("PASS Purpose-specific token secrets — all configured");
} else if (purposeMissing.length === PURPOSE_SECRETS.length && present("APP_SIGNING_SECRET")) {
  console.log("WARN Purpose secrets — using APP_SIGNING_SECRET fallback (configure per-purpose for production)");
} else if (purposeMissing.length < PURPOSE_SECRETS.length) {
  console.log("WARN Partial purpose secrets — missing:", purposeMissing.join(", "));
} else {
  console.log("FAIL Purpose secrets — set per-purpose secrets or APP_SIGNING_SECRET");
}

const vercelJson = path.join(root, "vercel.json");
if (fs.existsSync(vercelJson)) console.log("PASS vercel.json present");
else console.log("WARN vercel.json missing");

function passBlock(label, keys) {
  console.log(`PASS ${label}:`, keys.join(", "));
}

const exitCode = missing.length > 0 ? 1 : 0;
console.log(exitCode === 0 ? "\nEnvironment check PASSED\n" : "\nEnvironment check FAILED\n");
process.exit(exitCode);
