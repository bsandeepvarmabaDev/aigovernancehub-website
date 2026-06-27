/**
 * AI Governance Hub v24.0 — Portfolio intelligence (server-side aggregation)
 */
import { snapshotFromLegacyReport } from "./intelligence-snapshot.js";
import { getBenchmarkPlaceholder } from "./benchmarking.js";

function round(n) {
  return Math.round(n * 10) / 10;
}

function avg(nums) {
  const valid = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!valid.length) return null;
  return round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function sortByDateDesc(reports) {
  return [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getSnapshot(report) {
  return report.intelligenceSnapshot || snapshotFromLegacyReport(report);
}

function bucketKey(dateIso, period) {
  const d = new Date(dateIso);
  if (period === "weekly") {
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
    return monday.toISOString().slice(0, 10);
  }
  if (period === "monthly") {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  // quarterly
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${d.getUTCFullYear()}-Q${q}`;
}

function buildTrendSeries(snapshots, period) {
  const buckets = new Map();
  snapshots.forEach((s) => {
    const key = bucketKey(s.assessedAt, period);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(s.executiveSummary?.governanceScore);
  });
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, scores]) => ({
      label,
      governanceScore: avg(scores),
      assessmentCount: scores.length,
    }));
}

function mergeDepartmentRankings(snapshots) {
  const map = new Map();
  snapshots.forEach((s) => {
    (s.departmentAnalysis || []).forEach((d) => {
      const key = d.name;
      if (!map.has(key)) {
        map.set(key, { name: key, scores: [], workItems: 0, aiCandidates: 0, assessments: 0 });
      }
      const row = map.get(key);
      row.scores.push(d.score);
      row.workItems += d.workItems || 0;
      row.aiCandidates += d.aiCandidates || 0;
      row.assessments += 1;
    });
  });
  return [...map.values()]
    .map((r) => ({
      name: r.name,
      avgScore: avg(r.scores),
      workItems: r.workItems,
      aiCandidates: r.aiCandidates,
      assessments: r.assessments,
    }))
    .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));
}

function aggregateRisks(snapshots) {
  const risks = [];
  snapshots.forEach((s) => {
    (s.executiveSummary?.topBusinessRisks || []).forEach((r) => risks.push({ text: r, source: s.projectLabel }));
    (s.riskHeatmap?.topCritical || []).forEach((r) =>
      risks.push({ text: r, severity: "Critical", source: s.projectLabel })
    );
    (s.riskHeatmap?.topHigh || []).forEach((r) => risks.push({ text: r, severity: "High", source: s.projectLabel }));
  });
  const seen = new Set();
  return risks
    .filter((r) => {
      const k = r.text;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 10);
}

function aggregateOpportunities(snapshots) {
  const opps = [];
  snapshots.forEach((s) => {
    (s.executiveSummary?.topAiOpportunities || []).forEach((o) =>
      opps.push({ text: typeof o === "string" ? o : o.title || String(o), source: s.projectLabel })
    );
    (s.aiOpportunityMatrix?.highestRoi || []).forEach((o) =>
      opps.push({ text: o.title, category: o.suggestedAiCategory, source: s.projectLabel })
    );
  });
  const seen = new Set();
  return opps
    .filter((o) => {
      if (seen.has(o.text)) return false;
      seen.add(o.text);
      return true;
    })
    .slice(0, 10);
}

function buildProjectComparison(snapshots) {
  return snapshots.map((s) => ({
    id: s.orderId,
    label: s.projectLabel,
    assessedAt: s.assessedAt,
    governanceScore: s.executiveSummary?.governanceScore,
    aiReadiness: s.executiveSummary?.aiReadiness,
    maturity: s.maturity?.level,
    workItems: s.workItemCount,
    aiCandidates: s.aiCandidateCount,
    criticalRisks: s.riskHeatmap?.counts?.critical || 0,
    highRisks: s.riskHeatmap?.counts?.high || 0,
    departments: (s.departmentAnalysis || []).length,
    industry: s.industry,
  }));
}

function buildPortfolioHeatmap(snapshots) {
  const totals = { critical: 0, high: 0, medium: 0, low: 0 };
  snapshots.forEach((s) => {
    const c = s.riskHeatmap?.counts || {};
    totals.critical += c.critical || 0;
    totals.high += c.high || 0;
    totals.medium += c.medium || 0;
    totals.low += c.low || 0;
  });
  return totals;
}

function computeTrend(latest, previous) {
  if (!latest || !previous) return { direction: "stable", delta: 0, label: "Insufficient history" };
  const a = latest.executiveSummary?.governanceScore;
  const b = previous.executiveSummary?.governanceScore;
  if (typeof a !== "number" || typeof b !== "number") return { direction: "stable", delta: 0, label: "N/A" };
  const delta = round(a - b);
  if (delta > 2) return { direction: "improving", delta, label: "Improving" };
  if (delta < -2) return { direction: "declining", delta, label: "Declining" };
  return { direction: "stable", delta, label: "Stable" };
}

function overallRiskLevel(snapshots) {
  const heat = buildPortfolioHeatmap(snapshots);
  if (heat.critical > 0) return { level: "Critical", score: 85, summary: `${heat.critical} critical risk items across portfolio` };
  if (heat.high > 5) return { level: "High", score: 70, summary: `${heat.high} high-risk items require attention` };
  if (heat.high > 0) return { level: "Elevated", score: 55, summary: `${heat.high} high-risk items monitored` };
  return { level: "Moderate", score: 40, summary: "No critical items; maintain controls" };
}

function buildKpiDashboard(snapshots) {
  const latest = snapshots[0];
  const heat = buildPortfolioHeatmap(snapshots);
  return {
    governanceScore: latest?.executiveSummary?.governanceScore ?? avg(snapshots.map((s) => s.executiveSummary?.governanceScore)),
    aiReadiness: latest?.executiveSummary?.aiReadiness ?? avg(snapshots.map((s) => s.executiveSummary?.aiReadiness)),
    frameworkCompliance: latest?.frameworkCompliance || [],
    criticalRisks: heat.critical,
    highRisks: heat.high,
    aiOpportunities: snapshots.reduce((n, s) => n + (s.aiOpportunityMatrix?.highestRoi?.length || 0), 0),
    departmentHealth: mergeDepartmentRankings(snapshots).slice(0, 8),
    portfolioHealth: {
      assessmentCount: snapshots.length,
      avgGovernanceScore: avg(snapshots.map((s) => s.executiveSummary?.governanceScore)),
      avgAiReadiness: avg(snapshots.map((s) => s.executiveSummary?.aiReadiness)),
      totalWorkItems: snapshots.reduce((n, s) => n + (s.workItemCount || 0), 0),
    },
  };
}

function buildCustomerValue(snapshots, actionStats) {
  let hoursSavedLow = 0;
  let hoursSavedHigh = 0;
  snapshots.forEach((s) => {
    const h = s.businessImpact?.estimatedTimeSavingsAnnualHours;
    if (h) {
      hoursSavedLow += h.low || 0;
      hoursSavedHigh += h.high || 0;
    }
  });
  const scores = snapshots.map((s) => s.executiveSummary?.governanceScore).filter((n) => typeof n === "number");
  const governanceImprovement =
    scores.length >= 2 ? round(scores[0] - scores[scores.length - 1]) : 0;
  const aiScores = snapshots.map((s) => s.executiveSummary?.aiReadiness).filter((n) => typeof n === "number");

  return {
    reportsGenerated: snapshots.length,
    estimatedTimeSavedHours: { low: hoursSavedLow, high: hoursSavedHigh },
    recommendationsCompleted: actionStats?.completed || 0,
    recommendationsTotal: actionStats?.total || 0,
    governanceImprovement,
    aiAdoptionProgress: aiScores.length >= 2 ? round(aiScores[0] - aiScores[aiScores.length - 1]) : 0,
    completionRate:
      actionStats?.total > 0 ? round((actionStats.completed / actionStats.total) * 100) : 0,
  };
}

/**
 * @param {object[]} verifiedReports - Full report records from storage
 * @param {object} options - { actionStats, primaryIndustry }
 */
export function buildPortfolioIntelligence(verifiedReports, options = {}) {
  const sorted = sortByDateDesc(verifiedReports.filter((r) => r.paymentStatus === "verified"));
  const snapshots = sorted.map(getSnapshot).filter(Boolean);

  if (!snapshots.length) {
    return {
      version: "24.0",
      empty: true,
      message: "Complete a guided assessment to activate your executive intelligence dashboard.",
    };
  }

  const latest = snapshots[0];
  const previous = snapshots[1] || null;
  const trend = computeTrend(latest, previous);
  const industry = options.primaryIndustry || latest.industry || "general";

  return {
    version: "24.0",
    empty: false,
    generatedAt: new Date().toISOString(),
    assessmentCount: snapshots.length,
    executiveDashboard: {
      overallGovernanceScore: avg(snapshots.map((s) => s.executiveSummary?.governanceScore)),
      overallAiReadiness: avg(snapshots.map((s) => s.executiveSummary?.aiReadiness)),
      overallRisk: overallRiskLevel(snapshots),
      portfolioScore: avg(snapshots.map((s) => s.executiveSummary?.governanceScore)),
      trend,
      lastAssessment: {
        label: latest.projectLabel,
        assessedAt: latest.assessedAt,
        governanceScore: latest.executiveSummary?.governanceScore,
      },
      currentAssessment: {
        label: latest.projectLabel,
        assessedAt: latest.assessedAt,
        governanceScore: latest.executiveSummary?.governanceScore,
        aiReadiness: latest.executiveSummary?.aiReadiness,
      },
      recentAssessments: snapshots.slice(0, 8).map((s) => ({
        orderId: s.orderId,
        label: s.projectLabel,
        assessedAt: s.assessedAt,
        governanceScore: s.executiveSummary?.governanceScore,
        aiReadiness: s.executiveSummary?.aiReadiness,
        industry: s.industry,
      })),
      departmentRankings: mergeDepartmentRankings(snapshots).slice(0, 12),
      topRisks: aggregateRisks(snapshots),
      topOpportunities: aggregateOpportunities(snapshots),
    },
    portfolioAnalytics: {
      projectComparison: buildProjectComparison(snapshots),
      portfolioHeatmap: buildPortfolioHeatmap(snapshots),
      departmentComparison: mergeDepartmentRankings(snapshots),
      riskDistribution: buildPortfolioHeatmap(snapshots),
    },
    trendAnalysis: {
      lastVsCurrent: {
        last: previous
          ? {
              label: previous.projectLabel,
              governanceScore: previous.executiveSummary?.governanceScore,
              assessedAt: previous.assessedAt,
            }
          : null,
        current: {
          label: latest.projectLabel,
          governanceScore: latest.executiveSummary?.governanceScore,
          assessedAt: latest.assessedAt,
        },
        trend,
      },
      charts: {
        weekly: buildTrendSeries(snapshots, "weekly"),
        monthly: buildTrendSeries(snapshots, "monthly"),
        quarterly: buildTrendSeries(snapshots, "quarterly"),
      },
    },
    kpiDashboard: buildKpiDashboard(snapshots),
    customerValue: buildCustomerValue(snapshots, options.actionStats),
    benchmarking: getBenchmarkPlaceholder(industry),
  };
}

export { buildCustomerValue, mergeDepartmentRankings };
