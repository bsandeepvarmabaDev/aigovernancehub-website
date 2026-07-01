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

export async function generateExecutivePdfReport(executive, meta) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const ex = executive.executiveSummary;
  const title = "AI Governance Executive Assessment";

  doc.fontSize(22).fillColor("#0b1f3a").text(title, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#64748b").text(`Prepared for ${meta.buyerName || "Customer"}`, { align: "center" });
  if (meta.company) doc.text(meta.company, { align: "center" });
  doc.text(`Reference: ${meta.orderRef || meta.orderId || ""}`, { align: "center" });
  doc.moveDown();

  doc.fontSize(14).fillColor("#2563eb").text("Executive Summary");
  doc.fontSize(11).fillColor("#0f172a");
  doc.text(`Governance Score: ${ex.governanceScore}/100  |  AI Readiness: ${ex.aiReadiness}/100`);
  doc.text(`Maturity: ${executive.maturity.level}`);
  doc.moveDown(0.3);
  doc.text(ex.executiveConclusion, { align: "justify" });
  doc.moveDown();

  doc.fontSize(14).fillColor("#2563eb").text("Governance Score Breakdown");
  doc.fontSize(10).fillColor("#0f172a");
  executive.governanceScoreBreakdown.dimensions.forEach((d) => {
    doc.text(`${d.label}: ${d.score}/${d.max} — ${d.why}`);
  });
  doc.moveDown();

  doc.fontSize(14).fillColor("#2563eb").text("Top Recommendations");
  executive.recommendations.slice(0, 5).forEach((r) => {
    doc.fontSize(11).fillColor("#0f172a").text(`[${r.priority}] ${r.title}`);
    doc.fontSize(10).fillColor("#64748b").text(`Why: ${r.why}`);
    doc.moveDown(0.2);
  });

  doc.addPage();
  doc.fontSize(14).fillColor("#2563eb").text("Department Analysis");
  executive.departmentAnalysis.forEach((d) => {
    doc.fontSize(11).fillColor("#0f172a").text(`${d.name}: Score ${d.score} (${d.aiCandidates} AI-related work items)`);
  });
  doc.moveDown();

  doc.fontSize(14).fillColor("#2563eb").text("Executive Insights");
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
    new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      text: `Governance Score: ${ex.governanceScore}/100 | AI Readiness: ${ex.aiReadiness}/100 | Maturity: ${executive.maturity.level}`,
    }),
    new Paragraph({ text: ex.executiveConclusion }),
    new Paragraph({ text: "Governance Score Breakdown", heading: HeadingLevel.HEADING_1 }),
  ];

  executive.governanceScoreBreakdown.dimensions.forEach((d) => {
    children.push(new Paragraph({ text: `${d.label}: ${d.score}/${d.max}`, heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: d.why }));
  });

  children.push(new Paragraph({ text: "Recommendations", heading: HeadingLevel.HEADING_1 }));
  executive.recommendations.forEach((r) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `[${r.priority}] ${r.title}`, bold: true })],
      })
    );
    children.push(new Paragraph({ text: `Why: ${r.why}` }));
    children.push(new Paragraph({ text: `Business benefit: ${r.businessBenefit}` }));
  });

  children.push(new Paragraph({ text: "Department Analysis", heading: HeadingLevel.HEADING_1 }));
  const deptRows = [
    new TableRow({
      children: ["Department", "Score", "Work Items", "AI-related items"].map(
        (h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })
      ),
    }),
    ...executive.departmentAnalysis.map(
      (d) =>
        new TableRow({
          children: [d.name, String(d.score), String(d.workItems), String(d.aiCandidates)].map(
            (c) => new TableCell({ children: [new Paragraph(c)] })
          ),
        })
    ),
  ];
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
      },
      rows: deptRows,
    })
  );

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
