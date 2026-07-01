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

export async function generateExecutivePdfReport(executive, meta) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const originalText = doc.text.bind(doc);
  doc.text = (str, ...args) => originalText(sanitizeForPdf(str), ...args);
  const ex = executive.executiveSummary;
  const title = "AI Governance Executive Assessment";

  function heading(text) {
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor("#2563eb").text(text);
    doc.moveDown(0.2);
  }
  function subheading(text) {
    doc.fontSize(11).fillColor("#0b1f3a").text(text);
  }
  function row(label, value) {
    doc.fontSize(10).fillColor("#0f172a").text(`${label}: ${value}`);
  }
  function bulletList(items) {
    doc.fontSize(10).fillColor("#0f172a");
    items.forEach((i) => doc.text(`• ${i}`, { align: "justify" }));
  }
  function oppTable(list, label) {
    subheading(label);
    if (!list.length) {
      doc.fontSize(9).fillColor("#64748b").text("No items in this category for this upload.");
      return;
    }
    list.forEach((o) => {
      doc
        .fontSize(9)
        .fillColor("#0f172a")
        .text(
          `${o.title} — ${o.suggestedAiCategory} · Complexity: ${o.estimatedComplexity} · Priority: ${o.priority} · Impact: ${o.expectedBusinessImpact}`
        );
    });
    doc.moveDown(0.2);
  }
  function riskSection(items, label) {
    if (!items.length) return;
    subheading(`${label} (${items.length})`);
    items.forEach((r) => {
      doc
        .fontSize(9)
        .fillColor("#0f172a")
        .text(`${r.title} — ${r.businessImpact} Likelihood: ${r.likelihood}. ${r.recommendation} [${r.priority}]`);
    });
    doc.moveDown(0.2);
  }
  function roadmapSection(label, items) {
    subheading(label);
    items.forEach((i) => {
      doc
        .fontSize(9)
        .fillColor("#0f172a")
        .text(`${i.action} — ${i.businessValue}. Owner: ${i.ownerRecommendation} [${i.priority}] · ${i.expectedImprovement}`);
    });
    doc.moveDown(0.2);
  }

  doc.fontSize(22).fillColor("#0b1f3a").text(title, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#64748b").text(`Prepared for ${meta.buyerName || "Customer"}`, { align: "center" });
  if (meta.company) doc.text(meta.company, { align: "center" });
  doc.text(`Reference: ${meta.orderRef || meta.orderId || ""}`, { align: "center" });
  doc.moveDown();

  heading("1. Executive Summary");
  doc.fontSize(11).fillColor("#0f172a");
  doc.text(`Governance Score: ${ex.governanceScore}/100  |  AI Readiness: ${ex.aiReadiness}/100`);
  doc.text(`Maturity: ${executive.maturity.level} — ${executive.maturity.why}`);
  doc.moveDown(0.3);
  subheading("Top Business Risks");
  bulletList(ex.topBusinessRisks);
  doc.moveDown(0.2);
  subheading("Top AI Opportunities");
  bulletList(ex.topAiOpportunities);
  doc.moveDown(0.2);
  subheading("Overall Recommendation");
  doc.fontSize(10).fillColor("#0f172a").text(ex.overallRecommendation, { align: "justify" });
  doc.moveDown(0.2);
  subheading("Executive Conclusion");
  doc.fontSize(10).fillColor("#0f172a").text(ex.executiveConclusion, { align: "justify" });

  doc.addPage();
  heading("2. Governance Score Breakdown");
  doc.fontSize(10).fillColor("#0f172a").text(`Overall score: ${executive.governanceScoreBreakdown.overall}/100`);
  doc.moveDown(0.2);
  executive.governanceScoreBreakdown.dimensions.forEach((d) => {
    row(d.label, `${d.score}/${d.max} — ${d.why}`);
  });

  heading("3. AI Opportunity Matrix");
  oppTable(executive.aiOpportunityMatrix.highestRoi, "Highest ROI Opportunities");
  oppTable(executive.aiOpportunityMatrix.highestRisk, "Highest Risk Opportunities");
  oppTable(executive.aiOpportunityMatrix.quickWins, "Quick Wins");
  oppTable(executive.aiOpportunityMatrix.longTerm, "Long-term Initiatives");

  doc.addPage();
  heading("4. Business Impact (Estimated)");
  const bi = executive.businessImpact;
  subheading("Methodology & assumptions");
  bulletList(bi.assumptions);
  doc.moveDown(0.2);
  row("Manual hours (weekly range)", `${bi.potentialManualHoursPerWeek.low}–${bi.potentialManualHoursPerWeek.high} hours`);
  row("Automation-eligible share", `${bi.potentialAutomationPercent.value}% (${bi.potentialAutomationPercent.basis})`);
  row(
    "Annual time savings (range)",
    `${bi.estimatedTimeSavingsAnnualHours.low}–${bi.estimatedTimeSavingsAnnualHours.high} hours/year`
  );
  row(
    "Annual savings (USD range)",
    `$${bi.estimatedAnnualSavingsUsd.low.toLocaleString()}–$${bi.estimatedAnnualSavingsUsd.high.toLocaleString()} (${bi.estimatedAnnualSavingsUsd.basis})`
  );
  row(
    "Productivity gain (estimated)",
    `${bi.estimatedProductivityGainPercent.value}% (${bi.estimatedProductivityGainPercent.basis})`
  );

  doc.addPage();
  heading("5. Department Analysis");
  executive.departmentAnalysis.forEach((d) => {
    doc
      .fontSize(11)
      .fillColor("#0f172a")
      .text(`${d.name}: Score ${d.score} (${d.aiCandidates} AI-related work items, ${d.highRisk} high-risk)`);
  });

  heading("6. Framework Mapping");
  Object.values(executive.frameworkMapping).forEach((f) => {
    subheading(f.title);
    doc.fontSize(9).fillColor("#0f172a");
    if (f.compliant?.length) doc.text(`Compliant: ${f.compliant.join(", ")}`);
    if (f.partial?.length) doc.text(`Partial: ${f.partial.join(", ")}`);
    if (f.missing?.length) doc.text(`Missing: ${f.missing.join(", ")}`);
    doc.fontSize(9).fillColor("#64748b").text(f.explanation, { align: "justify" });
    doc.moveDown(0.2);
  });

  doc.addPage();
  heading("7. Risk Heatmap");
  riskSection(executive.riskHeatmap.critical, "Critical");
  riskSection(executive.riskHeatmap.high, "High");
  riskSection(executive.riskHeatmap.medium, "Medium");
  riskSection(executive.riskHeatmap.low, "Low");

  heading("8. Executive Roadmap");
  roadmapSection("Next 30 Days", executive.executiveRoadmap.days30);
  roadmapSection("Next 60 Days", executive.executiveRoadmap.days60);
  roadmapSection("Next 90 Days", executive.executiveRoadmap.days90);

  doc.addPage();
  heading("9. Top Recommendations");
  executive.recommendations.slice(0, 8).forEach((r) => {
    doc.fontSize(11).fillColor("#0f172a").text(`[${r.priority}] ${r.title}`);
    doc.fontSize(10).fillColor("#64748b").text(`Why: ${r.why}`);
    doc.fontSize(9).fillColor("#0f172a").text(`Business benefit: ${r.businessBenefit}`);
    doc.fontSize(9).fillColor("#64748b").text(`Estimated impact: ${r.estimatedImpact} · Governance improvement: ${r.expectedGovernanceImprovement}`);
    doc.moveDown(0.3);
  });

  heading("10. Executive Insights");
  executive.executiveInsights.forEach((i) => {
    doc.fontSize(10).fillColor("#0f172a").text(`• ${i}`, { align: "justify" });
    doc.moveDown(0.15);
  });

  doc.moveDown();
  doc.fontSize(9).fillColor("#64748b").text(
    "Disclaimer: Planning assessment only — not legal certification. Business impact = documented estimates.",
    { align: "justify" }
  );

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
