/**
 * AI Governance Hub v22.0 — Executive Intelligence Engine
 * All scores and estimates are derived from uploaded data with documented methodology.
 * No hallucinated statistics. No fake AI output.
 */

const AI_KEYWORDS =
  /\b(ai|artificial intelligence|genai|generative|llm|gpt|openai|claude|gemini|copilot|rag|machine learning|ml model|neural|prompt|chatbot|embedding|fine-tun|automation|automate)\b/i;

const REPETITIVE_KEYWORDS =
  /\b(manual|repetitive|copy|paste|data entry|invoice|ocr|extract|classify|route|ticket|support|onboard|reporting)\b/i;

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickField(row, keys) {
  for (const key of keys) {
    const normalizedKey = normalizeHeader(key);
    for (const [header, value] of Object.entries(row)) {
      if (normalizeHeader(header) === normalizedKey && value != null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
  }
  return "";
}

function isAiCandidate(row) {
  const combined = [
    pickField(row, ["summary", "title", "name"]),
    pickField(row, ["description", "details", "body"]),
    pickField(row, ["labels", "label", "components"]),
  ].join(" ");
  return AI_KEYWORDS.test(combined);
}

function isRepetitiveWorkflow(row) {
  const combined = [
    pickField(row, ["summary", "title"]),
    pickField(row, ["description", "details"]),
    pickField(row, ["labels", "label"]),
  ].join(" ");
  return REPETITIVE_KEYWORDS.test(combined);
}

function riskBandFromRow(row, analyzedItem) {
  return analyzedItem?.riskBand || "Medium";
}

function categorizeAi(row) {
  const text = [
    pickField(row, ["summary", "title"]),
    pickField(row, ["description", "details"]),
    pickField(row, ["labels", "label"]),
  ]
    .join(" ")
    .toLowerCase();
  if (/\b(chatbot|support|customer)\b/.test(text)) return "Conversational AI";
  if (/\b(ocr|extract|document|invoice)\b/.test(text)) return "Document Intelligence";
  if (/\b(copilot|code|developer|engineering)\b/.test(text)) return "Developer Productivity";
  if (/\b(rag|embedding|knowledge|search)\b/.test(text)) return "Knowledge & Search";
  if (/\b(ml|model|predict|forecast|classif)\b/.test(text)) return "Predictive Analytics";
  return "General AI / Automation";
}

function complexityFromRow(row, analyzedItem) {
  const risk = analyzedItem?.riskScore || 0;
  const deployment = String(analyzedItem?.deploymentType || "").toLowerCase();
  if (risk >= 70 || deployment.includes("public") || deployment.includes("customer")) return "High";
  if (risk >= 40) return "Medium";
  return "Low";
}

function countByField(records, fieldKeys) {
  const counts = new Map();
  records.forEach((row) => {
    const val = pickField(row, fieldKeys) || "Unspecified";
    counts.set(val, (counts.get(val) || 0) + 1);
  });
  return counts;
}

function topEntries(counts, limit = 10) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Build governance score dimensions from observable upload signals.
 * Each dimension max 20 points; methodology documented in output.
 */
function buildGovernanceDimensions(records, analyzed, baseAnalysis) {
  const total = records.length;
  const aiRows = analyzed.filter((a) => a.aiCandidate);
  const withOwner = aiRows.filter((a) => a.owner && a.owner !== "Unassigned").length;
  const withDescription = records.filter((r) => pickField(r, ["description", "details"]).length > 20).length;
  const withPriority = records.filter((r) => pickField(r, ["priority", "severity"]).length > 0).length;
  const withLabels = records.filter((r) => pickField(r, ["labels", "label"]).length > 0).length;
  const highRisk = baseAnalysis.riskSummary.high;

  const ownershipScore = total > 0 ? clamp(Math.round((withOwner / Math.max(aiRows.length, 1)) * 20), 0, 20) : 0;
  const ownershipWhy =
    aiRows.length === 0
      ? "No AI-related work items detected — ownership scoring reflects general assignee coverage on work items."
      : `${withOwner} of ${aiRows.length} AI-related work items have an identifiable owner or assignee in the export (${Math.round((withOwner / aiRows.length) * 100)}%).`;

  const docScore = total > 0 ? clamp(Math.round((withDescription / total) * 20), 0, 20) : 0;
  const docWhy = `${withDescription} of ${total} work items (${Math.round((withDescription / total) * 100)}%) include descriptions longer than 20 characters, indicating documentation depth in the source export.`;

  const riskControlScore = clamp(20 - highRisk * 2, 0, 20);
  const riskWhy =
    highRisk > 0
      ? `${highRisk} high-risk AI-related work items detected — each reduces risk-control score by 2 points (max deduction from baseline 20).`
      : "No high-risk AI-related work items detected in this snapshot — risk controls appear manageable at inventory level.";

  const frameworkScore = clamp(
    Math.round((withLabels / Math.max(total, 1)) * 10 + (withPriority / Math.max(total, 1)) * 10),
    0,
    20
  );
  const frameworkWhy = `Labels present on ${withLabels}/${total} items; priority on ${withPriority}/${total} items — used as proxies for taxonomy and classification maturity.`;

  const monitoringScore = clamp(
    Math.round((records.filter((r) => /done|closed|resolved|complete/i.test(pickField(r, ["status", "state"]))).length /
      Math.max(total, 1)) *
      20),
    0,
    20
  );
  const monitoringWhy = `Share of work items in closed/done/resigned status used as workflow closure proxy (${monitoringScore}/20).`;

  const dimensions = [
    { id: "ownership", label: "Ownership", score: ownershipScore, max: 20, why: ownershipWhy },
    { id: "documentation", label: "Documentation", score: docScore, max: 20, why: docWhy },
    { id: "riskControls", label: "Risk Controls", score: riskControlScore, max: 20, why: riskWhy },
    { id: "frameworkAlignment", label: "Framework Alignment", score: frameworkScore, max: 20, why: frameworkWhy },
    { id: "monitoring", label: "Monitoring", score: monitoringScore, max: 20, why: monitoringWhy },
  ];

  const composite = dimensions.reduce((s, d) => s + d.score, 0);
  return { dimensions, composite, overall: clamp(composite, 0, 100) };
}

function buildDepartmentAnalysis(records, analyzed) {
  const byProject = new Map();
  records.forEach((row, i) => {
    const dept = pickField(row, ["project", "project name", "department", "team", "area path"]) || "Unassigned";
    if (!byProject.has(dept)) {
      byProject.set(dept, { records: [], analyzed: [] });
    }
    byProject.get(dept).records.push(row);
    byProject.get(dept).analyzed.push(analyzed[i]);
  });

  return [...byProject.entries()].map(([name, bucket]) => {
    const aiCount = bucket.analyzed.filter((a) => a.aiCandidate).length;
    const highRisk = bucket.analyzed.filter((a) => a.aiCandidate && a.riskBand === "High").length;
    const withOwner = bucket.analyzed.filter((a) => a.owner && a.owner !== "Unassigned").length;
    const total = bucket.records.length;
    const docRate = bucket.records.filter((r) => pickField(r, ["description", "details"]).length > 20).length / Math.max(total, 1);

    let score = 100;
    score -= Math.round((highRisk / Math.max(aiCount, 1)) * 30);
    score -= Math.round((aiCount / Math.max(total, 1)) * 15);
    score -= withOwner < aiCount ? 10 : 0;
    score += Math.round(docRate * 10);
    score = clamp(score, 0, 100);

    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    if (docRate > 0.6) strengths.push("Strong description coverage supports governance evidence.");
    if (withOwner >= aiCount && aiCount > 0) strengths.push("AI-related work items have identifiable owners.");
    if (highRisk === 0 && aiCount > 0) strengths.push("No high-risk AI-related work items in this department snapshot.");

    if (aiCount === 0) weaknesses.push("No AI-related signals detected — inventory may be incomplete.");
    if (highRisk > 0) weaknesses.push(`${highRisk} high-risk AI-related work item(s) require immediate review.`);
    if (withOwner < aiCount) weaknesses.push("Some AI-related work items lack assigned owners in the export.");

    if (highRisk > 0) recommendations.push("Escalate high-risk items to governance review within 30 days.");
    if (withOwner < aiCount) recommendations.push("Assign accountable owners to all AI-related work items.");
    recommendations.push("Maintain AI inventory labels for ongoing ISO 42001 alignment.");

    return {
      name,
      score,
      workItems: total,
      aiCandidates: aiCount,
      highRisk,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      recommendations: recommendations.slice(0, 3),
    };
  });
}

function buildOpportunityMatrix(records, analyzed) {
  const opportunities = [];
  records.forEach((row, i) => {
    if (!analyzed[i].aiCandidate && !isRepetitiveWorkflow(row)) return;
    const item = analyzed[i];
    const title = pickField(row, ["summary", "title"]) || item.name;
    const category = categorizeAi(row);
    const complexity = complexityFromRow(row, item);
    const repetitive = isRepetitiveWorkflow(row);
    const roiScore =
      (repetitive ? 3 : 1) + (complexity === "Low" ? 2 : complexity === "Medium" ? 1 : 0) + (item.riskBand === "Low" ? 1 : 0);
    const riskScore = item.riskScore || 0;

    opportunities.push({
      title,
      reason: repetitive
        ? "Work item text indicates repetitive or manual workflow patterns suitable for automation."
        : "AI-related keywords detected in summary, description, or labels.",
      expectedBusinessImpact: repetitive
        ? "Reduce manual handling time for recurring operational tasks."
        : `Accelerate ${category.toLowerCase()} capability with governed AI deployment.`,
      estimatedComplexity: complexity,
      suggestedAiCategory: category,
      priority: item.riskBand === "High" ? "Critical" : item.riskBand === "Medium" ? "High" : "Medium",
      roiScore,
      riskScore,
      owner: item.owner,
      department: pickField(row, ["project", "project name", "department"]) || "Unassigned",
    });
  });

  const byRoi = [...opportunities].sort((a, b) => b.roiScore - a.roiScore);
  const byRisk = [...opportunities].sort((a, b) => b.riskScore - a.riskScore);
  const quickWins = opportunities.filter((o) => o.estimatedComplexity === "Low" && o.roiScore >= 3);
  const longTerm = opportunities.filter((o) => o.estimatedComplexity === "High" || o.priority === "Critical");

  return {
    highestRoi: byRoi.slice(0, 8),
    highestRisk: byRisk.slice(0, 8),
    quickWins: quickWins.slice(0, 8),
    longTerm: longTerm.slice(0, 8),
  };
}

function buildBusinessImpact(records, analyzed, baseAnalysis) {
  const total = records.length;
  const aiCount = baseAnalysis.aiCandidates;
  const repetitiveCount = records.filter((r, i) => isRepetitiveWorkflow(r) || analyzed[i].aiCandidate).length;

  const assumptions = [
    "Estimates are derived only from uploaded work item counts and detected AI/automation signals — not from external financial data.",
    "Manual hours assume 2 hours per week per repetitive or AI-automation work item (industry planning range for backlog sizing; actual varies by team).",
    "Automation percentage = share of scanned items flagged as AI-related work items or repetitive workflows.",
    "Annual savings use loaded cost of $75/hour (planning assumption for executive modeling — replace with your organization's blended rate).",
    "Productivity gain reflects potential time redirected if automation targets are achieved — not guaranteed outcomes.",
  ];

  const weeklyHoursLow = repetitiveCount * 1;
  const weeklyHoursHigh = repetitiveCount * 3;
  const automationPercent = total > 0 ? round1((repetitiveCount / total) * 100) : 0;
  const annualHoursLow = weeklyHoursLow * 52;
  const annualHoursHigh = weeklyHoursHigh * 52;
  const hourlyRate = 75;
  const savingsLow = annualHoursLow * hourlyRate;
  const savingsHigh = annualHoursHigh * hourlyRate;
  const productivityGain = clamp(Math.round(automationPercent * 0.4), 0, 25);

  return {
    assumptions,
    potentialManualHoursPerWeek: { low: weeklyHoursLow, high: weeklyHoursHigh, unit: "hours" },
    potentialAutomationPercent: { value: automationPercent, basis: `${repetitiveCount} of ${total} items flagged` },
    estimatedTimeSavingsAnnualHours: { low: annualHoursLow, high: annualHoursHigh, unit: "hours/year" },
    estimatedAnnualSavingsUsd: {
      low: savingsLow,
      high: savingsHigh,
      basis: `$${hourlyRate}/hr planning rate × estimated hours`,
    },
    estimatedProductivityGainPercent: {
      value: productivityGain,
      basis: "Conservative proxy: 40% of automation-eligible share converted to productivity uplift",
    },
  };
}

function buildFrameworkMappingV22(records, analyzed, baseAnalysis) {
  const aiCount = baseAnalysis.aiCandidates;
  const highRisk = baseAnalysis.riskSummary.high;
  const withOwner = analyzed.filter((a) => a.aiCandidate && a.owner !== "Unassigned").length;
  const inventoryComplete = aiCount > 0;

  function status(partial, missing) {
    if (missing) return "missing";
    if (partial) return "partial";
    return "compliant";
  }

  return {
    iso42001: {
      title: "ISO 42001 — AI Management System",
      compliant: inventoryComplete && withOwner >= aiCount * 0.8 ? ["AI inventory from export"] : [],
      partial: inventoryComplete
        ? ["Inventory detected", withOwner < aiCount ? "Owner gaps on some AI-related items" : "Role assignment signals"]
        : ["Limited inventory"],
      missing: !inventoryComplete
        ? ["Complete AI system inventory", "Documented governance roles"]
        : highRisk > 0
          ? ["Risk treatment records for high-risk AI-related work items"]
          : [],
      explanation: inventoryComplete
        ? "Export provides an AI inventory foundation. Formal ISO 42001 certification requires documented controls beyond this snapshot."
        : "Insufficient AI inventory in upload for ISO 42001 inventory controls.",
    },
    nistAiRmf: {
      title: "NIST AI RMF",
      compliant: aiCount > 0 ? ["Map function — use cases identified from export"] : [],
      partial: ["Govern function — partial owner assignment", "Measure function — risk bands applied"],
      missing: highRisk > 0 ? ["Manage function — escalate high-risk treatments"] : ["Formal measurement metrics"],
      explanation: "NIST Govern/Map/Measure/Manage functions mapped to detected inventory and risk bands.",
    },
    internalGovernance: {
      title: "Internal Governance",
      compliant: withOwner > 0 ? ["Assignee/owner fields populated on subset of items"] : [],
      partial: ["Workflow status captured", "Priority distribution available"],
      missing: withOwner < aiCount ? ["Accountable owner for every AI-related work item"] : ["Executive approval workflow evidence"],
      explanation: "Internal governance maturity inferred from owner assignment, status, and priority fields in source export.",
    },
    responsibleAi: {
      title: "Responsible AI",
      compliant: highRisk === 0 && aiCount > 0 ? ["No high-risk band in snapshot"] : [],
      partial: aiCount > 0 ? ["Risk classification applied to AI-related work items"] : [],
      missing: highRisk > 0 ? [`${highRisk} high-risk items need human oversight plan`] : ["Responsible AI policy linkage"],
      explanation: "Responsible AI posture based on risk scoring of detected AI-related work items — not ethical audit certification.",
    },
  };
}

function buildRiskHeatmap(analyzed, records) {
  const risks = [];
  analyzed.forEach((item, i) => {
    if (!item.aiCandidate && item.riskScore < 35) return;
    const row = records[i];
    const band =
      item.riskScore >= 85 ? "Critical" : item.riskBand === "High" ? "High" : item.riskBand === "Medium" ? "Medium" : "Low";
    risks.push({
      title: item.name,
      band,
      description: pickField(row, ["description", "details"]) || item.useCase,
      businessImpact:
        band === "Critical" || band === "High"
          ? "Potential regulatory, customer, or operational exposure if deployed without governance review."
          : "Manageable with standard review and documentation.",
      likelihood: band === "Critical" ? "High" : band === "High" ? "Medium" : "Low",
      recommendation:
        band === "Critical" || band === "High"
          ? "Immediate governance review, owner assignment, and evidence collection."
          : "Schedule review in next governance cycle.",
      priority: band === "Critical" ? "P0" : band === "High" ? "P1" : band === "Medium" ? "P2" : "P3",
      owner: item.owner,
    });
  });

  return {
    critical: risks.filter((r) => r.band === "Critical"),
    high: risks.filter((r) => r.band === "High"),
    medium: risks.filter((r) => r.band === "Medium"),
    low: risks.filter((r) => r.band === "Low"),
  };
}

function determineMaturity(dimensions, baseAnalysis, deptAnalysis) {
  const avgDept = deptAnalysis.length
    ? deptAnalysis.reduce((s, d) => s + d.score, 0) / deptAnalysis.length
    : baseAnalysis.governanceScore;
  const overall = dimensions.overall;
  const combined = (overall + avgDept) / 2;

  let level;
  let why;
  if (combined >= 85) {
    level = "Optimized";
    why = "Strong ownership, documentation, and risk distribution across departments indicate mature governance operations.";
  } else if (combined >= 70) {
    level = "Managed";
    why = "Governance processes are observable in the export with manageable risk gaps.";
  } else if (combined >= 55) {
    level = "Defined";
    why = "Inventory and partial controls exist but gaps in ownership or high-risk items need structured programs.";
  } else if (combined >= 40) {
    level = "Developing";
    why = "AI activity detected with limited governance signals — formal programs recommended before scaling.";
  } else {
    level = "Initial";
    why = "Minimal governance evidence in upload — establish inventory, owners, and review workflows.";
  }

  return { level, score: Math.round(combined), why };
}

function buildExecutiveInsights(records, analyzed, baseAnalysis, deptAnalysis, maturity) {
  const insights = [];
  const aiCount = baseAnalysis.aiCandidates;
  const deptCount = deptAnalysis.length;
  const topDept = [...deptAnalysis].sort((a, b) => b.aiCandidates - a.aiCandidates)[0];
  const unowned = analyzed.filter((a) => a.aiCandidate && a.owner === "Unassigned").length;

  if (aiCount === 0) {
    insights.push(
      "The uploaded inventory shows limited AI-related signals. Expanding export filters or labels may reveal hidden AI initiatives requiring governance."
    );
  } else if (aiCount / records.length > 0.3) {
    insights.push(
      `AI-related work represents a significant share (${Math.round((aiCount / records.length) * 100)}%) of scanned items — portfolio-level governance is warranted.`
    );
  } else {
    insights.push(
      `${aiCount} AI-related work items across ${records.length} work items indicate targeted AI adoption with room for centralized oversight.`
    );
  }

  if (unowned > 0) {
    insights.push(
      `${unowned} AI-related work item(s) lack assigned owners in the source export — accountability gaps increase governance and audit risk.`
    );
  } else if (aiCount > 0) {
    insights.push("AI-related work items in this export have identifiable owners, supporting accountability workflows.");
  }

  if (topDept && topDept.aiCandidates > 0) {
    insights.push(
      `${topDept.name} shows the highest AI-related work item concentration (${topDept.aiCandidates} items) — prioritize department-specific governance playbooks there.`
    );
  }

  if (baseAnalysis.riskSummary.high > 0) {
    insights.push(
      `${baseAnalysis.riskSummary.high} high-risk AI-related work item(s) should be reviewed before any production deployment or customer exposure.`
    );
  }

  if (deptCount > 3) {
    insights.push(
      `Work spans ${deptCount} departments/projects — a federated governance model with central standards and local execution is recommended.`
    );
  }

  insights.push(
    `Governance maturity is assessed at "${maturity.level}" (${maturity.score}/100 composite) based on ownership, documentation, risk, and workflow signals in this export.`
  );

  return insights.slice(0, 6);
}

function buildRecommendationsV22(baseAnalysis, deptAnalysis, maturity, heatmap) {
  const recs = [];
  const push = (title, why, benefit, priority, impact, govImprovement) => {
    recs.push({ title, why, businessBenefit: benefit, priority, estimatedImpact: impact, expectedGovernanceImprovement: govImprovement });
  };

  if (baseAnalysis.riskSummary.high > 0) {
    push(
      "Escalate high-risk AI-related work items",
      `${baseAnalysis.riskSummary.high} items classified high-risk in uploaded inventory.`,
      "Reduces regulatory and operational exposure before deployment.",
      "P0",
      "Risk reduction on highest-exposure items",
      "+8–15 governance score points when treated"
    );
  }

  const unownedDepts = deptAnalysis.filter((d) => d.weaknesses.some((w) => w.includes("owner")));
  if (unownedDepts.length > 0) {
    push(
      "Assign owners to all AI-related work items",
      "Export shows AI items without accountable assignees.",
      "Clear accountability for audit and executive reporting.",
      "P1",
      "Improved ownership dimension score",
      "+5–10 ownership score"
    );
  }

  if (maturity.level === "Initial" || maturity.level === "Developing") {
    push(
      "Establish AI inventory and review cadence",
      `Maturity assessed at ${maturity.level}.`,
      "Creates repeatable governance operating rhythm.",
      "P1",
      "Foundation for ISO 42001 and NIST alignment",
      "+10–20 composite maturity"
    );
  }

  push(
    "Operationalize reviews in Jira via AI Governance Hub",
    "Ongoing governance requires workflow tooling beyond one-time assessment.",
    "Continuous evidence, SLA tracking, and approval workflows.",
    "P2",
    "Sustained monitoring and audit trail",
    "Managed → Optimized maturity path"
  );

  if (heatmap.critical.length + heatmap.high.length > 5) {
    push(
      "Implement risk-tiered review SLAs",
      `${heatmap.critical.length + heatmap.high.length} elevated-risk items in heatmap.`,
      "Prioritizes limited governance capacity on highest impact items.",
      "P1",
      "Faster time-to-review on critical items",
      "+5 risk control score"
    );
  }

  return recs.slice(0, 8);
}

function buildExecutiveRoadmap(recommendations, baseAnalysis) {
  const p0 = recommendations.filter((r) => r.priority === "P0");
  const p1 = recommendations.filter((r) => r.priority === "P1");

  const days30 = [
    {
      action: p0[0]?.title || "Complete AI-related work item owner assignment",
      businessValue: "Accountability and audit readiness",
      ownerRecommendation: "AI Governance Lead / PMO",
      priority: "P0",
      expectedImprovement: "Ownership +5–10 points",
    },
    {
      action: "Document high-risk AI use cases",
      businessValue: "EU AI Act and internal policy evidence",
      ownerRecommendation: "Risk & Compliance",
      priority: "P0",
      expectedImprovement: "Risk controls +5 points",
    },
  ];

  const days60 = [
    {
      action: p1[0]?.title || "Launch governance review workflow",
      businessValue: "Structured approval before deployment",
      ownerRecommendation: "Engineering + Governance",
      priority: "P1",
      expectedImprovement: "Maturity → Defined/Managed",
    },
    {
      action: "Department governance scorecards",
      businessValue: "Executive visibility by team",
      ownerRecommendation: "PMO / CIO office",
      priority: "P1",
      expectedImprovement: "Portfolio oversight",
    },
  ];

  const days90 = [
    {
      action: "Framework mapping evidence pack",
      businessValue: "ISO 42001 / NIST audit preparation",
      ownerRecommendation: "Compliance",
      priority: "P2",
      expectedImprovement: "Framework alignment +10",
    },
    {
      action: "Quick-win automation pilot",
      businessValue: "Demonstrate ROI from highest-ROI opportunities",
      ownerRecommendation: "Operations + IT",
      priority: "P2",
      expectedImprovement: "Productivity gain validation",
    },
  ];

  return { days30, days60, days90 };
}

function buildExecutiveSummarySection(baseAnalysis, dimensions, maturity, insights, recommendations) {
  const aiReadiness = clamp(
    Math.round((dimensions.overall * 0.5 + (baseAnalysis.aiCandidates > 0 ? 30 : 0) + (100 - baseAnalysis.riskSummary.high * 10) * 0.2)),
    0,
    100
  );

  return {
    governanceScore: dimensions.overall,
    aiReadiness,
    topBusinessRisks: baseAnalysis.topRisks?.length
      ? baseAnalysis.topRisks
      : baseAnalysis.riskSummary.high > 0
        ? [`${baseAnalysis.riskSummary.high} high-risk AI-related work items in portfolio`]
        : ["No critical business risks identified in this snapshot"],
    topAiOpportunities: baseAnalysis.topOpportunities?.slice(0, 5) || [],
    overallRecommendation:
      recommendations[0]?.title ||
      "Maintain current governance posture and expand AI inventory coverage.",
    executiveConclusion: insights[0] || baseAnalysis.executiveSummary,
  };
}

const PLATFORM_LABELS = {
  jira: "Jira Cloud",
  "azure-devops": "Azure DevOps",
  excel: "Excel",
  csv: "CSV",
};

/**
 * Build v22 executive assessment from uploaded records and base analysis.
 * @param {object[]} records - Parsed CSV rows
 * @param {object} baseAnalysis - Output from analyzeRecords()
 * @param {object} context - { company, source, uploadDate, filename, planTier, planLabel, department }
 */
export function buildExecutiveAssessment(records, baseAnalysis, context = {}) {
  const analyzed = baseAnalysis.analyzed || [];
  const uploadDate = context.uploadDate || new Date().toISOString();
  const platform = PLATFORM_LABELS[context.source] || context.source || "CSV";

  const issueTypes = countByField(records, ["issue type", "type", "work item type"]);
  const priorities = countByField(records, ["priority", "severity"]);
  const statuses = countByField(records, ["status", "state"]);
  const projects = countByField(records, ["project", "project name", "department"]);
  const teams = countByField(records, ["assignee", "team", "component", "components"]);

  const dimensions = buildGovernanceDimensions(records, analyzed, baseAnalysis);
  const departmentAnalysis = buildDepartmentAnalysis(records, analyzed);
  const opportunityMatrix = buildOpportunityMatrix(records, analyzed);
  const businessImpact = buildBusinessImpact(records, analyzed, baseAnalysis);
  const frameworkMapping = buildFrameworkMappingV22(records, analyzed, baseAnalysis);
  const riskHeatmap = buildRiskHeatmap(analyzed, records);
  const maturity = determineMaturity(dimensions, baseAnalysis, departmentAnalysis);
  const executiveInsights = buildExecutiveInsights(records, analyzed, baseAnalysis, departmentAnalysis, maturity);
  const recommendations = buildRecommendationsV22(baseAnalysis, departmentAnalysis, maturity, riskHeatmap);
  const executiveRoadmap = buildExecutiveRoadmap(recommendations, baseAnalysis);
  const executiveSummary = buildExecutiveSummarySection(
    baseAnalysis,
    dimensions,
    maturity,
    executiveInsights,
    recommendations
  );

  return {
    version: "22.0",
    generatedAt: new Date().toISOString(),
    methodology: {
      summary: "All metrics are computed server-side from uploaded work items. No external data or generative AI is used.",
      governanceScore: "Composite of five 20-point dimensions: Ownership, Documentation, Risk Controls, Framework Alignment, Monitoring.",
      aiDetection: "Keyword and context matching on summary, description, and labels.",
      riskScoring: "Rule-based scoring from export fields and AI signals.",
      businessImpact: "Planning-range estimates with explicit assumptions — not financial guarantees.",
      departmentProxy: "Project/team field used as department when no explicit department column exists.",
    },
    executiveSummary,
    assessmentOverview: {
      company: context.company || "Not specified",
      department: context.department || "Portfolio-wide",
      projects: topEntries(projects, 15),
      uploadDate,
      platform,
      filename: context.filename || "",
      workItemCount: records.length,
      aiCandidateCount: baseAnalysis.aiCandidates,
      detectedTeams: topEntries(teams, 10),
      detectedIssueTypes: topEntries(issueTypes, 10),
      detectedPriorityDistribution: topEntries(priorities, 8),
      detectedWorkflow: topEntries(statuses, 8),
      planTier: context.planTier || "starter",
      planLabel: context.planLabel || "Starter",
    },
    governanceScoreBreakdown: {
      overall: dimensions.overall,
      dimensions: dimensions.dimensions,
      legacyScore: baseAnalysis.governanceScore,
      legacyRating: baseAnalysis.governanceRating,
    },
    aiOpportunityMatrix: opportunityMatrix,
    businessImpact,
    departmentAnalysis,
    frameworkMapping,
    riskHeatmap,
    executiveRoadmap,
    maturity,
    executiveInsights,
    recommendations,
    inventory: {
      aiCandidates: baseAnalysis.aiCandidateRows || analyzed.filter((a) => a.aiCandidate).slice(0, 100),
      totalRecords: baseAnalysis.totalRecords,
      riskSummary: baseAnalysis.riskSummary,
    },
  };
}

export function buildPreviewFromExecutive(executive, validation = null) {
  const preview = {
    version: "22.0",
    totalRecords: executive.inventory.totalRecords,
    aiCandidates: executive.assessmentOverview.aiCandidateCount,
    riskSummary: executive.inventory.riskSummary,
    governanceScore: executive.executiveSummary.governanceScore,
    governanceRating: executive.governanceScoreBreakdown.legacyRating,
    aiReadiness: executive.executiveSummary.aiReadiness,
    executiveSummary: executive.executiveSummary.executiveConclusion,
    topOpportunities: executive.executiveSummary.topAiOpportunities.slice(0, 3),
    maturityLevel: executive.maturity.level,
    locked: true,
    lockedFeatures: [
      "Full executive report (HTML, PDF, DOCX, PowerPoint)",
      "Governance score breakdown with WHY",
      "AI opportunity matrix",
      "Department analysis",
      "Risk heatmap",
      "Executive roadmap",
      "Business impact modeling",
    ],
  };

  if (validation) {
    preview.compatibility = validation.compatibility;
    preview.plan = validation.plan;
  }

  return preview;
}
