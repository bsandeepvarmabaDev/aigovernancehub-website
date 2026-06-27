/**
 * AI Governance Hub v22.0 — Report HTML template (consulting-grade)
 */
import { AI_RELATED_SHORT, getSourceItemLabels } from "./business-labels.js";

export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function progressBar(score, max, color) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return `<div class="progress-wrap"><div class="progress-bar" style="width:${pct}%;background:${color}"></div><span class="progress-label">${score}/${max}</span></div>`;
}

function heatClass(band) {
  const map = { Critical: "heat-critical", High: "heat-high", Medium: "heat-medium", Low: "heat-low" };
  return map[band] || "heat-low";
}

export function reportStyles() {
  return `
    @page { margin: 18mm; }
    @media print {
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      body { font-size: 11pt; }
    }
    :root {
      --navy: #0b1f3a;
      --blue: #2563eb;
      --ink: #0f172a;
      --muted: #64748b;
      --line: #e2e8f0;
      --green: #16a34a;
      --amber: #d97706;
      --red: #dc2626;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Inter, system-ui, sans-serif;
      color: var(--ink);
      line-height: 1.55;
      margin: 0;
      background: #f8fafc;
    }
    .report-shell { max-width: 960px; margin: 0 auto; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .cover {
      background: linear-gradient(135deg, #06111f 0%, #0b1f4d 100%);
      color: #fff;
      padding: 48px 40px;
    }
    .cover h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: -0.02em; }
    .cover .subtitle { opacity: .88; font-size: 16px; margin-bottom: 24px; }
    .cover-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
    .cover-meta div { background: rgba(255,255,255,.08); padding: 10px 14px; border-radius: 8px; }
    .content { padding: 32px 40px 48px; }
    h2 { color: var(--navy); border-bottom: 2px solid var(--blue); padding-bottom: 8px; margin: 32px 0 16px; font-size: 20px; }
    h2:first-child { margin-top: 0; }
    h3 { color: var(--navy); font-size: 16px; margin: 20px 0 10px; }
    .score-hero {
      display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px 24px; margin: 16px 0;
    }
    .score-circle {
      width: 88px; height: 88px; border-radius: 50%; background: var(--blue); color: #fff;
      display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800;
    }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 16px 0; }
    .kpi { border: 1px solid var(--line); border-radius: 10px; padding: 14px; text-align: center; }
    .kpi strong { display: block; font-size: 22px; color: var(--blue); }
    .kpi span { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
    .progress-wrap { background: #e2e8f0; border-radius: 999px; height: 22px; position: relative; margin: 8px 0; overflow: hidden; }
    .progress-bar { height: 100%; border-radius: 999px; transition: width .3s; }
    .progress-label { position: absolute; right: 8px; top: 2px; font-size: 11px; font-weight: 700; color: var(--ink); }
    .dim-row { margin-bottom: 14px; }
    .dim-row header { display: flex; justify-content: space-between; font-weight: 600; font-size: 14px; }
    .dim-why { font-size: 13px; color: var(--muted); margin: 4px 0 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th, td { border: 1px solid var(--line); padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; }
    .heat-critical { background: #fef2f2; color: #991b1b; font-weight: 700; }
    .heat-high { background: #fff7ed; color: #9a3412; }
    .heat-medium { background: #fefce8; color: #854d0e; }
    .heat-low { background: #f0fdf4; color: #166534; }
    .insight { border-left: 4px solid var(--blue); background: #f8fafc; padding: 12px 16px; margin: 10px 0; font-size: 14px; }
    .rec-card { border: 1px solid var(--line); border-radius: 10px; padding: 14px; margin: 10px 0; }
    .rec-card h4 { margin: 0 0 6px; font-size: 14px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .badge-p0 { background: #fecaca; color: #991b1b; }
    .badge-p1 { background: #fed7aa; color: #9a3412; }
    .badge-p2 { background: #dbeafe; color: #1e40af; }
    .methodology { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px; font-size: 12px; margin: 16px 0; }
    .disclaimer { border-left: 4px solid var(--amber); background: #fffbeb; padding: 12px 16px; margin: 24px 0; font-size: 13px; }
    .footer { font-size: 11px; color: var(--muted); margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--line); }
    ul.compact { margin: 8px 0; padding-left: 20px; }
    ul.compact li { margin: 4px 0; }
  `;
}

