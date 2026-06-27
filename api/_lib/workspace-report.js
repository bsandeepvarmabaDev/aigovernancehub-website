/**
 * AI Governance Hub v25.0 — Management & export reports (server-side)
 */
import PDFDocument from "pdfkit";
import PptxGenJS from "pptxgenjs";

export function buildManagementReportHtml(period, data) {
  const title = `${capitalize(period)} Governance Management Report`;
  const health = data.health || {};
  const stats = data.stats || {};
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Segoe UI,sans-serif;margin:40px;color:#0f172a}h1{color:#0b1f3a}
.kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}
.card{border:1px solid #e2e8f0;padding:12px;border-radius:8px}table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;font-size:13px}th{background:#f8fafc}
</style></head><body>
<h1>${title}</h1>
<p>Generated ${new Date().toISOString()} · AI Governance Hub v25.0</p>
<div class="kpi">
<div class="card"><strong>Health</strong><br>${health.overallHealth || "—"} (${health.healthScore ?? "—"}/100)</div>
<div class="card"><strong>Completed</strong><br>${stats.completed ?? 0} / ${stats.total ?? 0}</div>
<div class="card"><strong>Governance Δ</strong><br>${health.governanceImprovement ?? 0} pts</div>
</div>
<h2>Task summary</h2>
<table><tr><th>Status</th><th>Count</th></tr>
<tr><td>To Do</td><td>${stats.todo ?? 0}</td></tr>
<tr><td>In Progress</td><td>${stats.inProgress ?? 0}</td></tr>
<tr><td>Blocked</td><td>${stats.blocked ?? 0}</td></tr>
<tr><td>Overdue</td><td>${stats.overdue ?? 0}</td></tr>
</table>
<h2>Recent activity</h2>
<ul>${(data.activity || [])
  .slice(0, 10)
  .map((a) => `<li>${escape(a.timestamp)} — ${escape(a.message)}</li>`)
  .join("")}</ul>
<p><em>Planning report — not legal certification.</em></p>
</body></html>`;
}

export async function buildManagementReportPdf(period, data) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const health = data.health || {};
  const stats = data.stats || {};
  doc.fontSize(20).fillColor("#0b1f3a").text(`${capitalize(period)} Governance Report`);
  doc.fontSize(10).fillColor("#64748b").text(`Generated ${new Date().toISOString()}`);
  doc.moveDown();
  doc.fontSize(12).fillColor("#0f172a");
  doc.text(`Overall health: ${health.overallHealth || "—"} (${health.healthScore ?? "—"}/100)`);
  doc.text(`Tasks completed: ${stats.completed ?? 0} / ${stats.total ?? 0}`);
  doc.text(`Overdue: ${stats.overdue ?? 0}`);
  doc.text(`Governance improvement: ${health.governanceImprovement ?? 0} points`);
  doc.moveDown();
  doc.text("Recent activity:", { underline: true });
  (data.activity || []).slice(0, 8).forEach((a) => {
    doc.fontSize(10).text(`• ${a.message}`);
  });
  doc.end();
  return done;
}

export function buildExcelCsv(tasks) {
  const bom = "\uFEFF";
  const header =
    "ID\tTitle\tPriority\tOwner\tDepartment\tDue Date\tStatus\tProgress\tAssessment";
  const rows = (tasks || []).map((t) =>
    [t.id, t.title, t.priority, t.owner, t.department, t.dueDate || "", t.status, t.progress, t.assessmentLabel].join(
      "\t"
    )
  );
  return bom + [header, ...rows].join("\n");
}

function capitalize(s) {
  return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
}

function escape(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function buildWorkspacePptx(data) {
  const pptx = new PptxGenJS();
  const health = data.health || {};
  const stats = data.stats || {};
  const s1 = pptx.addSlide();
  s1.addText("Governance Workspace Summary", { x: 0.5, y: 1, w: 9, fontSize: 28, bold: true, color: "0B1F3A" });
  s1.addText(`Health: ${health.overallHealth || "—"} · ${new Date().toLocaleDateString()}`, {
    x: 0.5,
    y: 2.2,
    w: 9,
    fontSize: 14,
    color: "64748B",
  });
  const s2 = pptx.addSlide();
  s2.addText("Task Progress", { x: 0.5, y: 0.4, w: 9, fontSize: 22, bold: true });
  s2.addTable(
    [
      ["Metric", "Value"],
      ["Completed", String(stats.completed ?? 0)],
      ["Pending", String(stats.pending ?? 0)],
      ["Overdue", String(stats.overdue ?? 0)],
      ["Governance Δ", String(health.governanceImprovement ?? 0)],
    ],
    { x: 1, y: 1.2, w: 7, fontSize: 14 }
  );
  const buf = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(buf);
}
