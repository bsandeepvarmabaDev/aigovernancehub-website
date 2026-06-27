/**
 * Universal business terminology — v25.22 (client display labels; backend unchanged).
 */
(function (global) {
  "use strict";

  var SOURCE_LABELS = {
    jira: { singular: "Issue", plural: "Issues", scanned: "Issues scanned" },
    "azure-devops": { singular: "Work Item", plural: "Work Items", scanned: "Work items scanned" },
    github: { singular: "Issue", plural: "Issues", scanned: "Issues scanned" },
    csv: { singular: "Record", plural: "Records", scanned: "Records scanned" },
    excel: { singular: "Row", plural: "Rows", scanned: "Rows scanned" },
    default: { singular: "Work Item", plural: "Work Items", scanned: "Work items scanned" },
  };

  var AI_RELATED = "AI-related work items";
  var AI_RELATED_SHORT = "AI-related items";

  function normalizeSource(source) {
    var key = String(source || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");
    if (key.indexOf("jira") >= 0) return "jira";
    if (key.indexOf("azure") >= 0 || key.indexOf("devops") >= 0) return "azure-devops";
    if (key.indexOf("github") >= 0) return "github";
    if (key.indexOf("excel") >= 0 || key.indexOf("xlsx") >= 0) return "excel";
    if (key === "csv" || key.indexOf("csv") >= 0) return "csv";
    return "default";
  }

  function getLabels(source) {
    return SOURCE_LABELS[normalizeSource(source)] || SOURCE_LABELS.default;
  }

  function updatePreviewStatLabels(source) {
    var labels = getLabels(source);
    document.querySelectorAll("[data-label-work-items]").forEach(function (el) {
      el.textContent = labels.scanned;
    });
    document.querySelectorAll("[data-label-ai-related]").forEach(function (el) {
      el.textContent = AI_RELATED_SHORT;
    });
  }

  global.BusinessTerminology = {
    getLabels: getLabels,
    AI_RELATED: AI_RELATED,
    AI_RELATED_SHORT: AI_RELATED_SHORT,
    updatePreviewStatLabels: updatePreviewStatLabels,
    WEBSITE_SUMMARY:
      "Executive Governance Assessment — upload a project export, preview free, receive board-ready deliverables after verified payment.",
    MARKETPLACE_SUMMARY:
      "Continuous AI Governance inside Jira — reviews, approvals, and audit evidence with Atlassian billing.",
  };
})(typeof window !== "undefined" ? window : globalThis);