export function generateExecutiveHtmlReport(executive, meta) {
  const e = executive;
  const ex = e.executiveSummary;
  const gov = e.governanceScoreBreakdown;
  const overview = e.assessmentOverview;
  const itemLabels = getSourceItemLabels(meta.source || overview.platform);

  const dimHtml = gov.dimensions
    .map(
      (d) =>
        `<div class="dim-row"><header><span>${escapeHtml(d.label)}</span><span>${d.score}/${d.max}</span></header>${progressBar(d.score, d.max, "#2563eb")}<p class="dim-why">${escapeHtml(d.why)}</p></div>`
    )
    .join("");

  const deptHtml = e.departmentAnalysis
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.name)}</td><td><strong>${d.score}</strong></td><td>${d.workItems}</td><td>${d.aiCandidates}</td><td>${d.highRisk}</td></tr>`
    )
    .join("");

  const deptDetail = e.departmentAnalysis
    .map(
      (d) =>
        `<h3>${escapeHtml(d.name)} — Score ${d.score}</h3><p><strong>Strengths:</strong> ${d.strengths.map(escapeHtml).join("; ") || "—"}</p><p><strong>Weaknesses:</strong> ${d.weaknesses.map(escapeHtml).join("; ") || "—"}</p><p><strong>Recommendations:</strong> ${d.recommendations.map(escapeHtml).join("; ") || "—"}</p>`
    )
    .join("");

  function oppTable(list) {
    if (!list.length) return "<p>No items in this category for this upload.</p>";
    return `<table><thead><tr><th>Title</th><th>Category</th><th>Complexity</th><th>Priority</th><th>Impact</th></tr></thead><tbody>${list
      .map(
        (o) =>
          `<tr><td>${escapeHtml(o.title)}</td><td>${escapeHtml(o.suggestedAiCategory)}</td><td>${escapeHtml(o.estimatedComplexity)}</td><td>${escapeHtml(o.priority)}</td><td>${escapeHtml(o.expectedBusinessImpact)}</td></tr>`
      )
      .join("")}</tbody></table>`;
  }

  function riskSection(items, label) {
    if (!items.length) return "";
    return `<h3>${label} (${items.length})</h3><table><thead><tr><th>Item</th><th>Impact</th><th>Likelihood</th><th>Recommendation</th><th>Priority</th></tr></thead><tbody>${items
      .map(
        (r) =>
          `<tr><td class="${heatClass(r.band)}">${escapeHtml(r.title)}</td><td>${escapeHtml(r.businessImpact)}</td><td>${escapeHtml(r.likelihood)}</td><td>${escapeHtml(r.recommendation)}</td><td>${escapeHtml(r.priority)}</td></tr>`
      )
      .join("")}</tbody></table>`;
  }

  const frameworkHtml = Object.values(e.frameworkMapping)
    .map((f) => {
      const compliant = f.compliant?.length ? `<p><strong>Compliant:</strong> ${f.compliant.map(escapeHtml).join(", ")}</p>` : "";
      const partial = f.partial?.length ? `<p><strong>Partial:</strong> ${f.partial.map(escapeHtml).join(", ")}</p>` : "";
      const missing = f.missing?.length ? `<p><strong>Missing:</strong> ${f.missing.map(escapeHtml).join(", ")}</p>` : "";
      return `<h3>${escapeHtml(f.title)}</h3>${compliant}${partial}${missing}<p class="dim-why">${escapeHtml(f.explanation)}</p>`;
    })
    .join("");

  const recHtml = e.recommendations
    .map(
      (r) =>
        `<div class="rec-card"><h4>${escapeHtml(r.title)} <span class="badge badge-${r.priority.toLowerCase()}">${escapeHtml(r.priority)}</span></h4><p><strong>Why:</strong> ${escapeHtml(r.why)}</p><p><strong>Business benefit:</strong> ${escapeHtml(r.businessBenefit)}</p><p><strong>Estimated impact:</strong> ${escapeHtml(r.estimatedImpact)} · <strong>Governance improvement:</strong> ${escapeHtml(r.expectedGovernanceImprovement)}</p></div>`
    )
    .join("");

  function roadmapSection(title, items) {
    return `<h3>${title}</h3><table><thead><tr><th>Action</th><th>Business Value</th><th>Owner</th><th>Priority</th><th>Expected Improvement</th></tr></thead><tbody>${items
      .map(
        (i) =>
          `<tr><td>${escapeHtml(i.action)}</td><td>${escapeHtml(i.businessValue)}</td><td>${escapeHtml(i.ownerRecommendation)}</td><td>${escapeHtml(i.priority)}</td><td>${escapeHtml(i.expectedImprovement)}</td></tr>`
      )
      .join("")}</tbody></table>`;
  }

  const bi = e.businessImpact;
  const assumptions = bi.assumptions.map((a) => `<li>${escapeHtml(a)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AI Governance Executive Assessment — ${escapeHtml(meta.company || meta.buyerName || "Client")}</title>
  <style>${reportStyles()}</style>
</head>
<body>
<div class="report-shell">
  <div class="cover">
    <span class="board-badge">Board-Ready Deliverable</span>
    <p style="opacity:.7;font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px">AI Governance Hub · v25.22</p>
    <h1>Executive AI Governance Assessment</h1>
    <p class="subtitle">Consulting-grade intelligence report — derived from your uploaded portfolio data</p>
    <div class="cover-meta">
      <div><strong>Prepared for</strong><br/>${escapeHtml(meta.buyerName || "Customer")}${meta.company ? `<br/>${escapeHtml(meta.company)}` : ""}</div>
      <div><strong>Assessment date</strong><br/>${escapeHtml(new Date(overview.uploadDate).toLocaleDateString())}</div>
      <div><strong>Platform</strong><br/>${escapeHtml(overview.platform)}</div>
      <div><strong>Reference</strong><br/>${escapeHtml(meta.orderRef || meta.orderId || "—")}</div>
    </div>
  </div>
  <div class="content">
    <h2>1. Executive Summary</h2>
    <div class="score-hero">
      <div class="score-circle">${ex.governanceScore}</div>
      <div>
        <p><strong>Overall Governance Score</strong> — composite of ownership, documentation, risk controls, framework alignment, and monitoring.</p>
        <p><strong>AI Readiness:</strong> ${ex.aiReadiness}/100</p>
        <p><strong>Maturity:</strong> ${escapeHtml(e.maturity.level)} — ${escapeHtml(e.maturity.why)}</p>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi"><strong>${overview.workItemCount}</strong><span>${escapeHtml(itemLabels.plural)}</span></div>
      <div class="kpi"><strong>${overview.aiCandidateCount}</strong><span>${escapeHtml(AI_RELATED_SHORT)}</span></div>
      <div class="kpi"><strong>${e.inventory.riskSummary.high}</strong><span>High Risk</span></div>
      <div class="kpi"><strong>${e.inventory.riskSummary.medium}</strong><span>Medium Risk</span></div>
      <div class="kpi"><strong>${overview.projects.length}</strong><span>Projects</span></div>
    </div>
    <h3>Top Business Risks</h3>
    <ul class="compact">${ex.topBusinessRisks.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    <h3>Top AI Opportunities</h3>
    <ul class="compact">${ex.topAiOpportunities.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    <h3>Overall Recommendation</h3>
    <p class="insight">${escapeHtml(ex.overallRecommendation)}</p>
    <h3>Executive Conclusion</h3>
    <p>${escapeHtml(ex.executiveConclusion)}</p>

    <h2 class="page-break">2. Assessment Overview</h2>
    <table>
      <tr><th>Company</th><td>${escapeHtml(overview.company)}</td></tr>
      <tr><th>Department scope</th><td>${escapeHtml(overview.department)}</td></tr>
      <tr><th>Upload date</th><td>${escapeHtml(new Date(overview.uploadDate).toLocaleString())}</td></tr>
      <tr><th>Platform</th><td>${escapeHtml(overview.platform)}</td></tr>
      <tr><th>Work items</th><td>${overview.workItemCount}</td></tr>
      <tr><th>Plan tier</th><td>${escapeHtml(overview.planLabel)}</td></tr>
    </table>
    <h3>Projects</h3>
    <table><thead><tr><th>Project</th><th>Items</th></tr></thead><tbody>${overview.projects.map((p) => `<tr><td>${escapeHtml(p.name)}</td><td>${p.count}</td></tr>`).join("")}</tbody></table>
    <h3>Issue Types · Priority · Workflow</h3>
    <table><thead><tr><th>Issue Type</th><th>Count</th><th>Priority</th><th>Count</th><th>Status</th><th>Count</th></tr></thead><tbody>${Math.max(overview.detectedIssueTypes.length, overview.detectedPriorityDistribution.length, overview.detectedWorkflow.length) > 0 ? Array.from({ length: Math.max(overview.detectedIssueTypes.length, overview.detectedPriorityDistribution.length, overview.detectedWorkflow.length) }).map((_, i) => `<tr><td>${escapeHtml(overview.detectedIssueTypes[i]?.name || "")}</td><td>${overview.detectedIssueTypes[i]?.count || ""}</td><td>${escapeHtml(overview.detectedPriorityDistribution[i]?.name || "")}</td><td>${overview.detectedPriorityDistribution[i]?.count || ""}</td><td>${escapeHtml(overview.detectedWorkflow[i]?.name || "")}</td><td>${overview.detectedWorkflow[i]?.count || ""}</td></tr>`).join("") : "<tr><td colspan='6'>—</td></tr>"}</tbody></table>

    <h2 class="page-break">3. Governance Score Breakdown</h2>
    <p>Overall score: <strong>${gov.overall}/100</strong>. Each dimension explains WHY based on observable export data.</p>
    ${dimHtml}

    <h2 class="page-break">4. AI Opportunity Matrix</h2>
    <h3>Highest ROI Opportunities</h3>${oppTable(e.aiOpportunityMatrix.highestRoi)}
    <h3>Highest Risk Opportunities</h3>${oppTable(e.aiOpportunityMatrix.highestRisk)}
    <h3>Quick Wins</h3>${oppTable(e.aiOpportunityMatrix.quickWins)}
    <h3>Long-term Initiatives</h3>${oppTable(e.aiOpportunityMatrix.longTerm)}

    <h2 class="page-break">5. Business Impact (Estimated)</h2>
    <div class="methodology"><strong>Methodology &amp; assumptions</strong><ul>${assumptions}</ul></div>
    <table>
      <tr><th>Manual hours (weekly range)</th><td>${bi.potentialManualHoursPerWeek.low}–${bi.potentialManualHoursPerWeek.high} hours</td></tr>
      <tr><th>Automation-eligible share</th><td>${bi.potentialAutomationPercent.value}% (${escapeHtml(bi.potentialAutomationPercent.basis)})</td></tr>
      <tr><th>Annual time savings (range)</th><td>${bi.estimatedTimeSavingsAnnualHours.low}–${bi.estimatedTimeSavingsAnnualHours.high} hours/year</td></tr>
      <tr><th>Annual savings (USD range)</th><td>$${bi.estimatedAnnualSavingsUsd.low.toLocaleString()}–$${bi.estimatedAnnualSavingsUsd.high.toLocaleString()} (${escapeHtml(bi.estimatedAnnualSavingsUsd.basis)})</td></tr>
      <tr><th>Productivity gain (estimated)</th><td>${bi.estimatedProductivityGainPercent.value}% (${escapeHtml(bi.estimatedProductivityGainPercent.basis)})</td></tr>
    </table>

    <h2 class="page-break">6. Department Analysis</h2>
    <table><thead><tr><th>Department / Project</th><th>Score</th><th>Items</th><th>AI-related</th><th>High Risk</th></tr></thead><tbody>${deptHtml || "<tr><td colspan='5'>No departments detected</td></tr>"}</tbody></table>
    ${deptDetail}

    <h2 class="page-break">7. Framework Mapping</h2>
    ${frameworkHtml}

    <h2 class="page-break">8. Risk Heatmap</h2>
    ${riskSection(e.riskHeatmap.critical, "Critical")}
    ${riskSection(e.riskHeatmap.high, "High")}
    ${riskSection(e.riskHeatmap.medium, "Medium")}
    ${riskSection(e.riskHeatmap.low, "Low")}

    <h2 class="page-break">9. Executive Roadmap</h2>
    ${roadmapSection("Next 30 Days", e.executiveRoadmap.days30)}
    ${roadmapSection("Next 60 Days", e.executiveRoadmap.days60)}
    ${roadmapSection("Next 90 Days", e.executiveRoadmap.days90)}

    <h2 class="page-break">10. AI Governance Maturity</h2>
    <p><strong>Level:</strong> ${escapeHtml(e.maturity.level)} (${e.maturity.score}/100)</p>
    <p>${escapeHtml(e.maturity.why)}</p>

    <h2>11. Executive Insights</h2>
    ${e.executiveInsights.map((i) => `<div class="insight">${escapeHtml(i)}</div>`).join("")}

    <h2>12. Recommendations</h2>
    ${recHtml}

    <p class="disclaimer"><strong>Disclaimer:</strong> This executive assessment supports governance planning and is not legal, regulatory, or compliance certification. Business impact figures are planning estimates with documented assumptions — not guaranteed financial outcomes.</p>
    <p class="footer">AI Governance Hub · Executive AI Governance Assessment · Generated ${escapeHtml(e.generatedAt)} · Reference ${escapeHtml(meta.orderRef || "")} · Prepared for board and audit review — not legal certification.</p>
  </div>
</div>
</body>
</html>`;
}

export function generateExecutiveTextReport(executive, meta) {
  const lines = [
    "AI GOVERNANCE EXECUTIVE ASSESSMENT — v22.0",
    "=".repeat(60),
    `Prepared for: ${meta.buyerName || "Customer"}`,
    meta.company ? `Company: ${meta.company}` : "",
    `Reference: ${meta.orderRef || meta.orderId || ""}`,
    `Generated: ${executive.generatedAt}`,
    "",
    "EXECUTIVE SUMMARY",
    `Governance Score: ${executive.executiveSummary.governanceScore}/100`,
    `AI Readiness: ${executive.executiveSummary.aiReadiness}/100`,
    `Maturity: ${executive.maturity.level}`,
    executive.executiveSummary.executiveConclusion,
    "",
    "GOVERNANCE SCORE BREAKDOWN",
  ];
  executive.governanceScoreBreakdown.dimensions.forEach((d) => {
    lines.push(`  ${d.label}: ${d.score}/${d.max} — ${d.why}`);
  });
  lines.push("", "EXECUTIVE INSIGHTS");
  executive.executiveInsights.forEach((i) => lines.push(`  • ${i}`));
  lines.push("", "RECOMMENDATIONS");
  executive.recommendations.forEach((r) => {
    lines.push(`  [${r.priority}] ${r.title}`);
    lines.push(`    Why: ${r.why}`);
    lines.push(`    Benefit: ${r.businessBenefit}`);
  });
  lines.push("", "DISCLAIMER: Not legal certification. Business impact = planning estimates.");
  return lines.filter(Boolean).join("\n");
}
