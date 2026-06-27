import crypto from "crypto";
import {
  REQUIRED_FIELDS,
  RECOMMENDED_FIELDS,
  OPTIONAL_FIELDS,
  detectPlanTier,
  planBlockReason,
  planRecommendationReason,
  SUPPORTED_SOURCES,
  UPLOAD_MAX_BYTES,
  ENTERPRISE_GATE_WORK_ITEMS,
  ENTERPRISE_PARSE_MAX_ITEMS,
} from "./assessment-config.js";
import { buildPreviewFromExecutive } from "./executive-intelligence.js";
import {
  generateExecutiveHtmlReport,
  generateExecutiveTextReport,
} from "./report-html-v22.js";
import { AI_RELATED_INVENTORY_HEADING } from "./business-labels.js";

const AI_KEYWORDS =
  /\b(ai|artificial intelligence|genai|generative|llm|gpt|openai|claude|gemini|copilot|rag|machine learning|ml model|neural|prompt|chatbot|embedding|fine-tun)\b/i;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
export { MAX_FILE_BYTES };
const MAX_RECORDS = ENTERPRISE_PARSE_MAX_ITEMS;
const SUSPICIOUS_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /onerror\s*=/i,
  /onclick\s*=/i,
  /<\?php/i,
  /<%/,
];

export { REQUIRED_FIELDS, RECOMMENDED_FIELDS, OPTIONAL_FIELDS, SUPPORTED_SOURCES };

export const ALLOWED_EXTENSIONS = [".csv", ".txt", ".tsv", ".xlsx", ".xls"];

export function validateFileMeta(filename, byteLength) {
  if (!filename || typeof filename !== "string") {
    return "A file name is required.";
  }

  const lower = filename.toLowerCase();
  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));

  if (!hasAllowedExt) {
    return "This file couldn't be processed because it doesn't match a supported Jira or CSV export. Download one of our sample templates or export directly from your project management tool.";
  }

  if (!Number.isFinite(byteLength) || byteLength <= 0) {
    return "The file appears empty. Export your work items again and make sure the file includes a header row plus at least one data row.";
  }

  if (byteLength > MAX_FILE_BYTES) {
    return "This file is larger than our 5 MB self-service limit. Filter your export to fewer projects, or request an Enterprise Assessment for large portfolios at sales@aigovernancehub.ai.";
  }

  return "";
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function headerMatches(headers, aliases) {
  const normalized = headers.map((h) => normalizeHeader(h));
  return aliases.some((alias) => normalized.includes(normalizeHeader(alias)));
}

function findMatchingHeader(headers, aliases) {
  const normalized = headers.map((h) => normalizeHeader(h));
  for (const alias of aliases) {
    const target = normalizeHeader(alias);
    const index = normalized.indexOf(target);
    if (index >= 0) {
      return headers[index];
    }
  }
  return null;
}

function rowFingerprint(row) {
  return crypto.createHash("sha256").update(JSON.stringify(row)).digest("hex").slice(0, 20);
}

/**
 * Server-side authoritative work item metrics (P0 — never trust client).
 */
export function countWorkItems(records, headers) {
  const issueKeyHeader = findMatchingHeader(
    headers,
    REQUIRED_FIELDS.find((f) => f.id === "issueKey").aliases
  );
  const projectHeader = findMatchingHeader(
    headers,
    REQUIRED_FIELDS.find((f) => f.id === "project").aliases
  );

  const totalWorkItems = records.length;
  const keysSeen = new Map();
  let duplicateRecords = 0;

  records.forEach((row) => {
    let key = issueKeyHeader ? String(row[issueKeyHeader] || "").trim().toLowerCase() : "";
    if (!key) {
      key = rowFingerprint(row);
    }
    if (keysSeen.has(key)) {
      duplicateRecords += 1;
    } else {
      keysSeen.set(key, true);
    }
  });

  const uniqueWorkItems = keysSeen.size;
  const projectCount = countDistinctProjects(records, projectHeader);

  return {
    totalWorkItems,
    uniqueWorkItems,
    duplicateRecords,
    projectCount,
    enterpriseGate: totalWorkItems > ENTERPRISE_GATE_WORK_ITEMS,
  };
}

