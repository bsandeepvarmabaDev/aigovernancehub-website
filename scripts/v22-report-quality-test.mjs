#!/usr/bin/env node
/**
 * v22.0 report quality validation — TEST ONLY harness
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseUploadContent, analyzeRecords } from "../api/lib/report-engine.js";
import { buildExecutiveAssessment } from "../api/lib/executive-intelligence.js";
import { generateAllExecutiveFormats } from "../api/lib/report-export-v22.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sample = fs.readFileSync(path.join(__dirname, "../samples/sample-jira-export.csv"), "utf8");
const parsed = parseUploadContent("sample-jira-export.csv", Buffer.from(sample));
const analysis = analyzeRecords(parsed.records);
const executive = buildExecutiveAssessment(parsed.records, analysis, {
  source: "jira",
  filename: "sample-jira-export.csv",
  planTier: "starter",
  planLabel: "Starter",
  company: "Test Co",
});

const checks = [];
function assert(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
}

assert("Executive version 22.0", executive.version === "22.0");
assert("Governance dimensions (5)", executive.governanceScoreBreakdown.dimensions.length === 5);
assert("Each dimension has WHY", executive.governanceScoreBreakdown.dimensions.every((d) => d.why.length > 10));
assert("Department analysis present", executive.departmentAnalysis.length >= 1);
assert("Opportunity matrix sections", Boolean(executive.aiOpportunityMatrix.highestRoi));
assert("Framework mapping (4 frameworks)", Object.keys(executive.frameworkMapping).length === 4);
assert("Risk heatmap bands", "critical" in executive.riskHeatmap);
assert("Executive roadmap 30/60/90", executive.executiveRoadmap.days30.length >= 1);
assert("Maturity level set", Boolean(executive.maturity.level));
assert("Executive insights contextual", executive.executiveInsights.length >= 2);
assert("Recommendations with WHY", executive.recommendations.every((r) => r.why && r.businessBenefit));
assert("Business impact assumptions documented", executive.businessImpact.assumptions.length >= 3);
assert("Methodology documented", Boolean(executive.methodology.summary));

const meta = { buyerName: "Test User", company: "Test Co", orderRef: "TEST-001" };
const formats = await generateAllExecutiveFormats(executive, meta);
assert("HTML report generated", formats.html.includes("Executive AI Governance Assessment"));
assert("Text report generated", formats.text.includes("EXECUTIVE SUMMARY"));
assert("PDF buffer", Buffer.isBuffer(formats.pdf) && formats.pdf.length > 500);
assert("DOCX buffer", Buffer.isBuffer(formats.docx) && formats.docx.length > 1000);
assert("PPTX buffer", Buffer.isBuffer(formats.pptx) && formats.pptx.length > 5000);

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
