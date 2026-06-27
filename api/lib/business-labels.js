/**
 * Universal business terminology — v25.22 (display labels only; backend field names unchanged).
 */

const SOURCE_ITEM_LABELS = {
  jira: { singular: "Issue", plural: "Issues", scanned: "Issues scanned" },
  "azure-devops": { singular: "Work Item", plural: "Work Items", scanned: "Work items scanned" },
  github: { singular: "Issue", plural: "Issues", scanned: "Issues scanned" },
  csv: { singular: "Record", plural: "Records", scanned: "Records scanned" },
  excel: { singular: "Row", plural: "Rows", scanned: "Rows scanned" },
  default: { singular: "Work Item", plural: "Work Items", scanned: "Work items scanned" },
};

export const AI_RELATED_ITEMS = "AI-related work items";
export const AI_RELATED_SHORT = "AI-related items";
export const AI_RELATED_INVENTORY_HEADING = "AI-RELATED WORK ITEM INVENTORY";
export const EXECUTIVE_ASSESSMENT = "Executive Assessment";
export const GOVERNANCE_ASSESSMENT = "Governance Assessment";

export function normalizeSourceKey(source) {
  const key = String(source || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  if (key.includes("jira")) return "jira";
  if (key.includes("azure") || key.includes("devops") || key === "ado") return "azure-devops";
  if (key.includes("github")) return "github";
  if (key.includes("excel") || key.includes("xlsx") || key.includes("xls")) return "excel";
  if (key === "csv" || key.includes("csv")) return "csv";
  return "default";
}

export function getSourceItemLabels(source) {
  return SOURCE_ITEM_LABELS[normalizeSourceKey(source)] || SOURCE_ITEM_LABELS.default;
}

export function formatWorkItemCount(count, source) {
  const labels = getSourceItemLabels(source);
  const n = Number(count) || 0;
  return `${n.toLocaleString()} ${n === 1 ? labels.singular : labels.plural}`;
}