function countDistinctProjects(records, projectHeader) {
  if (!projectHeader) {
    return 1;
  }
  const projects = new Set();
  records.forEach((row) => {
    const value = String(row[projectHeader] || "").trim();
    if (value) {
      projects.add(value.toLowerCase());
    }
  });
  return Math.max(projects.size, 1);
}

export function runSecurityScan(text) {
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      return "File contains disallowed content. Export a clean CSV from your project tool and try again.";
    }
  }
  return "";
}

export function validateEncoding(buffer) {
  const text = buffer.toString("utf8");
  if (text.includes("\uFFFD")) {
    return "File encoding is not supported. Save your export as UTF-8 CSV and try again.";
  }
  return "";
}

export function findDuplicateHeaders(headers) {
  const seen = new Map();
  const duplicates = [];
  headers.forEach((header) => {
    const key = normalizeHeader(header);
    if (!key) {
      return;
    }
    if (seen.has(key)) {
      duplicates.push(header);
    } else {
      seen.set(key, true);
    }
  });
  return duplicates;
}

export function validateUploadStructure(parsed, byteLength, rawText = "", source = "csv") {
  const issues = [];
  const { headers, records } = parsed;

  if (!headers || headers.length === 0) {
    return { valid: false, issues: ["File is missing a header row."], fieldReport: null };
  }

  const duplicates = findDuplicateHeaders(headers);
  if (duplicates.length > 0) {
    issues.push(`Duplicate column names detected: ${duplicates.slice(0, 3).join(", ")}.`);
  }

  if (rawText) {
    const securityIssue = runSecurityScan(rawText);
    if (securityIssue) {
      issues.push(securityIssue);
    }
  }

  const fieldReport = {
    required: REQUIRED_FIELDS.map((field) => ({
      id: field.id,
      label: field.label,
      why: field.why,
      present: headerMatches(headers, field.aliases),
      matchedHeader: findMatchingHeader(headers, field.aliases),
    })),
    recommended: RECOMMENDED_FIELDS.map((field) => ({
      id: field.id,
      label: field.label,
      present: headerMatches(headers, field.aliases),
    })),
    optional: OPTIONAL_FIELDS.map((field) => ({
      id: field.id,
      label: field.label,
      present: headerMatches(headers, field.aliases),
    })),
  };

  const missingRequired = fieldReport.required.filter((f) => !f.present);
  if (missingRequired.length > 0) {
    issues.push(
      `Your export is missing required columns: ${missingRequired.map((f) => f.label).join(", ")}. Re-export with all fields from Jira or Azure DevOps, or download our sample template and match the column headers exactly.`
    );
  }

  if (records.length === 0) {
    issues.push("We couldn't find any work items in this file. Make sure your export includes a header row and at least one row of data below it.");
  }

  if (records.length > MAX_RECORDS) {
    issues.push(
      `This upload contains ${records.length.toLocaleString()} work items, which exceeds our self-service parsing limit of ${MAX_RECORDS.toLocaleString()}. Request an Enterprise Assessment at sales@aigovernancehub.ai for dedicated portfolio processing.`
    );
  }

  const workItemMetrics = countWorkItems(records, headers);
  const planTier = detectPlanTier(
    workItemMetrics.totalWorkItems,
    workItemMetrics.projectCount,
    byteLength
  );
  const planReason = planRecommendationReason(
    planTier,
    workItemMetrics.totalWorkItems,
    workItemMetrics.projectCount,
    byteLength
  );
  const blockReason = planBlockReason(
    planTier,
    workItemMetrics.totalWorkItems,
    workItemMetrics.projectCount
  );

  const enterpriseGate = workItemMetrics.enterpriseGate === true;

  const requiredPresent = missingRequired.length === 0;
  const recommendedPresent = fieldReport.recommended.filter((f) => f.present).length;
  const optionalCount =
    recommendedPresent + fieldReport.optional.filter((f) => f.present).length;

  let compatibilityScore = 100;
  compatibilityScore -= missingRequired.length * 14;
  compatibilityScore -= duplicates.length * 5;
  compatibilityScore += Math.min(optionalCount * 2, 12);
  compatibilityScore = Math.max(0, Math.min(100, compatibilityScore));

  const ready = requiredPresent && duplicates.length === 0 && records.length > 0 && issues.length === 0;
  const selfServe = !enterpriseGate && planTier.selfServe && ready;
  const estimatedSeconds = Math.max(5, Math.ceil(records.length / 40));
  const platformLabels = {
    jira: "Jira Cloud",
    "azure-devops": "Azure DevOps",
    excel: "Excel",
    csv: "CSV",
  };

  return {
    ready,
    selfServe,
    issues,
    compatibility: {
      score: compatibilityScore,
      workItems: workItemMetrics.totalWorkItems,
      uniqueWorkItems: workItemMetrics.uniqueWorkItems,
      duplicateRecords: workItemMetrics.duplicateRecords,
      projectCount: workItemMetrics.projectCount,
      workItemMetrics,
      enterpriseGate,
      requiredPresent,
      requiredFieldsCount: fieldReport.required.filter((f) => f.present).length,
      recommendedFieldsCount: recommendedPresent,
      optionalCount,
      ready,
      missingRequired: missingRequired.map((f) => f.label),
      duplicates,
      detectedPlatform: platformLabels[source] || source,
      encoding: "UTF-8",
      estimatedAnalysisTime: estimatedSeconds < 60 ? `${estimatedSeconds} seconds` : `${Math.ceil(estimatedSeconds / 60)} minutes`,
    },
    plan: {
      tier: planTier.id,
      label: enterpriseGate ? "Enterprise Assessment Required" : planTier.label,
      selfServe,
      enterpriseGate,
      reason: planReason,
      blockReason: enterpriseGate
        ? blockReason || `Enterprise Assessment Required — ${workItemMetrics.totalWorkItems.toLocaleString()} work items exceeds the ${ENTERPRISE_GATE_WORK_ITEMS.toLocaleString()} self-service limit.`
        : blockReason || null,
      workItems: workItemMetrics.totalWorkItems,
      uniqueWorkItems: workItemMetrics.uniqueWorkItems,
      duplicateRecords: workItemMetrics.duplicateRecords,
      projectCount: workItemMetrics.projectCount,
    },
    fieldReport,
  };
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

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs > commas ? "\t" : ",";
}

