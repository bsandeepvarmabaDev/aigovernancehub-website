/**
 * AI Governance Hub v22.0 — DOCX, PPTX, PDF export (server-side only)
 */
import { createRequire } from "module";
import PDFDocument from "pdfkit";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

function pdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

// PDFKit's default Helvetica font uses WinAnsiEncoding, which has no glyph for
// "→" (renders as garbled "!'"). The same source strings render fine in the
// HTML/PPTX exports (different renderers, full Unicode) — only the PDF path
// needs ASCII-safe substitutes.
function sanitizeForPdf(value) {
  if (typeof value !== "string") return value;
  return value.replace(/→/g, "->").replace(/←/g, "<-");
}

const COLORS = {
  navy: "#0b1f3a",
  blue: "#2563eb",
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  headerBg: "#f1f5f9",
  blueBg: "#eff6ff",
  blueBorder: "#bfdbfe",
  amberBg: "#fffbeb",
  amberBorder: "#fcd34d",
  amber: "#d97706",
  white: "#ffffff",
};

const BADGE_COLORS = {
  p0: { bg: "#fecaca", fg: "#991b1b" },
  p1: { bg: "#fed7aa", fg: "#9a3412" },
  p2: { bg: "#dbeafe", fg: "#1e40af" },
  p3: { bg: "#e2e8f0", fg: "#334155" },
  critical: { bg: "#fecaca", fg: "#991b1b" },
  high: { bg: "#fed7aa", fg: "#9a3412" },
  medium: { bg: "#fef08a", fg: "#854d0e" },
  low: { bg: "#bbf7d0", fg: "#166534" },
};

/**
 * Visually rich PDF export using PDFKit primitives (rects, circles, manual
 * table layout) — mirrors the HTML report's design system (navy/blue palette,
 * bordered tables, score circle, priority badges) since the original PDF was
 * plain black-on-white text with no visual design, a real gap for a
 * "board-ready" paid deliverable next to the HTML/PPTX versions.
 */
