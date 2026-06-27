import { parseUploadContent, validateUploadStructure } from "../api/lib/report-engine.js";
import { detectPlanTier } from "../api/lib/assessment-config.js";

function csv(rows) {
  const h = ["Issue Key", "Summary", "Description", "Issue Type", "Status", "Project"];
  return [h.join(","), ...rows.map((r) => h.map((k) => r[k] ?? "").join(","))].join("\n");
}
function gen(n, proj = "P1") {
  return Array.from({ length: n }, (_, i) => ({
    "Issue Key": `X-${i + 1}`,
    Summary: "Task",
    Description: "",
    "Issue Type": "Story",
    Status: "Open",
    Project: proj,
  }));
}

const cases = [];
function check(name, ok, detail = "") {
  cases.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
}

const c1000 = csv(gen(1000));
const p = parseUploadContent("t.csv", Buffer.from(c1000));
const v = validateUploadStructure(p, c1000.length, c1000, "jira");
check("1000 items / 1 project → business", v.plan.tier === "business", v.plan.tier);

const c100 = csv(gen(100));
const v100 = validateUploadStructure(
  parseUploadContent("t.csv", Buffer.from(c100)),
  c100.length,
  c100,
  "jira"
);
check("100 items / 1 project → professional", v100.plan.tier === "professional", v100.plan.tier);

check("100000 tier → enterprise_plus", detectPlanTier(100000, 1, 1024).id === "enterprise_plus");

const quoted =
  'Issue Key,Summary,Description,Issue Type,Status,Project\nK-1,"Summary, with comma","Desc ""quoted""",Story,Open,P1';
const pq = parseUploadContent("q.csv", Buffer.from(quoted));
check("Quoted CSV parses", pq.records[0].Description.includes("quoted"));

const bom = "\uFEFF" + csv(gen(3));
check("BOM file parses 3 rows", parseUploadContent("b.csv", Buffer.from(bom)).records.length === 3);

const xss = csv([
  {
    "Issue Key": "X-1",
    Summary: "ok",
    Description: "<script>alert(1)</script>",
    "Issue Type": "Story",
    Status: "Open",
    Project: "P1",
  },
]);
const vx = validateUploadStructure(parseUploadContent("x.csv", Buffer.from(xss)), xss.length, xss, "csv");
check("XSS in cell blocked", !vx.ready);

const t0 = Date.now();
const c5k = csv(gen(5000));
validateUploadStructure(parseUploadContent("big.csv", Buffer.from(c5k)), c5k.length, c5k, "jira");
check("5000 rows under 2s", Date.now() - t0 < 2000, `${Date.now() - t0}ms`);

const failed = cases.filter((c) => !c.ok).length;
console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