export function parseUploadContent(filename, buffer) {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return parseSpreadsheetAsText(buffer.toString("utf8"), filename);
  }

  const text = buffer.toString("utf8");
  return parseDelimitedText(text, filename);
}

function parseSpreadsheetAsText(text, filename) {
  if (!text.trim()) {
    throw new Error("The Excel file could not be read. Export as CSV and try again.");
  }

  return parseDelimitedText(text, filename);
}

/**
 * Mitigate CSV/spreadsheet formula injection in exported reports (v25.11).
 */
export function sanitizeSpreadsheetCell(value) {
  const text = String(value ?? "");
  if (!text) return text;
  if (/^[=+\-@\t\r]/.test(text)) {
    return `'${text}`;
  }
  return text;
}

function parseDelimitedText(text, filename) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("File must contain a header row and at least one data row.");
  }

  const delimiter = detectDelimiter(text);
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const records = [];

  for (let i = 1; i < lines.length && records.length < MAX_RECORDS; i += 1) {
    const cells =
      delimiter === ","
        ? parseCsvLine(lines[i])
        : lines[i].split(delimiter).map((cell) => cell.trim());

    const row = {};
    headers.forEach((header, index) => {
      row[header] = sanitizeSpreadsheetCell(cells[index] || "");
    });

    const hasContent = Object.values(row).some((value) => String(value).trim() !== "");
    if (hasContent) {
      records.push(row);
    }
  }

  if (records.length === 0) {
    throw new Error("No data rows found in the uploaded file.");
  }

  return { headers, records, filename };
}

