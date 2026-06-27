/**
 * AI Governance Hub v24.0 — Intelligence snapshot (persisted, reproducible from upload)
 * Slim server-side record for portfolio, trends, and comparisons.
 */
export function buildIntelligenceSnapshot(executive, meta = {}) {
  if (!executive) return null;

  const ex = executive.executiveSummary || {};
  const heat = executive.riskHeatmap || { critical: [], high: [], medium: [], low: [] };

  return {
    version: "24.0",
    orderId: meta.orderId || null,
    assessedAt: meta.paidAt || executive.generatedAt || new Date().toISOString(),
    industry: meta.industry || executive.industryProfile?.id || "general",
    filename: executive.assessmentOverview?.filename || "",
    source: meta.source || executive.assessmentOverview?.platform || "csv",
    company: executive.assessmentOverview?.company || meta.company || null,
    platform: executive.assessmentOverview?.platform || "",
    projectLabel:
      meta.projectLabel ||
      executive.assessmentOverview?.filename ||
      `Assessment ${(meta.orderRef || meta.orderId || "").slice(-6)}`,
    workItemCount: executive.assessmentOverview?.workItemCount || executive.inventory?.totalRecords || 0,
    aiCandidateCount: executive.assessmentOverview?.aiCandidateCount || 0,
    planTier: meta.planTier || executive.assessmentOverview?.planTier || "starter",
    planLabel: meta.planLabel || executive.assessmentOverview?.planLabel || "Starter",
    executiveSummary: {
      governanceScore: ex.governanceScore ?? null,
      aiReadiness: ex.aiReadiness ?? null,
      topBusinessRisks: (ex.topBusinessRisks || []).slice(0, 8),
      topAiOpportunities: (ex.topAiOpportunities || []).slice(0, 8),
      overallRecommendation: ex.overallRecommendation || "",
      executiveConclusion: ex.executiveConclusion || "",
    },
    governanceScoreBreakdown: {
      overall: executive.governanceScoreBreakdown?.overall ?? ex.governanceScore,
      dimensions: (executive.governanceScoreBreakdown?.dimensions || []).map((d) => ({
        label: d.label,
        score: d.score,
        max: d.max,
      })),
    },
    maturity: {
      level: executive.maturity?.level || "Initial",
      score: executive.maturity?.score ?? null,
    },
    departmentAnalysis: (executive.departmentAnalysis || []).map((d) => ({
      name: d.name,
      score: d.score,
      workItems: d.workItems,
      aiCandidates: d.aiCandidates,
      highRisk: d.highRisk,
    })),
    riskHeatmap: {
      counts: {
        critical: heat.critical?.length || 0,
        high: heat.high?.length || 0,
        medium: heat.medium?.length || 0,
        low: heat.low?.length || 0,
      },
      topCritical: (heat.critical || []).slice(0, 5).map((r) => r.title || r.name || String(r)),
      topHigh: (heat.high || []).slice(0, 5).map((r) => r.title || r.name || String(r)),
    },
    recommendations: (executive.recommendations || []).map((r, idx) => ({
      id: `rec-${meta.orderId || "x"}-${idx}`,
      title: r.title,
      priority: r.priority,
      why: r.why,
      businessBenefit: r.businessBenefit,
      estimatedImpact: r.estimatedImpact,
    })),
    aiOpportunityMatrix: {
      highestRoi: (executive.aiOpportunityMatrix?.highestRoi || []).slice(0, 5),
      highestRisk: (executive.aiOpportunityMatrix?.highestRisk || []).slice(0, 5),
      quickWins: (executive.aiOpportunityMatrix?.quickWins || []).slice(0, 5),
      longTerm: (executive.aiOpportunityMatrix?.longTerm || []).slice(0, 5),
    },
    frameworkCompliance: summarizeFrameworkCompliance(executive.frameworkMapping),
    businessImpact: executive.businessImpact
      ? {
          potentialAutomationPercent: executive.businessImpact.potentialAutomationPercent?.value,
          estimatedTimeSavingsAnnualHours: executive.businessImpact.estimatedTimeSavingsAnnualHours,
          estimatedAnnualSavingsUsd: executive.businessImpact.estimatedAnnualSavingsUsd,
        }
      : null,
    projects: executive.assessmentOverview?.projects || [],
    inventory: {
      totalRecords: executive.inventory?.totalRecords || 0,
      aiCandidates: executive.inventory?.totalRecords
        ? executive.assessmentOverview?.aiCandidateCount
        : 0,
      riskSummary: executive.inventory?.riskSummary || { high: 0, medium: 0, low: 0 },
    },
  };
}

function summarizeFrameworkCompliance(frameworkMapping) {
  if (!frameworkMapping) return [];
  return Object.values(frameworkMapping).map((f) => ({
    title: f.title,
    alignmentScore: f.alignmentScore ?? f.score ?? null,
    status: f.status || "review",
  }));
}

export function snapshotFromLegacyReport(report) {
  if (report.intelligenceSnapshot) return report.intelligenceSnapshot;
  if (!report.preview) return null;
  const p = report.preview;
  return {
    version: "21.0-legacy",
    orderId: report.orderId,
    assessedAt: report.createdAt,
    industry: "general",
    projectLabel: report.company || report.orderId,
    executiveSummary: {
      governanceScore: p.governanceScore ?? report.governanceScore,
      aiReadiness: p.aiReadiness ?? null,
      topBusinessRisks: [],
      topAiOpportunities: (p.topOpportunities || []).map((o) => o.title || o),
      overallRecommendation: p.executiveSummary || "",
      executiveConclusion: p.executiveSummary || "",
    },
    maturity: { level: p.maturityLevel || "Initial", score: null },
    departmentAnalysis: [],
    riskHeatmap: {
      counts: {
        critical: 0,
        high: p.riskSummary?.high || 0,
        medium: p.riskSummary?.medium || 0,
        low: p.riskSummary?.low || 0,
      },
      topCritical: [],
      topHigh: [],
    },
    recommendations: [],
    inventory: {
      totalRecords: p.totalRecords || 0,
      aiCandidates: p.aiCandidates || 0,
      riskSummary: p.riskSummary || { high: 0, medium: 0, low: 0 },
    },
    planTier: report.planTier,
    planLabel: report.planLabel,
  };
}
