/**
 * AI Governance Hub v24.0 — Board-ready executive presentation (15–20 slides)
 */

async function loadPptxGenJS() {
  const mod = await import("pptxgenjs");
  return mod.default;
}

export async function generateExecutiveBoardPptx(executive, meta) {
  const PptxGenJS = await loadPptxGenJS();
  const pptx = new PptxGenJS();
  pptx.author = "AI Governance Hub";
  pptx.title = "AI Governance — Board Executive Briefing";
  pptx.subject = meta.orderRef || "";

  const ex = executive.executiveSummary;
  const navy = "0B1F3A";
  const blue = "2563EB";
  const industry = executive.industryProfile?.label || executive.industryContext?.profile || "Enterprise";

  function sectionSlide(title, bullets) {
    const slide = pptx.addSlide();
    slide.addText(title, { x: 0.5, y: 0.35, w: 9, fontSize: 24, color: navy, bold: true });
    slide.addText(bullets.join("\n"), { x: 0.5, y: 1.1, w: 9, h: 4.2, fontSize: 13, valign: "top" });
    return slide;
  }

  const cover = pptx.addSlide();
  cover.background = { color: navy };
  cover.addText("AI Governance Executive Briefing", {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 1,
    fontSize: 34,
    color: "FFFFFF",
    bold: true,
  });
  cover.addText(
    `${meta.buyerName || "Board Review"}${meta.company ? " · " + meta.company : ""}\n${industry} · ${new Date(executive.assessmentOverview?.uploadDate || Date.now()).toLocaleDateString()}`,
    { x: 0.5, y: 2.4, w: 9, h: 1.2, fontSize: 14, color: "BFDBFE" }
  );

  sectionSlide("Agenda", [
    "1. Executive summary & KPIs",
    "2. Industry & regulatory context",
    "3. Governance score & maturity",
    "4. Risk heatmap & critical items",
    "5. AI opportunities & ROI",
    "6. Department health",
    "7. Framework alignment",
    "8. 30/60/90 roadmap & board decisions",
  ]);

  sectionSlide("Executive KPIs at a Glance", [
    `Governance Score: ${ex.governanceScore}/100`,
    `AI Readiness: ${ex.aiReadiness}/100`,
    `Maturity Level: ${executive.maturity?.level}`,
    `Work Items Assessed: ${executive.assessmentOverview?.workItemCount}`,
    `AI-related work items: ${executive.assessmentOverview?.aiCandidateCount}`,
    `Critical Risks: ${executive.riskHeatmap?.critical?.length || 0}`,
    "",
    ex.executiveConclusion?.slice(0, 400) || "",
  ]);

  if (executive.industryContext) {
    sectionSlide(`Industry Context — ${industry}`, [
      executive.industryContext.regulatoryLens,
      "",
      `Risk emphasis: ${executive.industryContext.riskEmphasis}`,
      `Opportunity emphasis: ${executive.industryContext.opportunityEmphasis}`,
      "",
      `Primary frameworks: ${(executive.industryContext.primaryFrameworks || []).join(", ")}`,
      "",
      executive.industryContext.disclaimer,
    ]);
  }

  const dimSlide = pptx.addSlide();
  dimSlide.addText("Governance Score Breakdown", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  const dimRows = [["Dimension", "Score", "Rationale"]];
  (executive.governanceScoreBreakdown?.dimensions || []).forEach((d) => {
    dimRows.push([d.label, `${d.score}/${d.max}`, d.why.slice(0, 100)]);
  });
  dimSlide.addTable(dimRows, { x: 0.5, y: 1, w: 9, fontSize: 10, colW: [1.8, 0.7, 6.5] });

  sectionSlide("Maturity Assessment", [
    `Current Level: ${executive.maturity?.level}`,
    `Maturity Score: ${executive.maturity?.score ?? "N/A"}/100`,
    "",
    executive.maturity?.why || "Derived from governance dimensions and department coverage.",
  ]);

  const riskSlide = pptx.addSlide();
  riskSlide.addText("Risk Heatmap", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  riskSlide.addTable(
    [
      ["Band", "Count"],
      ["Critical", String(executive.riskHeatmap?.critical?.length || 0)],
      ["High", String(executive.riskHeatmap?.high?.length || 0)],
      ["Medium", String(executive.riskHeatmap?.medium?.length || 0)],
      ["Low", String(executive.riskHeatmap?.low?.length || 0)],
    ],
    { x: 2.5, y: 1.2, w: 4.5, fontSize: 14 }
  );
  const topCritical = (executive.riskHeatmap?.critical || []).slice(0, 4).map((r) => `• ${r.title || r.name}`);
  if (topCritical.length) {
    riskSlide.addText("Critical items:\n" + topCritical.join("\n"), { x: 0.5, y: 3.2, w: 9, fontSize: 11 });
  }

  sectionSlide("Top Business Risks", ex.topBusinessRisks?.map((r) => `• ${r}`) || ["No elevated risks detected."]);

  const oppSlide = pptx.addSlide();
  oppSlide.addText("AI Opportunity Matrix", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  const matrix = executive.aiOpportunityMatrix || {};
  oppSlide.addText(
    [
      "Highest ROI:",
      ...(matrix.highestRoi || []).slice(0, 3).map((o) => `• ${o.title}`),
      "",
      "Quick Wins:",
      ...(matrix.quickWins || []).slice(0, 3).map((o) => `• ${o.title}`),
      "",
      "Long-term:",
      ...(matrix.longTerm || []).slice(0, 2).map((o) => `• ${o.title}`),
    ].join("\n"),
    { x: 0.5, y: 1, w: 4.2, h: 4, fontSize: 11 }
  );
  oppSlide.addText(
    [
      "Highest Risk AI:",
      ...(matrix.highestRisk || []).slice(0, 4).map((o) => `• ${o.title}`),
    ].join("\n"),
    { x: 5, y: 1, w: 4.5, h: 4, fontSize: 11 }
  );

  const deptSlide = pptx.addSlide();
  deptSlide.addText("Department / Project Health", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  const deptRows = [["Department", "Score", "AI Items", "High Risk"]];
  (executive.departmentAnalysis || []).slice(0, 10).forEach((d) => {
    deptRows.push([d.name, String(d.score), String(d.aiCandidates), String(d.highRisk)]);
  });
  deptSlide.addTable(deptRows, { x: 0.5, y: 1, w: 9, fontSize: 11 });

  sectionSlide("Framework Alignment", Object.values(executive.frameworkMapping || {}).map((f) => `${f.title}: ${f.explanation?.slice(0, 120)}`));

  const bi = executive.businessImpact;
  if (bi) {
    sectionSlide("Business Impact (Planning Estimates)", [
      `Automation-eligible work: ${bi.potentialAutomationPercent?.value ?? "N/A"}%`,
      `Annual hours saved (range): ${bi.estimatedTimeSavingsAnnualHours?.low}–${bi.estimatedTimeSavingsAnnualHours?.high}`,
      `Annual savings USD (range): $${bi.estimatedAnnualSavingsUsd?.low?.toLocaleString()}–$${bi.estimatedAnnualSavingsUsd?.high?.toLocaleString()}`,
      "",
      "Assumptions documented in full assessment. Not a financial guarantee.",
    ]);
  }

  sectionSlide("30 / 60 / 90 Day Roadmap", [
    ...(executive.executiveRoadmap?.days30 || []).map((i) => `[30d] ${i.action}`),
    ...(executive.executiveRoadmap?.days60 || []).map((i) => `[60d] ${i.action}`),
    ...(executive.executiveRoadmap?.days90 || []).map((i) => `[90d] ${i.action}`),
  ]);

  sectionSlide("Priority Recommendations", (executive.recommendations || []).slice(0, 7).map((r) => `[${r.priority}] ${r.title}\n   ${r.businessBenefit?.slice(0, 80)}`));

  sectionSlide("Benchmarking Readiness", [
    "Peer benchmarking architecture is prepared for future opt-in participation.",
    "No fabricated industry averages are displayed in this release.",
    "Minimum sample size: 10 anonymized organizations per industry cohort.",
    "",
    "Your organization may opt in via Trust Center when available.",
  ]);

  const close = pptx.addSlide();
  close.background = { color: navy };
  close.addText("Board Decision Points", { x: 0.5, y: 0.8, w: 9, fontSize: 28, color: "FFFFFF", bold: true });
  close.addText(
    [
      "1. Approve AI governance operating model ownership",
      "2. Fund priority risk remediation (critical/high items)",
      "3. Sanction quick-win AI pilots with guardrails",
      "4. Schedule quarterly governance re-assessment",
      "",
      ex.overallRecommendation || "",
    ].join("\n"),
    { x: 0.5, y: 1.8, w: 9, h: 3, fontSize: 14, color: "BFDBFE" }
  );
  close.addText("AI Governance Hub · v24.0 Board Briefing", { x: 0.5, y: 4.8, w: 9, fontSize: 10, color: "94A3B8" });

  const data = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(data);
}

export async function generateAllExecutiveFormatsV24(executive, meta) {
  const { generateExecutiveHtmlReport, generateExecutiveTextReport } = await import("./report-html-v22.js");
  const { generateExecutivePdfReport, generateExecutiveDocxReport } = await import("./report-export-v22.js");
  // Only the board deck is ever delivered (pptxBoard always wins over pptxStandard
  // below), so generating the standard deck was pure wasted work on every paid
  // order — a full extra PPTX render, on a serverless function with no extended
  // timeout. Removed to cut total generation time and reduce timeout risk.
  const [html, text, pdf, docx, pptxBoard] = await Promise.all([
    Promise.resolve(generateExecutiveHtmlReport(executive, meta)),
    Promise.resolve(generateExecutiveTextReport(executive, meta)),
    generateExecutivePdfReport(executive, meta),
    generateExecutiveDocxReport(executive, meta),
    generateExecutiveBoardPptx(executive, meta),
  ]);
  return { html, text, pdf, docx, pptx: pptxBoard };
}
