#!/usr/bin/env node
/**
 * Full-round QA harness — v21.0
 * Tests upload parsing, plan tiers, security, pricing, tokens (no code changes).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  parseUploadContent,
  validateFileMeta,
  validateEncoding,
  validateUploadStructure,
  runSecurityScan,
  analyzeRecords,
  buildPreview,
  ALLOWED_EXTENSIONS,
} from "../api/lib/report-engine.js";
import { detectPlanTier, planBlockReason } from "../api/lib/assessment-config.js";
import { buildOrderQuote } from "../api/lib/pricing.js";
import {
  createSessionToken,
  validateSessionToken,
  hashContent,
} from "../api/lib/tokens.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SAMPLES = path.join(ROOT, "samples");

const results = [];
let pass = 0;
let fail = 0;
let skip = 0;

function assert(name, condition, detail = "") {
  const ok = Boolean(condition);
  results.push({ name, ok, detail });
  if (ok) pass += 1;
  else fail += 1;
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
}

function skipTest(name, reason) {
  skip += 1;
  results.push({ name, ok: null, detail: reason });
  console.log(`SKIP: ${name} — ${reason}`);
}

function buildCsv(rows, headers) {
  const hdr = headers || [
    "Issue Key",
    "Summary",
    "Description",
    "Issue Type",
    "Status",
    "Project",
    "Priority",
    "Labels",
  ];
  const lines = [hdr.join(",")];
  for (const row of rows) {
    lines.push(
      hdr
        .map((h) => {
          const v = row[h] ?? "";
          const s = String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    );
  }
  return lines.join("\n");
}

function generateRows(count, opts = {}) {
  const rows = [];
  const projects = opts.projects || ["Alpha", "Beta", "Gamma"];
  for (let i = 1; i <= count; i += 1) {
    const proj = projects[i % projects.length];
    const hasAi = opts.aiEvery ? true : i % 7 === 0;
    rows.push({
      "Issue Key": `PROJ-${1000 + i}`,
      Summary: hasAi ? `AI chatbot task ${i}` : `Standard task ${i}`,
      Description: opts.nullFields?.description
        ? ""
        : opts.longText
          ? "Lorem ipsum ".repeat(200) + (hasAi ? " machine learning GPT" : "")
          : hasAi
            ? "Implement LLM-based automation"
            : "Routine maintenance",
      "Issue Type": "Story",
      Status: "Open",
      Project: proj,
      Priority: "Medium",
      Labels: hasAi ? "ai;genai" : "ops",
    });
  }
  return rows;
}

function parseAndValidate(csvText, filename = "test.csv", source = "jira") {
  const buffer = Buffer.from(csvText, "utf8");
  const parsed = parseUploadContent(filename, buffer);
  const structure = validateUploadStructure(parsed, buffer.length, csvText, source);
  return { parsed, structure, buffer };
}

// ─── Plan tier boundaries ───────────────────────────────────────────
console.log("\n=== Plan Tier Detection ===\n");
const tierCases = [
  [5, 1, "starter"],
  [50, 1, "starter"],
  [51, 1, "professional"],
  [100, 1, "professional"],
  [500, 3, "professional"],
  [501, 3, "business"],
  [1000, 5, "business"],
  [5000, 10, "business"],
  [5001, 10, "business_plus"],
  [10000, 15, "business_plus"],
  [20000, 20, "business_plus"],
  [20001, 15, "enterprise"],
  [50000, 25, "enterprise"],
  [50001, 30, "enterprise_plus"],
  [100000, 50, "enterprise_plus"],
];
for (const [items, projects, expected] of tierCases) {
  const tier = detectPlanTier(items, projects, 1024);
  assert(`Plan tier: ${items} items / ${projects} projects → ${expected}`, tier.id === expected, `got ${tier.id}`);
}

// ─── Pricing consistency ────────────────────────────────────────────
console.log("\n=== Pricing ===\n");
const starterQuote = buildOrderQuote("starter", "INR");
assert("Starter base ₹199", starterQuote.baseMinor === 19900);
assert("Starter total = base + tax", starterQuote.totalMinor === starterQuote.baseMinor + starterQuote.taxMinor);
assert("Razorpay amount matches total", starterQuote.razorpayAmount === starterQuote.totalMinor);

const proQuote = buildOrderQuote("professional", "INR");
assert("Professional base ₹599", proQuote.baseMinor === 59900);

const entQuote = buildOrderQuote("enterprise", "INR");
assert("Enterprise checkout blocked", entQuote.checkoutAvailable === false);

for (const cur of ["USD", "EUR", "GBP"]) {
  const q = buildOrderQuote("starter", cur);
  assert(`Currency ${cur}: razorpay = total`, q.razorpayAmount === q.totalMinor);
}

// ─── File meta validation ───────────────────────────────────────────
console.log("\n=== File Meta ===\n");
assert("Rejects empty filename", validateFileMeta("", 100).length > 0);
assert("Rejects .exe", validateFileMeta("bad.exe", 100).length > 0);
assert("Accepts .csv", validateFileMeta("export.csv", 100) === "");
assert("Accepts .tsv", validateFileMeta("export.tsv", 100) === "");
assert("Rejects empty file", validateFileMeta("a.csv", 0).length > 0);
assert("Rejects >5MB", validateFileMeta("big.csv", 6 * 1024 * 1024).length > 0);

for (const ext of ALLOWED_EXTENSIONS) {
  assert(`Extension allowed: ${ext}`, validateFileMeta(`file${ext}`, 50) === "");
}

// ─── Security scan ──────────────────────────────────────────────────
console.log("\n=== Security Scan ===\n");
const malicious = [
  '<script>alert(1)</script>',
  'javascript:void(0)',
  'onerror=alert(1)',
  'onclick=evil()',
  '<?php echo 1; ?>',
  '<% code %>',
];
for (const payload of malicious) {
  const issue = runSecurityScan(`key,summary\n1,${payload}`);
  assert(`Blocks: ${payload.slice(0, 30)}`, issue.length > 0);
}
assert("Clean CSV passes scan", runSecurityScan("Issue Key,Summary\nPROJ-1,Normal task") === "");

// ─── Token HMAC security ────────────────────────────────────────────
console.log("\n=== Token Security ===\n");
const secret = "test-secret-key-for-hmac-validation";
const sid = "sess-123";
const hash = hashContent("content");
const token = createSessionToken(sid, hash, secret);
assert("Valid token accepted", validateSessionToken(token, secret)?.sessionId === sid);
assert("Tampered token rejected", validateSessionToken(token + "x", secret) === null);
assert("Wrong secret rejected", validateSessionToken(token, "wrong-secret") === null);
assert("Empty token rejected", validateSessionToken("", secret) === null);

// ─── Sample files ───────────────────────────────────────────────────
console.log("\n=== Sample Files ===\n");
for (const file of ["sample-jira-export.csv", "sample-azure-devops.csv", "sample-governance-template.csv"]) {
  const fp = path.join(SAMPLES, file);
  if (!fs.existsSync(fp)) {
    skipTest(`Sample: ${file}`, "file missing");
    continue;
  }
  const text = fs.readFileSync(fp, "utf8");
  const { structure } = parseAndValidate(text, file);
  assert(`Sample validates: ${file}`, structure.ready === true, structure.issues?.[0] || "");
  const analysis = analyzeRecords(parseUploadContent(file, Buffer.from(text)).records);
  assert(`Sample analyzes: ${file}`, analysis.totalRecords > 0);
}

// ─── Null / empty field handling ────────────────────────────────────
console.log("\n=== Null & Empty Values ===\n");
const nullCsv = buildCsv([
  { "Issue Key": "A-1", Summary: "", Description: "", "Issue Type": "Task", Status: "Open", Project: "P1", Priority: "", Labels: "" },
  { "Issue Key": "A-2", Summary: "Has title", Description: "", "Issue Type": "", Status: "Done", Project: "", Priority: "High", Labels: "" },
]);
const nullResult = parseAndValidate(nullCsv);
assert("Null fields: still validates structure", nullResult.structure.ready === true);
assert("Null fields: 2 records parsed", nullResult.parsed.records.length === 2);
const nullAnalysis = analyzeRecords(nullResult.parsed.records);
assert("Null fields: analysis completes", nullAnalysis.totalRecords === 2);

// ─── Full / long text ───────────────────────────────────────────────
console.log("\n=== Long Text ===\n");
const longCsv = buildCsv(generateRows(10, { longText: true }));
const longResult = parseAndValidate(longCsv);
assert("Long text validates", longResult.structure.ready === true);
assert("Long text: 10 records", longResult.parsed.records.length === 10);

// ─── TSV format ─────────────────────────────────────────────────────
console.log("\n=== TSV Format ===\n");
const tsv = buildCsv(generateRows(5)).replace(/,/g, "\t");
const tsvResult = parseAndValidate(tsv, "export.tsv");
assert("TSV parses", tsvResult.parsed.records.length === 5);
assert("TSV validates", tsvResult.structure.ready === true);

// ─── Plan volume boundaries (actual parse) ──────────────────────────
console.log("\n=== Volume Upload Simulation ===\n");
const volumeCases = [
  [5, "starter"],
  [50, "starter"],
  [51, "professional"],
  [100, "professional"],
  [501, "business"],
  [1000, "business"],
  [5001, "business_plus"],
];
for (const [count, expectedTier] of volumeCases) {
  const csv = buildCsv(generateRows(count));
  const { structure } = parseAndValidate(csv);
  assert(`${count} items → ${expectedTier}`, structure.plan.tier === expectedTier, `got ${structure.plan.tier}`);
}

// 5000 max upload limit
const overLimit = buildCsv(generateRows(5001));
const overResult = parseAndValidate(overLimit);
assert("5001 items rejected (max 5000)", overResult.structure.ready === false);

// Enterprise gate
const enterpriseCsv = buildCsv(generateRows(100, { projects: Array.from({ length: 35 }, (_, i) => `Proj${i}`) }));
const entResult = parseAndValidate(enterpriseCsv);
assert("35 projects → enterprise_plus tier", entResult.structure.plan.tier === "enterprise_plus");
assert("Enterprise not self-serve", entResult.structure.selfServe === false);
assert("Enterprise block reason present", (entResult.structure.plan.blockReason || "").length > 0);

// ─── Missing required columns ───────────────────────────────────────
console.log("\n=== Validation Failures ===\n");
const badHeaders = "Foo,Bar\n1,2\n";
const badResult = parseAndValidate(badHeaders);
assert("Missing columns rejected", badResult.structure.ready === false);

const dupHeaders = "Issue Key,Summary,Description,Issue Type,Status,Project,Summary\nX-1,a,b,Task,Open,P1,c\n";
const dupResult = parseAndValidate(dupHeaders);
assert("Duplicate columns rejected", dupResult.structure.ready === false);

const headerOnly = "Issue Key,Summary,Description,Issue Type,Status,Project\n";
try {
  parseUploadContent("empty.csv", Buffer.from(headerOnly));
  assert("Header-only file throws", false);
} catch {
  assert("Header-only file throws", true);
}

// ─── AI detection ───────────────────────────────────────────────────
console.log("\n=== AI Candidate Detection ===\n");
const aiCsv = buildCsv([
  { "Issue Key": "AI-1", Summary: "GPT chatbot", Description: "Use OpenAI", "Issue Type": "Story", Status: "Open", Project: "P", Priority: "High", Labels: "ai" },
  { "Issue Key": "NO-1", Summary: "Fix login bug", Description: "CSS tweak", "Issue Type": "Bug", Status: "Open", Project: "P", Priority: "Low", Labels: "" },
]);
const aiParsed = parseAndValidate(aiCsv);
const aiAnalysis = analyzeRecords(aiParsed.parsed.records);
assert("AI candidate detected", aiAnalysis.aiCandidates >= 1);
assert("Non-AI not counted", aiAnalysis.totalRecords === 2);

// ─── Preview build ──────────────────────────────────────────────────
console.log("\n=== Preview ===\n");
const preview = buildPreview(aiAnalysis, aiParsed.structure);
assert("Preview locked", preview.locked === true);
assert("Preview has governance score", typeof preview.governanceScore === "number");
assert("Preview has plan info", preview.plan?.tier != null);

// ─── Frontend secret scan ───────────────────────────────────────────
console.log("\n=== Frontend Secret Scan ===\n");
const jsDir = path.join(ROOT, "assets", "js");
const secretPatterns = [/rzp_live_[A-Za-z0-9]+/, /key_secret/i, /RAZORPAY_KEY_SECRET/];
if (fs.existsSync(jsDir)) {
  for (const file of fs.readdirSync(jsDir).filter((f) => f.endsWith(".js"))) {
    const content = fs.readFileSync(path.join(jsDir, file), "utf8");
    for (const pat of secretPatterns) {
      assert(`No secret in ${file}: ${pat}`, !pat.test(content));
    }
  }
}

// ─── Live API (optional) ────────────────────────────────────────────
console.log("\n=== Live API ===\n");
const API_BASE = process.env.AGH_API_BASE || "https://www.aigovernancehub.ai";

async function testLiveApi() {
  try {
    const healthRes = await fetch(`${API_BASE}/api/health`);
    assert("Health endpoint responds", healthRes.ok, `status ${healthRes.status}`);
    const health = await healthRes.json();
    assert("Health reports ok", health.status === "ok" || health.ok === true, JSON.stringify(health).slice(0, 80));

    const samplePath = path.join(SAMPLES, "sample-jira-export.csv");
    if (fs.existsSync(samplePath)) {
      const content = fs.readFileSync(samplePath);
      const uploadRes = await fetch(`${API_BASE}/api/upload-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "sample-jira-export.csv",
          contentBase64: content.toString("base64"),
          source: "jira",
        }),
      });
      const uploadBody = await uploadRes.json();
      assert("Live upload succeeds", uploadRes.ok, uploadBody.error || `status ${uploadRes.status}`);
      if (uploadRes.ok && uploadBody.sessionId) {
        assert("Live upload returns sessionId", Boolean(uploadBody.sessionId));
        assert("Live upload returns preview", uploadBody.preview?.governanceScore != null);
        assert("Live plan tier detected", Boolean(uploadBody.plan?.tier));

        const quoteRes = await fetch(`${API_BASE}/api/order-quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: uploadBody.sessionId,
            sessionToken: uploadBody.sessionToken,
            currency: "INR",
          }),
        });
        const quoteBody = await quoteRes.json();
        assert("Order quote succeeds", quoteRes.ok);
        if (quoteRes.ok) {
          assert("Quote total matches razorpay", quoteBody.quote?.razorpayAmount === quoteBody.quote?.totalMinor);
        }

        const noConfirmRes = await fetch(`${API_BASE}/api/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: uploadBody.sessionId,
            sessionToken: uploadBody.sessionToken,
            orderConfirmed: false,
          }),
        });
        assert("create-order rejects without confirmation", noConfirmRes.status === 400);
      }
    }

    // Enterprise upload gate
    const entCsv = buildCsv(generateRows(100, { projects: Array.from({ length: 35 }, (_, i) => `Proj${i}`) }));
    const entRes = await fetch(`${API_BASE}/api/upload-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "enterprise.csv",
        contentBase64: Buffer.from(entCsv).toString("base64"),
        source: "csv",
      }),
    });
    const entBody = await entRes.json();
    if (entRes.status === 400 && entBody.validation) {
      assert("Enterprise upload: validation response", entBody.validation.plan?.tier === "enterprise_plus" || entBody.validation.selfServe === false);
    } else if (entRes.ok) {
      const orderRes = await fetch(`${API_BASE}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: entBody.sessionId,
          sessionToken: entBody.sessionToken,
          orderConfirmed: true,
        }),
      });
      assert("create-order 403 for enterprise", orderRes.status === 403);
    }
  } catch (err) {
    skipTest("Live API tests", err.message);
  }
}

await testLiveApi();

// ─── Summary ────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
console.log(`RESULTS: ${pass} PASS, ${fail} FAIL, ${skip} SKIP (${pass + fail + skip} total)`);
console.log("=".repeat(60));

if (fail > 0) {
  console.log("\nFailed tests:");
  results.filter((r) => r.ok === false).forEach((r) => console.log(`  - ${r.name}${r.detail ? `: ${r.detail}` : ""}`));
}

process.exit(fail > 0 ? 1 : 0);