function rowText(row) {
  return Object.values(row)
    .map((value) => String(value || ""))
    .join(" ");
}

function isAiCandidate(row) {
  const summary = pickField(row, [
    "summary",
    "title",
    "application name",
    "application",
    "issue",
    "name",
  ]);
  const description = pickField(row, [
    "description",
    "use case",
    "ai use case",
    "details",
  ]);
  const labels = pickField(row, ["labels", "label", "components"]);
  const model = pickField(row, ["ai model", "model"]);
  const combined = `${summary} ${description} ${labels} ${model}`;

  return AI_KEYWORDS.test(combined);
}

function normalizeRiskLevel(value) {
  const risk = String(value || "").toLowerCase();
  if (risk.includes("high")) return "High";
  if (risk.includes("low")) return "Low";
  if (risk.includes("medium")) return "Medium";
  return "";
}

function calculateRiskScore(payload) {
  let score = 0;
  if (payload.riskLevel === "Low") score += 10;
  if (payload.riskLevel === "Medium") score += 25;
  if (payload.riskLevel === "High") score += 40;
  if (payload.containsPII === "Yes") score += 15;
  if (payload.containsFinancial === "Yes") score += 20;
  if (payload.containsHealthcare === "Yes") score += 25;
  if (payload.usesCustomerData === "Yes") score += 10;
  if (payload.deploymentType === "Customer Facing") score += 15;
  if (payload.deploymentType === "Public") score += 25;
  if (payload.dataClassification === "Internal") score += 5;
  if (payload.dataClassification === "Confidential") score += 15;
  if (["OpenAI", "Gemini", "Claude"].includes(payload.aiModel)) score += 10;
  return Math.min(score, 100);
}

