#!/usr/bin/env node
/**
 * v24.0 Enterprise Intelligence — automated tests (no deploy)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildIntelligenceSnapshot } from "../api/lib/intelligence-snapshot.js";
import { applyIndustryModel, normalizeIndustry, listIndustries } from "../api/lib/industry-models.js";
import { buildPortfolioIntelligence } from "../api/lib/portfolio-intelligence.js";
import { getBenchmarkPlaceholder, validateBenchmarkAggregate, BENCHMARK_ARCHITECTURE } from "../api/lib/benchmarking.js";
import { exportActionsCsv, actionTrackerStats, updateActionItem } from "../api/lib/action-tracker-core.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const results = [];
function pass(id, msg) {
  results.push({ id, ok: true, msg });
}
function fail(id, msg) {
  results.push({ id, ok: false, msg });
}

function mockExecutive() {
  return {
    version: "22.0",
    generatedAt: new Date().toISOString(),
    executiveSummary: {
      governanceScore: 72,
      aiReadiness: 65,
      topBusinessRisks: ["Unowned AI experiments"],
      topAiOpportunities: ["Support automation"],
      overallRecommendation: "Establish AI council",
      executiveConclusion: "Moderate maturity.",
    },
    assessmentOverview: {
      filename: "jira-export.csv",
      workItemCount: 120,
      aiCandidateCount: 18,
      projects: [{ name: "Platform", count: 80 }],
      platform: "Jira Cloud",
      uploadDate: new Date().toISOString(),
    },
    governanceScoreBreakdown: {
      overall: 72,
      dimensions: [{ label: "Ownership", score: 14, max: 20, why: "Gaps" }],
    },
    maturity: { level: "Defined", score: 55, why: "Partial" },
    departmentAnalysis: [{ name: "Platform", score: 75, workItems: 80, aiCandidates: 10, highRisk: 2 }],
    riskHeatmap: {
      critical: [{ title: "Public LLM on customer data" }],
      high: [{ title: "No model inventory" }],
      medium: [],
      low: [],
    },
    recommendations: [
      { title: "Create AI register", priority: "High", why: "Visibility", businessBenefit: "Risk reduction" },
    ],
    aiOpportunityMatrix: {
      highestRoi: [{ title: "Ticket triage", suggestedAiCategory: "Conversational AI" }],
      highestRisk: [],
      quickWins: [],
      longTerm: [],
    },
    frameworkMapping: {
      iso42001: { title: "ISO 42001", explanation: "Partial", alignmentScore: 60 },
    },
    businessImpact: {
      potentialAutomationPercent: { value: 25 },
      estimatedTimeSavingsAnnualHours: { low: 100, high: 400 },
      estimatedAnnualSavingsUsd: { low: 5000, high: 20000 },
    },
    inventory: { totalRecords: 120, riskSummary: { high: 3, medium: 10, low: 20 } },
    executiveRoadmap: { days30: [{ action: "Inventory AI" }], days60: [], days90: [] },
  };
}

// P0 — no secrets in new API files
const apiFiles = ["api/portfolio.js", "api/action-tracker.js", "api/lib/portfolio-intelligence.js"];
for (const f of apiFiles) {
  const c = fs.readFileSync(path.join(root, f), "utf8");
  if (/sk_live|process\.env\.[A-Z_]+.*res\.|apiSecret/i.test(c)) fail("P0-" + f, "Possible secret leak");
  else pass("P0-" + f, "No obvious secrets");
}

// P1 — intelligence snapshot
const snap = buildIntelligenceSnapshot(mockExecutive(), { orderId: "order_test", industry: "banking" });
if (snap && snap.executiveSummary.governanceScore === 72) pass("P1-snapshot", "Snapshot built");
else fail("P1-snapshot", "Snapshot invalid");

// P1 — industry
const bank = applyIndustryModel(mockExecutive(), "banking");
if (bank.industryContext && bank.industryProfile.label === "Banking & Financial Services") pass("P1-industry", "Industry model applied");
else fail("P1-industry", "Industry model failed");

if (normalizeIndustry("fintech") === "banking") pass("P1-industry-alias", "Industry alias works");
else fail("P1-industry-alias", "Alias failed");

// P1 — portfolio
const reportA = {
  orderId: "o1",
  paymentStatus: "verified",
  createdAt: "2026-01-01T00:00:00Z",
  intelligenceSnapshot: buildIntelligenceSnapshot(mockExecutive(), { orderId: "o1" }),
};
const reportB = {
  orderId: "o2",
  paymentStatus: "verified",
  createdAt: "2026-06-01T00:00:00Z",
  intelligenceSnapshot: buildIntelligenceSnapshot(
    applyIndustryModel({ ...mockExecutive(), executiveSummary: { ...mockExecutive().executiveSummary, governanceScore: 80 } }, "healthcare"),
    { orderId: "o2" }
  ),
};
const portfolio = buildPortfolioIntelligence([reportA, reportB], { actionStats: { total: 1, completed: 0 } });
if (!portfolio.empty && portfolio.assessmentCount === 2) pass("P1-portfolio", "Portfolio aggregates 2 assessments");
else fail("P1-portfolio", "Portfolio aggregation failed");

if (portfolio.trendAnalysis.lastVsCurrent.trend.direction === "improving") pass("P1-trend", "Trend improving detected");
else fail("P1-trend", "Trend wrong: " + portfolio.trendAnalysis.lastVsCurrent.trend.direction);

// P2 — benchmarking no fake data
const bench = getBenchmarkPlaceholder("banking");
if (bench.available === false && !bench.peerAverage) pass("P2-benchmark", "No fabricated benchmarks");
else fail("P2-benchmark", "Benchmark may expose fake data");

if (!validateBenchmarkAggregate({ sampleSize: 5, governanceScore: 70 })) pass("P2-benchmark-validate", "Rejects small samples");
else fail("P2-benchmark-validate", "Should reject k<10");

// P2 — action tracker
const tracker = {
  items: [
    {
      id: "abc",
      recommendationTitle: "Test",
      owner: "",
      priority: "High",
      status: "not_started",
      progress: 0,
      targetDate: null,
    },
  ],
};
updateActionItem(tracker, "abc", { status: "completed", progress: 100 });
if (tracker.items[0].status === "completed") pass("P2-actions", "Action update works");
else fail("P2-actions", "Action update failed");

const csv = exportActionsCsv(tracker);
if (csv.includes("Recommendation") && csv.includes("Test")) pass("P2-actions-csv", "CSV export works");
else fail("P2-actions-csv", "CSV invalid");

// P2 — deliverables & files
const required = [
  "CHANGELOG-v24.0.md",
  "SECURITY-REPORT-v24.0.md",
  "ENTERPRISE-INTELLIGENCE-REPORT-v24.0.md",
  "PERFORMANCE-REPORT-v24.0.md",
  "TEST-CHECKLIST-v24.0.md",
  "assets/js/executive-dashboard.js",
  "api/lib/report-export-v24.js",
];
for (const f of required) {
  if (fs.existsSync(path.join(root, f))) pass("FILE-" + f, "Present");
  else fail("FILE-" + f, "Missing");
}

if (listIndustries().length >= 7) pass("P2-industries-list", "7+ industries");
else fail("P2-industries-list", "Industry list incomplete");

const health = fs.readFileSync(path.join(root, "api/health.js"), "utf8");
if (health.includes('"24.0"')) pass("P1-version", "Health at 24.0");
else fail("P1-version", "Version not 24.0");

const failed = results.filter((r) => !r.ok);
console.log("\n=== v24.0 Enterprise Intelligence Tests ===\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + "  " + r.id + ": " + r.msg));
console.log("\n" + results.length + " tests | " + (results.length - failed.length) + " passed | " + failed.length + " failed");
process.exit(failed.length ? 1 : 0);