export async function generateExecutivePdfReport(executive, meta) {
  const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
  const originalText = doc.text.bind(doc);
  doc.text = (str, ...args) => originalText(sanitizeForPdf(str), ...args);
  const ex = executive.executiveSummary;
  const pageWidth = doc.page.width;
  const marginX = doc.page.margins.left;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;

  function ensureSpace(height) {
    if (doc.y + height > bottomLimit) doc.addPage();
  }

  function sectionHeading(text) {
    ensureSpace(40);
    doc.moveDown(0.6);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.blue).text(text, marginX, doc.y, { width: contentWidth });
    const ruleY = doc.y + 2;
    doc.moveTo(marginX, ruleY).lineTo(marginX + contentWidth, ruleY).lineWidth(1.5).strokeColor(COLORS.blue).stroke();
    doc.moveDown(0.5);
  }

  function subheading(text) {
    ensureSpace(20);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.navy).text(text, marginX, doc.y, { width: contentWidth });
    doc.moveDown(0.2);
  }

  function bodyText(text, opts = {}) {
    doc.font("Helvetica").fontSize(opts.size || 10).fillColor(opts.color || COLORS.ink);
    ensureSpace(doc.heightOfString(text, { width: contentWidth }) + 4);
    doc.text(text, marginX, doc.y, { width: contentWidth, align: opts.align || "left" });
  }

  function bulletList(items, opts = {}) {
    doc.font("Helvetica").fontSize(opts.size || 10).fillColor(opts.color || COLORS.ink);
    items.forEach((i) => {
      const h = doc.heightOfString(`•  ${i}`, { width: contentWidth - 10 });
      ensureSpace(h + 4);
      doc.text(`•  ${i}`, marginX, doc.y, { width: contentWidth, align: "left" });
    });
  }

  function badge(text, scheme, x, y) {
    const colors = BADGE_COLORS[scheme.toLowerCase()] || BADGE_COLORS.p2;
    doc.font("Helvetica-Bold").fontSize(8);
    const w = doc.widthOfString(text) + 12;
    const h = 14;
    doc.roundedRect(x, y, w, h, 7).fill(colors.bg);
    doc.fillColor(colors.fg).text(text, x + 6, y + 3, { width: w - 12, lineBreak: false });
    return w;
  }

  function insightBox(text) {
    doc.font("Helvetica").fontSize(10);
    const textHeight = doc.heightOfString(text, { width: contentWidth - 20 });
    const boxHeight = textHeight + 14;
    ensureSpace(boxHeight + 6);
    const y0 = doc.y;
    doc.rect(marginX, y0, contentWidth, boxHeight).fill(COLORS.headerBg);
    doc.rect(marginX, y0, 4, boxHeight).fill(COLORS.blue);
    doc.fillColor(COLORS.ink).text(text, marginX + 14, y0 + 7, { width: contentWidth - 28 });
    doc.y = y0 + boxHeight + 6;
  }

  function disclaimerBox(text) {
    doc.font("Helvetica").fontSize(9);
    const textHeight = doc.heightOfString(text, { width: contentWidth - 20 });
    const boxHeight = textHeight + 14;
    ensureSpace(boxHeight + 6);
    const y0 = doc.y;
    doc.rect(marginX, y0, contentWidth, boxHeight).fill(COLORS.amberBg);
    doc.rect(marginX, y0, 4, boxHeight).fill(COLORS.amber);
    doc.fillColor(COLORS.muted).text(text, marginX + 14, y0 + 7, { width: contentWidth - 28 });
    doc.y = y0 + boxHeight + 6;
  }

  /** Simple bordered table with a colored header row; page-break aware. */
  function drawTable(headers, rows, colWeights) {
    if (!rows.length) {
      bodyText("No items in this category for this upload.", { size: 9, color: COLORS.muted });
      doc.moveDown(0.3);
      return;
    }
    const weights = colWeights || headers.map(() => 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const colWidths = weights.map((w) => (w / totalWeight) * contentWidth);
    const cellPad = 5;

    function rowHeight(cells) {
      doc.font("Helvetica").fontSize(8.5);
      return Math.max(
        ...cells.map((c, i) => doc.heightOfString(String(c ?? ""), { width: colWidths[i] - cellPad * 2 }))
      ) + cellPad * 2;
    }

    function drawRow(cells, opts = {}) {
      const h = rowHeight(cells);
      ensureSpace(h);
      const y0 = doc.y;
      let x = marginX;
      if (opts.headerRow) doc.rect(marginX, y0, contentWidth, h).fill(COLORS.headerBg);
      cells.forEach((c, i) => {
        doc
          .font(opts.headerRow ? "Helvetica-Bold" : "Helvetica")
          .fontSize(8.5)
          .fillColor(opts.headerRow ? COLORS.navy : COLORS.ink)
          .text(String(c ?? ""), x + cellPad, y0 + cellPad, { width: colWidths[i] - cellPad * 2 });
        x += colWidths[i];
      });
      doc.rect(marginX, y0, contentWidth, h).strokeColor(COLORS.line).lineWidth(0.5).stroke();
      x = marginX;
      colWidths.forEach((w) => {
        x += w;
        doc.moveTo(x, y0).lineTo(x, y0 + h).strokeColor(COLORS.line).lineWidth(0.5).stroke();
      });
      doc.y = y0 + h;
    }

    drawRow(headers, { headerRow: true });
    rows.forEach((r) => drawRow(r));
    doc.moveDown(0.4);
  }

  // ---- Cover band ----
  const coverHeight = 110;
  doc.rect(0, 0, pageWidth, coverHeight).fill(COLORS.navy);
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(COLORS.white)
    .text("AI Governance Executive Assessment", marginX, 30, { width: contentWidth, align: "center" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#bfdbfe")
    .text(`Prepared for ${meta.buyerName || "Customer"}${meta.company ? " · " + meta.company : ""}`, marginX, 62, {
      width: contentWidth,
      align: "center",
    });
  doc.text(`Reference: ${meta.orderRef || meta.orderId || ""}`, marginX, 80, { width: contentWidth, align: "center" });
  doc.y = coverHeight + 20;

  // ---- 1. Executive Summary ----
  sectionHeading("1. Executive Summary");

  const heroY = doc.y;
  const heroHeight = 90;
  doc.roundedRect(marginX, heroY, contentWidth, heroHeight, 10).fillAndStroke(COLORS.blueBg, COLORS.blueBorder);
  const circleCx = marginX + 55;
  const circleCy = heroY + heroHeight / 2;
  doc.circle(circleCx, circleCy, 40).fill(COLORS.blue);
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(COLORS.white)
    .text(String(ex.governanceScore), circleCx - 40, circleCy - 15, { width: 80, align: "center" });
  const heroTextX = marginX + 120;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text("Overall Governance Score", heroTextX, heroY + 14, { width: contentWidth - 140 });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text("Composite of ownership, documentation, risk controls, framework alignment, and monitoring.", heroTextX, doc.y + 2, {
      width: contentWidth - 140,
    });
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink).text(`AI Readiness: ${ex.aiReadiness}/100`, heroTextX, doc.y + 6);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.ink)
    .text(`Maturity: ${executive.maturity.level} — ${executive.maturity.why}`, heroTextX, doc.y + 2, {
      width: contentWidth - 140,
    });
  doc.y = heroY + heroHeight + 14;

  subheading("Top Business Risks");
  bulletList(ex.topBusinessRisks);
  doc.moveDown(0.3);
  subheading("Top AI Opportunities");
  bulletList(ex.topAiOpportunities);
  doc.moveDown(0.3);
  subheading("Overall Recommendation");
  insightBox(ex.overallRecommendation);
  subheading("Executive Conclusion");
  bodyText(ex.executiveConclusion, { align: "justify" });

  // ---- 2. Governance Score Breakdown ----
  doc.addPage();
  sectionHeading("2. Governance Score Breakdown");
  bodyText(`Overall score: ${executive.governanceScoreBreakdown.overall}/100`, { size: 10 });
  doc.moveDown(0.3);
  executive.governanceScoreBreakdown.dimensions.forEach((d) => {
    ensureSpace(30);
    const barY = doc.y;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.ink).text(d.label, marginX, barY, { width: contentWidth - 60 });
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.blue).text(`${d.score}/${d.max}`, marginX + contentWidth - 60, barY, {
      width: 60,
      align: "right",
    });
    const barTop = doc.y + 2;
    const barWidth = contentWidth;
    doc.roundedRect(marginX, barTop, barWidth, 8, 4).fill(COLORS.line);
    const fillWidth = Math.max(6, (d.score / d.max) * barWidth);
    doc.roundedRect(marginX, barTop, fillWidth, 8, 4).fill(COLORS.blue);
    doc.y = barTop + 14;
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text(d.why, marginX, doc.y, { width: contentWidth, align: "justify" });
    doc.moveDown(0.5);
  });

  // ---- 3. AI Opportunity Matrix ----
  sectionHeading("3. AI Opportunity Matrix");
  const oppHeaders = ["Title", "Category", "Complexity", "Priority", "Impact"];
  const oppWeights = [2, 1.6, 1, 1, 2.6];
  const oppRow = (o) => [o.title, o.suggestedAiCategory, o.estimatedComplexity, o.priority, o.expectedBusinessImpact];
  subheading("Highest ROI Opportunities");
  drawTable(oppHeaders, executive.aiOpportunityMatrix.highestRoi.map(oppRow), oppWeights);
  subheading("Highest Risk Opportunities");
  drawTable(oppHeaders, executive.aiOpportunityMatrix.highestRisk.map(oppRow), oppWeights);
  subheading("Quick Wins");
  drawTable(oppHeaders, executive.aiOpportunityMatrix.quickWins.map(oppRow), oppWeights);
  subheading("Long-term Initiatives");
  drawTable(oppHeaders, executive.aiOpportunityMatrix.longTerm.map(oppRow), oppWeights);

  // ---- 4. Business Impact ----
  doc.addPage();
  sectionHeading("4. Business Impact (Estimated)");
  const bi = executive.businessImpact;
  subheading("Methodology & assumptions");
  bulletList(bi.assumptions, { size: 9, color: COLORS.muted });
  doc.moveDown(0.3);
  drawTable(
    ["Metric", "Value"],
    [
      ["Manual hours (weekly range)", `${bi.potentialManualHoursPerWeek.low}–${bi.potentialManualHoursPerWeek.high} hours`],
      ["Automation-eligible share", `${bi.potentialAutomationPercent.value}% (${bi.potentialAutomationPercent.basis})`],
      [
        "Annual time savings (range)",
        `${bi.estimatedTimeSavingsAnnualHours.low}–${bi.estimatedTimeSavingsAnnualHours.high} hours/year`,
      ],
      [
        "Annual savings (USD range)",
        `$${bi.estimatedAnnualSavingsUsd.low.toLocaleString()}–$${bi.estimatedAnnualSavingsUsd.high.toLocaleString()}`,
      ],
      ["Productivity gain (estimated)", `${bi.estimatedProductivityGainPercent.value}%`],
    ],
    [1.4, 2]
  );

  // ---- 5. Department Analysis ----
  doc.addPage();
  sectionHeading("5. Department Analysis");
  drawTable(
    ["Department", "Score", "Items", "AI-related", "High Risk"],
    executive.departmentAnalysis.map((d) => [d.name, d.score, d.workItems, d.aiCandidates, d.highRisk]),
    [2, 1, 1, 1, 1]
  );

  // ---- 6. Framework Mapping ----
  sectionHeading("6. Framework Mapping");
  Object.values(executive.frameworkMapping).forEach((f) => {
    ensureSpace(60);
    subheading(f.title);
    if (f.compliant?.length) bodyText(`Compliant: ${f.compliant.join(", ")}`, { size: 9 });
    if (f.partial?.length) bodyText(`Partial: ${f.partial.join(", ")}`, { size: 9 });
    if (f.missing?.length) bodyText(`Missing: ${f.missing.join(", ")}`, { size: 9 });
    bodyText(f.explanation, { size: 9, color: COLORS.muted, align: "justify" });
    doc.moveDown(0.4);
  });

  // ---- 7. Risk Heatmap ----
  doc.addPage();
  sectionHeading("7. Risk Heatmap");
  const riskHeaders = ["Item", "Impact", "Likelihood", "Recommendation", "Priority"];
  const riskWeights = [1.4, 2, 1, 2, 0.8];
  [
    ["Critical", executive.riskHeatmap.critical],
    ["High", executive.riskHeatmap.high],
    ["Medium", executive.riskHeatmap.medium],
    ["Low", executive.riskHeatmap.low],
  ].forEach(([label, items]) => {
    if (!items.length) return;
    subheading(`${label} (${items.length})`);
    drawTable(
      riskHeaders,
      items.map((r) => [r.title, r.businessImpact, r.likelihood, r.recommendation, r.priority]),
      riskWeights
    );
  });

  // ---- 8. Executive Roadmap ----
  sectionHeading("8. Executive Roadmap");
  const roadmapHeaders = ["Action", "Business Value", "Owner", "Priority", "Expected Improvement"];
  const roadmapWeights = [1.8, 1.8, 1.4, 0.8, 1.6];
  [
    ["Next 30 Days", executive.executiveRoadmap.days30],
    ["Next 60 Days", executive.executiveRoadmap.days60],
    ["Next 90 Days", executive.executiveRoadmap.days90],
  ].forEach(([label, items]) => {
    subheading(label);
    drawTable(
      roadmapHeaders,
      items.map((i) => [i.action, i.businessValue, i.ownerRecommendation, i.priority, i.expectedImprovement]),
      roadmapWeights
    );
  });

  // ---- 9. Top Recommendations ----
  doc.addPage();
  sectionHeading("9. Top Recommendations");
  executive.recommendations.slice(0, 8).forEach((r) => {
    ensureSpace(70);
    const cardY = doc.y;
    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.ink).text(r.title, marginX, cardY, { width: contentWidth - 50 });
    badge(r.priority, r.priority, marginX + contentWidth - 44, cardY + 1);
    doc.moveDown(0.2);
    bodyText(`Why: ${r.why}`, { size: 9, color: COLORS.muted });
    bodyText(`Business benefit: ${r.businessBenefit}`, { size: 9 });
    bodyText(`Estimated impact: ${r.estimatedImpact} · Governance improvement: ${r.expectedGovernanceImprovement}`, {
      size: 9,
      color: COLORS.muted,
    });
    doc.moveDown(0.5);
  });

  // ---- 10. Executive Insights ----
  sectionHeading("10. Executive Insights");
  executive.executiveInsights.forEach((i) => insightBox(i));

  doc.moveDown(0.4);
  disclaimerBox("Disclaimer: Planning assessment only — not legal certification. Business impact = documented estimates.");

  return pdfBuffer(doc);
}