function getClassification(score) {
  if (score >= 70) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function analyzeRecord(row, index) {
  const name =
    pickField(row, ["application name", "application", "summary", "title", "issue key", "key"]) ||
    `Record ${index + 1}`;
  const explicitRisk = normalizeRiskLevel(pickField(row, ["risk level", "risk", "classification"]));

  const payload = {
    riskLevel: explicitRisk || "Medium",
    containsPII: /^yes$/i.test(pickField(row, ["contains pii", "pii"])) ? "Yes" : "No",
    containsFinancial: /^yes$/i.test(pickField(row, ["contains financial", "financial"])) ? "Yes" : "No",
    containsHealthcare: /^yes$/i.test(pickField(row, ["contains healthcare", "hipaa", "healthcare"]))
      ? "Yes"
      : "No",
    usesCustomerData: /^yes$/i.test(pickField(row, ["uses customer data", "customer data"])) ? "Yes" : "No",
    deploymentType: pickField(row, ["deployment type", "deployment"]) || "Internal",
    dataClassification: pickField(row, ["data classification", "classification data"]) || "Internal",
    aiModel: pickField(row, ["ai model", "model"]) || "Unknown",
  };

  const riskScore = calculateRiskScore(payload);
  const riskBand = explicitRisk || getClassification(riskScore);
  const aiCandidate = isAiCandidate(row);

  return {
    name,
    aiCandidate,
    riskBand,
    riskScore,
    owner: pickField(row, ["business owner", "owner", "assignee", "reporter"]) || "Unassigned",
    useCase: pickField(row, ["use case", "description"]) || rowText(row).slice(0, 180),
    aiModel: payload.aiModel,
    deploymentType: payload.deploymentType,
  };
}

export function analyzeRecords(records) {
  const analyzed = records.map((row, index) => analyzeRecord(row, index));
  const aiCandidates = analyzed.filter((item) => item.aiCandidate);
  const riskSummary = { high: 0, medium: 0, low: 0 };

  aiCandidates.forEach((item) => {
    if (item.riskBand === "High") riskSummary.high += 1;
    else if (item.riskBand === "Medium") riskSummary.medium += 1;
    else riskSummary.low += 1;
  });

  const candidateCount = aiCandidates.length;
  const totalRecords = records.length;
  const coverageRatio = totalRecords > 0 ? candidateCount / totalRecords : 0;
  const highRatio = candidateCount > 0 ? riskSummary.high / candidateCount : 0;

  let governanceScore = 100;
  governanceScore -= Math.round(highRatio * 35);
  governanceScore -= Math.round(coverageRatio * 20);
  governanceScore -= Math.min(riskSummary.medium * 2, 20);
  governanceScore = Math.max(0, Math.min(100, governanceScore));

  let governanceRating = "At Risk";
  if (governanceScore >= 90) governanceRating = "Excellent";
  else if (governanceScore >= 75) governanceRating = "Good";
  else if (governanceScore >= 60) governanceRating = "Needs Attention";

  const governanceScoreReason = buildGovernanceScoreReason({
    governanceScore,
    highRatio,
    coverageRatio,
    riskSummary,
    candidateCount,
  });

  const topRisks = aiCandidates
    .filter((item) => item.riskBand === "High")
    .slice(0, 5)
    .map((item) => item.name);
  const topOpportunities = [
    candidateCount > 0 ? "Assign owners to all AI-related work items" : "Upload a richer inventory export",
    riskSummary.high > 0 ? "Prioritize high-risk items for governance review" : "Maintain current low-risk posture",
    "Install AI Governance Hub on Jira Cloud for ongoing reviews",
  ];

  const frameworkMapping = buildFrameworkMapping(riskSummary, candidateCount);
  const executiveSummary = buildExecutiveSummary({
    totalRecords,
    candidateCount,
    riskSummary,
    governanceScore,
    governanceRating,
  });
  const recommendations = buildRecommendations(riskSummary, candidateCount);

  return {
    totalRecords,
    aiCandidates: candidateCount,
    riskSummary,
    governanceScore,
    governanceRating,
    governanceScoreReason,
    executiveSummary,
    topRisks,
    topOpportunities,
    frameworkMapping,
    recommendations,
    analyzed,
    aiCandidateRows: aiCandidates.slice(0, 50),
  };
}

function buildGovernanceScoreReason({ governanceScore, highRatio, coverageRatio, riskSummary, candidateCount }) {
  const reasons = [];
  if (candidateCount === 0) {
    reasons.push("No AI-related work items were detected in the uploaded inventory.");
  }
  if (highRatio > 0) {
    reasons.push(`${Math.round(highRatio * 100)}% of AI-related work items are classified as high risk.`);
  }
  if (coverageRatio > 0.5) {
    reasons.push("A large share of scanned records appear AI-related, increasing governance scope.");
  }
  if (riskSummary.medium > 0) {
    reasons.push(`${riskSummary.medium} medium-risk work items require structured governance review.`);
  }
  if (reasons.length === 0) {
    reasons.push("Risk distribution and AI-related work item coverage indicate a manageable governance posture.");
  }
  return `Score ${governanceScore}% — ${reasons.join(" ")}`;
}

function buildExecutiveSummary({ totalRecords, candidateCount, riskSummary, governanceScore, governanceRating }) {
  return `${totalRecords} records were scanned and ${candidateCount} AI-related work items were identified. The portfolio shows ${riskSummary.high} high, ${riskSummary.medium} medium, and ${riskSummary.low} low risk items. Governance score is ${governanceScore}% (${governanceRating}).`;
}

function buildFrameworkMapping(riskSummary, candidateCount) {
  return {
    euAiAct: {
      title: "EU AI Act",
      readiness:
        riskSummary.high > 0
          ? "High-risk AI use cases detected — prioritize classification, documentation, and oversight workflows."
          : "No high-risk classifications detected in this snapshot — continue monitoring AI inventory.",
      actions: ["Document AI system purpose", "Assign accountable owner", "Track risk classification evidence"],
    },
    iso42001: {
      title: "ISO 42001",
      readiness:
        candidateCount > 0
          ? "AI management system controls can be mapped to detected AI-related work items for inventory and review tracking."
          : "Limited AI inventory detected — expand data export for ISO 42001 alignment.",
      actions: ["Maintain AI inventory", "Define governance roles", "Track continual improvement actions"],
    },
    nistAiRmf: {
      title: "NIST AI RMF",
      readiness: "Apply Govern, Map, Measure, and Manage functions through Jira-based review workflows.",
      actions: ["Map AI use cases", "Measure risk signals", "Manage review and approval lifecycle"],
    },
  };
}

function buildRecommendations(riskSummary, candidateCount) {
  const items = [];
  if (riskSummary.high > 0) {
    items.push("Escalate high-risk AI-related work items for immediate governance review.");
  }
  if (candidateCount === 0) {
    items.push("Broaden export filters or labels to capture AI-related Jira work items.");
  }
  items.push("Assign business owners and collect evidence for each AI-related work item.");
  items.push("Operationalize ongoing governance in Jira via AI Governance Hub Marketplace install.");
  return items.slice(0, 5);
}

export function buildPreview(analysis, validation = null, executiveAssessment = null) {
  if (executiveAssessment) {
    return buildPreviewFromExecutive(executiveAssessment, validation);
  }

  const preview = {
    version: "22.0",
    totalRecords: analysis.totalRecords,
    aiCandidates: analysis.aiCandidates,
    riskSummary: analysis.riskSummary,
    governanceScore: analysis.governanceScore,
    governanceRating: analysis.governanceRating,
    executiveSummary: analysis.executiveSummary,
    topOpportunities: (analysis.topOpportunities || []).slice(0, 3),
    frameworkMapping: Object.values(analysis.frameworkMapping || {}).map((f) => ({
      title: f.title,
      readiness: f.readiness,
    })),
    locked: true,
    lockedFeatures: [
      "Full executive report (HTML, PDF, DOCX, PowerPoint)",
      "Governance score breakdown with WHY",
      "AI opportunity matrix",
      "Department analysis",
      "Risk heatmap",
      "Executive roadmap",
    ],
  };

  if (validation) {
    preview.compatibility = validation.compatibility;
    preview.plan = validation.plan;
  }

  return preview;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function frameworkSection(mapping) {
  return Object.values(mapping)
    .map(
      (item) =>
        `<section><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.readiness)}</p><ul>${item.actions
          .map((action) => `<li>${escapeHtml(action)}</li>`)
          .join("")}</ul></section>`
    )
    .join("");
}

export function generateHtmlReport(analysis, meta, executiveAssessment = null) {
  if (executiveAssessment) {
    return generateExecutiveHtmlReport(executiveAssessment, meta);
  }
  const generatedAt = new Date().toISOString();
  const rows = analysis.aiCandidateRows
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.riskBand)}</td><td>${item.riskScore}</td><td>${escapeHtml(item.owner)}</td><td>${escapeHtml(item.aiModel)}</td><td>${escapeHtml(item.deploymentType)}</td></tr>`
    )
    .join("");

  const recommendations = (analysis.recommendations || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AI Governance Executive Assessment</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111827; line-height: 1.5; }
    h1 { color: #1d4ed8; }
    h2 { margin-top: 28px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 24px 0; }
    .card { border: 1px solid #dbeafe; border-radius: 8px; padding: 16px; background: #eff6ff; }
    .disclaimer { border-left: 4px solid #f59e0b; background: #fffbeb; padding: 12px 16px; margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 14px; }
    th { background: #f3f4f6; }
    .footer { margin-top: 32px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>Executive AI Governance Assessment</h1>
  <p>Generated for ${escapeHtml(meta.buyerName || "Customer")} on ${escapeHtml(generatedAt)}</p>
  <h2>Executive Summary</h2>
  <p>${escapeHtml(analysis.executiveSummary || "")}</p>
  <div class="summary">
    <div class="card"><strong>Total records scanned</strong><br />${analysis.totalRecords}</div>
    <div class="card"><strong>AI-related work items found</strong><br />${analysis.aiCandidates}</div>
    <div class="card"><strong>High risk</strong><br />${analysis.riskSummary.high}</div>
    <div class="card"><strong>Medium risk</strong><br />${analysis.riskSummary.medium}</div>
    <div class="card"><strong>Low risk</strong><br />${analysis.riskSummary.low}</div>
    <div class="card"><strong>Governance score</strong><br />${analysis.governanceScore}% (${escapeHtml(analysis.governanceRating)})</div>
  </div>
  <h2>Governance Score</h2>
  <p>${escapeHtml(analysis.governanceScoreReason || "")}</p>
  <h2>Top Risks</h2>
  <ul>${(analysis.topRisks || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>No high-risk AI-related work items identified.</li>"}</ul>
  <h2>Top Opportunities</h2>
  <ul>${(analysis.topOpportunities || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  <h2>AI-Related Work Item Inventory</h2>
  <table>
    <thead><tr><th>Item</th><th>Risk</th><th>Score</th><th>Owner</th><th>Model</th><th>Deployment</th></tr></thead>
    <tbody>${rows || "<tr><td colspan=\"6\">No AI-related work items detected.</td></tr>"}</tbody>
  </table>
  <h2>Framework Mapping</h2>
  ${frameworkSection(analysis.frameworkMapping || {})}
  <h2>Recommendations</h2>
  <ol>${recommendations}</ol>
  <p class="disclaimer"><strong>Disclaimer:</strong> This report supports governance review and is not legal certification.</p>
  <p class="footer">Reference ${escapeHtml(meta.orderRef || meta.orderId || "")} · AI Governance Hub</p>
</body>
</html>`;
}

export function generateTextReport(analysis, meta, executiveAssessment = null) {
  if (executiveAssessment) {
    return generateExecutiveTextReport(executiveAssessment, meta);
  }
  const lines = [
    "Executive AI Governance Assessment",
    `Generated: ${new Date().toISOString()}`,
    `Buyer: ${meta.buyerName || "Customer"}`,
    "",
    "EXECUTIVE SUMMARY",
    analysis.executiveSummary || "",
    "",
    `Total records scanned: ${analysis.totalRecords}`,
    `AI-related work items found: ${analysis.aiCandidates}`,
    `High risk: ${analysis.riskSummary.high}`,
    `Medium risk: ${analysis.riskSummary.medium}`,
    `Low risk: ${analysis.riskSummary.low}`,
    `Governance score: ${analysis.governanceScore}% (${analysis.governanceRating})`,
    analysis.governanceScoreReason || "",
    "",
    "TOP RISKS",
    ...(analysis.topRisks || []).map((item) => `- ${item}`),
    "",
    "TOP OPPORTUNITIES",
    ...(analysis.topOpportunities || []).map((item) => `- ${item}`),
    "",
    AI_RELATED_INVENTORY_HEADING,
  ];

  analysis.aiCandidateRows.forEach((item) => {
    lines.push(`- ${item.name} | ${item.riskBand} | score ${item.riskScore} | ${item.owner}`);
  });

  lines.push("", "FRAMEWORK MAPPING");
  Object.values(analysis.frameworkMapping || {}).forEach((framework) => {
    lines.push(`${framework.title}: ${framework.readiness}`);
  });

  lines.push("", "RECOMMENDATIONS");
  (analysis.recommendations || []).forEach((item) => lines.push(`- ${item}`));

  lines.push(
    "",
    "DISCLAIMER: This report supports governance review and is not legal certification.",
    "",
    `Reference: ${meta.orderRef || meta.orderId || ""}`
  );
  return lines.join("\n");
}