export async function generateExecutiveDocxReport(executive, meta) {
  const ex = executive.executiveSummary;

  function simpleTable(headers, rows) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
      },
      rows: [
        new TableRow({
          children: headers.map(
            (h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })
          ),
        }),
        ...rows.map(
          (r) => new TableRow({ children: r.map((c) => new TableCell({ children: [new Paragraph(String(c))] })) })
        ),
      ],
    });
  }

  const children = [
    new Paragraph({
      text: "AI Governance Executive Assessment",
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Prepared for: ${meta.buyerName || "Customer"}`, break: 1 }),
        new TextRun({ text: meta.company ? `Company: ${meta.company}` : "", break: 1 }),
        new TextRun({ text: `Reference: ${meta.orderRef || ""}`, break: 1 }),
      ],
    }),
    new Paragraph({ text: "1. Executive Summary", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      text: `Governance Score: ${ex.governanceScore}/100 | AI Readiness: ${ex.aiReadiness}/100 | Maturity: ${executive.maturity.level} — ${executive.maturity.why}`,
    }),
    new Paragraph({ text: "Top Business Risks", heading: HeadingLevel.HEADING_2 }),
    ...ex.topBusinessRisks.map((r) => new Paragraph({ text: r, bullet: { level: 0 } })),
    new Paragraph({ text: "Top AI Opportunities", heading: HeadingLevel.HEADING_2 }),
    ...ex.topAiOpportunities.map((r) => new Paragraph({ text: r, bullet: { level: 0 } })),
    new Paragraph({ text: "Overall Recommendation", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: ex.overallRecommendation }),
    new Paragraph({ text: "Executive Conclusion", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: ex.executiveConclusion }),

    new Paragraph({ text: "2. Governance Score Breakdown", heading: HeadingLevel.HEADING_1 }),
  ];

  executive.governanceScoreBreakdown.dimensions.forEach((d) => {
    children.push(new Paragraph({ text: `${d.label}: ${d.score}/${d.max}`, heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: d.why }));
  });

  children.push(new Paragraph({ text: "3. AI Opportunity Matrix", heading: HeadingLevel.HEADING_1 }));
  const oppSections = [
    ["Highest ROI Opportunities", executive.aiOpportunityMatrix.highestRoi],
    ["Highest Risk Opportunities", executive.aiOpportunityMatrix.highestRisk],
    ["Quick Wins", executive.aiOpportunityMatrix.quickWins],
    ["Long-term Initiatives", executive.aiOpportunityMatrix.longTerm],
  ];
  oppSections.forEach(([label, list]) => {
    children.push(new Paragraph({ text: label, heading: HeadingLevel.HEADING_2 }));
    if (!list.length) {
      children.push(new Paragraph({ text: "No items in this category for this upload." }));
    } else {
      children.push(
        simpleTable(
          ["Title", "Category", "Complexity", "Priority", "Impact"],
          list.map((o) => [o.title, o.suggestedAiCategory, o.estimatedComplexity, o.priority, o.expectedBusinessImpact])
        )
      );
    }
  });

  const bi = executive.businessImpact;
  children.push(new Paragraph({ text: "4. Business Impact (Estimated)", heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: "Methodology & assumptions", heading: HeadingLevel.HEADING_2 }));
  bi.assumptions.forEach((a) => children.push(new Paragraph({ text: a, bullet: { level: 0 } })));
  children.push(
    simpleTable(
      ["Metric", "Value"],
      [
        ["Manual hours (weekly range)", `${bi.potentialManualHoursPerWeek.low}–${bi.potentialManualHoursPerWeek.high} hours`],
        ["Automation-eligible share", `${bi.potentialAutomationPercent.value}% (${bi.potentialAutomationPercent.basis})`],
        [
          "Annual time savings (range)",
          `${bi.estimatedTimeSavingsAnnualHours.low}–${bi.estimatedTimeSavingsAnnualHours.high} hours/year`,
        ],
        [
          "Annual savings (USD range)",
          `$${bi.estimatedAnnualSavingsUsd.low.toLocaleString()}–$${bi.estimatedAnnualSavingsUsd.high.toLocaleString()}`,
        ],
        ["Productivity gain (estimated)", `${bi.estimatedProductivityGainPercent.value}%`],
      ]
    )
  );

  children.push(new Paragraph({ text: "5. Department Analysis", heading: HeadingLevel.HEADING_1 }));
  children.push(
    simpleTable(
      ["Department", "Score", "Work Items", "AI-related items", "High Risk"],
      executive.departmentAnalysis.map((d) => [d.name, d.score, d.workItems, d.aiCandidates, d.highRisk])
    )
  );

  children.push(new Paragraph({ text: "6. Framework Mapping", heading: HeadingLevel.HEADING_1 }));
  Object.values(executive.frameworkMapping).forEach((f) => {
    children.push(new Paragraph({ text: f.title, heading: HeadingLevel.HEADING_2 }));
    if (f.compliant?.length) children.push(new Paragraph({ text: `Compliant: ${f.compliant.join(", ")}` }));
    if (f.partial?.length) children.push(new Paragraph({ text: `Partial: ${f.partial.join(", ")}` }));
    if (f.missing?.length) children.push(new Paragraph({ text: `Missing: ${f.missing.join(", ")}` }));
    children.push(new Paragraph({ text: f.explanation }));
  });

  children.push(new Paragraph({ text: "7. Risk Heatmap", heading: HeadingLevel.HEADING_1 }));
  [
    ["Critical", executive.riskHeatmap.critical],
    ["High", executive.riskHeatmap.high],
    ["Medium", executive.riskHeatmap.medium],
    ["Low", executive.riskHeatmap.low],
  ].forEach(([label, items]) => {
    if (!items.length) return;
    children.push(new Paragraph({ text: `${label} (${items.length})`, heading: HeadingLevel.HEADING_2 }));
    children.push(
      simpleTable(
        ["Item", "Impact", "Likelihood", "Recommendation", "Priority"],
        items.map((r) => [r.title, r.businessImpact, r.likelihood, r.recommendation, r.priority])
      )
    );
  });

  children.push(new Paragraph({ text: "8. Executive Roadmap", heading: HeadingLevel.HEADING_1 }));
  [
    ["Next 30 Days", executive.executiveRoadmap.days30],
    ["Next 60 Days", executive.executiveRoadmap.days60],
    ["Next 90 Days", executive.executiveRoadmap.days90],
  ].forEach(([label, items]) => {
    children.push(new Paragraph({ text: label, heading: HeadingLevel.HEADING_2 }));
    children.push(
      simpleTable(
        ["Action", "Business Value", "Owner", "Priority", "Expected Improvement"],
        items.map((i) => [i.action, i.businessValue, i.ownerRecommendation, i.priority, i.expectedImprovement])
      )
    );
  });

  children.push(new Paragraph({ text: "9. Recommendations", heading: HeadingLevel.HEADING_1 }));
  executive.recommendations.forEach((r) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `[${r.priority}] ${r.title}`, bold: true })],
      })
    );
    children.push(new Paragraph({ text: `Why: ${r.why}` }));
    children.push(new Paragraph({ text: `Business benefit: ${r.businessBenefit}` }));
    children.push(
      new Paragraph({ text: `Estimated impact: ${r.estimatedImpact} · Governance improvement: ${r.expectedGovernanceImprovement}` })
    );
  });

  children.push(new Paragraph({ text: "10. Executive Insights", heading: HeadingLevel.HEADING_1 }));
  executive.executiveInsights.forEach((i) => children.push(new Paragraph({ text: i, bullet: { level: 0 } })));

  children.push(
    new Paragraph({
      text: "Disclaimer: This report supports governance planning and is not legal certification.",
      spacing: { before: 400 },
    })
  );

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

const require = createRequire(import.meta.url);

async function loadPptxGenJS() {
  // pptxgenjs is a dual CJS/ESM package. Vercel's bundler mis-resolves the bare
  // dynamic import("pptxgenjs") to the ESM build (dist/pptxgen.es.js) but
  // executes it in a context that can't handle import/export syntax, crashing
  // with "Cannot use import statement outside a module" (confirmed in
  // production logs). require() forces Node's CJS resolution condition
  // instead, landing on the confirmed-working dist/pptxgen.cjs.js build.
  return require("pptxgenjs");
}

export async function generateExecutivePptxReport(executive, meta) {
  const PptxGenJS = await loadPptxGenJS();
  const pptx = new PptxGenJS();
  pptx.author = "AI Governance Hub";
  pptx.title = "AI Governance Executive Assessment";
  pptx.subject = meta.orderRef || "";

  const ex = executive.executiveSummary;
  const navy = "0B1F3A";
  const blue = "2563EB";

  function titleSlide(title, subtitle) {
    const slide = pptx.addSlide();
    slide.background = { color: navy };
    slide.addText(title, { x: 0.5, y: 1.2, w: 9, h: 1.2, fontSize: 32, color: "FFFFFF", bold: true });
    if (subtitle) slide.addText(subtitle, { x: 0.5, y: 2.5, w: 9, h: 0.8, fontSize: 14, color: "BFDBFE" });
    return slide;
  }

  titleSlide(
    "AI Governance Executive Assessment",
    `${meta.buyerName || "Client"}${meta.company ? " · " + meta.company : ""} · ${new Date(executive.assessmentOverview.uploadDate).toLocaleDateString()}`
  );

  const s2 = pptx.addSlide();
  s2.addText("Executive Summary", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  s2.addText(
    [
      { text: `Governance Score: ${ex.governanceScore}/100`, options: { fontSize: 18, color: blue, bold: true } },
      { text: `\nAI Readiness: ${ex.aiReadiness}/100`, options: { fontSize: 16 } },
      { text: `\nMaturity: ${executive.maturity.level}`, options: { fontSize: 16 } },
      { text: `\n\n${ex.executiveConclusion}`, options: { fontSize: 12 } },
    ],
    { x: 0.5, y: 1, w: 9, h: 4 }
  );

  const s3 = pptx.addSlide();
  s3.addText("Key Metrics", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  s3.addTable(
    [
      ["Work Items", "AI-related items", "High Risk", "Projects"],
      [
        String(executive.assessmentOverview.workItemCount),
        String(executive.assessmentOverview.aiCandidateCount),
        String(executive.inventory.riskSummary.high),
        String(executive.assessmentOverview.projects.length),
      ],
    ],
    { x: 0.5, y: 1.2, w: 9, fontSize: 14, border: { pt: 1 }, fill: { color: "EFF6FF" } }
  );

  const s4 = pptx.addSlide();
  s4.addText("Governance Score Breakdown", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  const dimRows = [["Dimension", "Score", "Why"]];
  executive.governanceScoreBreakdown.dimensions.forEach((d) => {
    dimRows.push([d.label, `${d.score}/${d.max}`, d.why.slice(0, 120) + (d.why.length > 120 ? "…" : "")]);
  });
  s4.addTable(dimRows, { x: 0.5, y: 1, w: 9, fontSize: 10, colW: [1.5, 0.8, 6.7] });

  const s5 = pptx.addSlide();
  s5.addText("Top Business Risks", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  s5.addText(ex.topBusinessRisks.map((r) => `• ${r}`).join("\n"), { x: 0.5, y: 1, w: 9, h: 4, fontSize: 14 });

  const s6 = pptx.addSlide();
  s6.addText("AI Opportunity Highlights", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  const opps = executive.aiOpportunityMatrix.highestRoi.slice(0, 5);
  s6.addText(
    opps.length ? opps.map((o) => `• ${o.title} (${o.suggestedAiCategory})`).join("\n") : "No AI opportunities detected.",
    { x: 0.5, y: 1, w: 9, h: 4, fontSize: 12 }
  );

  const s7 = pptx.addSlide();
  s7.addText("Department Scores", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  const deptRows = [["Department", "Score", "AI Items"]];
  executive.departmentAnalysis.slice(0, 8).forEach((d) => {
    deptRows.push([d.name, String(d.score), String(d.aiCandidates)]);
  });
  s7.addTable(deptRows, { x: 0.5, y: 1, w: 9, fontSize: 12 });

  const s8 = pptx.addSlide();
  s8.addText("Framework Alignment", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  const fwText = Object.values(executive.frameworkMapping)
    .map((f) => `${f.title}: ${f.explanation}`)
    .join("\n\n");
  s8.addText(fwText, { x: 0.5, y: 1, w: 9, h: 4, fontSize: 11 });

  const s9 = pptx.addSlide();
  s9.addText("Risk Heatmap Summary", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  s9.addTable(
    [
      ["Band", "Count"],
      ["Critical", String(executive.riskHeatmap.critical.length)],
      ["High", String(executive.riskHeatmap.high.length)],
      ["Medium", String(executive.riskHeatmap.medium.length)],
      ["Low", String(executive.riskHeatmap.low.length)],
    ],
    { x: 2, y: 1.5, w: 5, fontSize: 14 }
  );

  const s10 = pptx.addSlide();
  s10.addText("30 / 60 / 90 Day Roadmap", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  const road = [
    ...executive.executiveRoadmap.days30.map((i) => `[30d] ${i.action}`),
    ...executive.executiveRoadmap.days60.map((i) => `[60d] ${i.action}`),
    ...executive.executiveRoadmap.days90.map((i) => `[90d] ${i.action}`),
  ];
  s10.addText(road.join("\n"), { x: 0.5, y: 1, w: 9, h: 4, fontSize: 12 });

  const s11 = pptx.addSlide();
  s11.addText("Priority Recommendations", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  s11.addText(
    executive.recommendations.slice(0, 6).map((r) => `[${r.priority}] ${r.title}\n${r.businessBenefit}`).join("\n\n"),
    { x: 0.5, y: 1, w: 9, h: 4, fontSize: 11 }
  );

  const s12 = pptx.addSlide();
  s12.addText("Business Impact (Estimated)", { x: 0.5, y: 0.3, w: 9, fontSize: 24, color: navy, bold: true });
  const bi = executive.businessImpact;
  s12.addText(
    [
      `Automation-eligible: ${bi.potentialAutomationPercent.value}%`,
      `Annual hours saved: ${bi.estimatedTimeSavingsAnnualHours.low}–${bi.estimatedTimeSavingsAnnualHours.high}`,
      `Annual savings (USD): $${bi.estimatedAnnualSavingsUsd.low.toLocaleString()}–$${bi.estimatedAnnualSavingsUsd.high.toLocaleString()}`,
      "",
      "Assumptions documented in full report.",
    ].join("\n"),
    { x: 0.5, y: 1, w: 9, h: 4, fontSize: 12 }
  );

  const s13 = pptx.addSlide();
  s13.background = { color: navy };
  s13.addText("Next Steps", { x: 0.5, y: 1, w: 9, fontSize: 28, color: "FFFFFF", bold: true });
  s13.addText(ex.overallRecommendation, { x: 0.5, y: 2.2, w: 9, h: 2, fontSize: 16, color: "BFDBFE" });
  s13.addText("AI Governance Hub · v22.0", { x: 0.5, y: 4.5, w: 9, fontSize: 11, color: "94A3B8" });

  const data = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(data);
}

export async function generateAllExecutiveFormats(executive, meta) {
  const { generateExecutiveHtmlReport, generateExecutiveTextReport } = await import("./report-html-v22.js");
  const [html, text, pdf, docx, pptx] = await Promise.all([
    Promise.resolve(generateExecutiveHtmlReport(executive, meta)),
    Promise.resolve(generateExecutiveTextReport(executive, meta)),
    generateExecutivePdfReport(executive, meta),
    generateExecutiveDocxReport(executive, meta),
    generateExecutivePptxReport(executive, meta),
  ]);
  return { html, text, pdf, docx, pptx };
}
