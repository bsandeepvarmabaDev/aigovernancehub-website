// AI Governance Hub API — upload-report v25.1 (enterprise gate P0)
import crypto from "crypto";
import {
  parseUploadContent,
  analyzeRecords,
  validateFileMeta,
  validateEncoding,
  validateUploadStructure,
  buildPreview,
  SUPPORTED_SOURCES,
  MAX_FILE_BYTES,
} from "./_lib/report-engine.js";
import { buildExecutiveAssessment } from "./_lib/executive-intelligence.js";
import { applyIndustryModel, normalizeIndustry } from "./_lib/industry-models.js";
import { getPlanById } from "./_lib/assessment-config.js";
import {
  createEnterpriseSalesRequest,
  notifySalesTeam,
} from "./_lib/enterprise-gate.js";
import { detectCountry } from "./_lib/pricing.js";
import { rejectClientPricingTamper } from "./_lib/enterprise-gate-rules.js";
import { createSessionToken, getKeySecret, hashContent } from "./_lib/tokens.js";
import {
  assertStorageConfigured,
  getSessionExpiresAt,
  saveSessionRecord,
  saveUploadedFile,
} from "./_lib/storage.js";
import { enforceRateLimit } from "./_lib/rate-limit.js";
import { applySecurityHeaders, sendError, sendJson } from "./_lib/security.js";
import { trackEvent } from "./_lib/analytics.js";
import { getCorrelationId, getRequestId, attachRequestHeaders, createRequestLogger, hashCustomerIdentifier } from "./_lib/correlation.js";
import { AUDIT_EVENTS, logSessionAudit } from "./_lib/audit.js";
import { incrementOpsCounter, recordOpsTiming } from "./_lib/ops-metrics.js";

function getSiteUrl() {
  return (
    (typeof process.env.SITE_URL === "string" && process.env.SITE_URL.trim()) ||
    "https://aigovernancehub.ai"
  ).replace(/\/$/, "");
}

export default async function handler(req, res) {
  const startedAt = Date.now();
  const correlationId = getCorrelationId(req);
  const requestId = getRequestId(req);
  attachRequestHeaders(res, { correlationId, requestId });
  applySecurityHeaders(res);

  const logger = createRequestLogger({
    correlationId,
    requestId,
    route: "/api/upload-report",
  });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    logger.finish("error", { statusCode: 405 });
    return sendError(res, 405, "Method not allowed.");
  }

  try {
    assertStorageConfigured();
  } catch {
    logger.finish("error", { statusCode: 503, category: "storage" });
    return sendError(res, 503, "Upload service is temporarily unavailable.");
  }

  await incrementOpsCounter("upload_received");

  const keySecret = getKeySecret();
  if (!keySecret) {
    return sendError(res, 503, "Upload service is not configured.");
  }

  const rateLimited = await enforceRateLimit(req, "upload-report");
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  const body = req.body || {};
  const tamperKey = rejectClientPricingTamper(body);
  if (tamperKey) {
    return sendError(res, 400, "Invalid upload request.");
  }

  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  const contentBase64 = typeof body.contentBase64 === "string" ? body.contentBase64 : "";
  const source = typeof body.source === "string" ? body.source.trim().toLowerCase() : "csv";
  const industry = normalizeIndustry(body.industry);

  if (!SUPPORTED_SOURCES.includes(source)) {
    return sendError(res, 400, "Choose a supported project source before uploading.");
  }

  if (!contentBase64) {
    return sendError(res, 400, "No file content provided.");
  }

  const maxBase64Chars = Math.ceil((MAX_FILE_BYTES * 4) / 3) + 128;
  if (contentBase64.length > maxBase64Chars) {
    return sendError(res, 400, "File exceeds the 5 MB self-service limit.");
  }

  let buffer;
  try {
    buffer = Buffer.from(contentBase64, "base64");
  } catch {
    return sendError(res, 400, "Invalid file encoding.");
  }

  const validationError = validateFileMeta(filename, buffer.length);
  if (validationError) {
    return sendError(res, 400, validationError);
  }

  const encodingError = validateEncoding(buffer);
  if (encodingError) {
    return sendError(res, 400, encodingError);
  }

  const rawText = buffer.toString("utf8");

  let parsed;
  try {
    parsed = parseUploadContent(filename, buffer);
  } catch {
    return sendError(res, 400, "Unable to read uploaded file. Export as CSV and try again.");
  }

  const structure = validateUploadStructure(parsed, buffer.length, rawText, source);

  if (!structure.ready) {
    return sendJson(res, 400, {
      error: structure.issues[0] || "File validation failed. Check required columns and try again.",
      validation: structure,
    });
  }

  const analysis = analyzeRecords(parsed.records);
  const plan = getPlanById(structure.plan.tier);
  const executiveAssessment = applyIndustryModel(
    buildExecutiveAssessment(parsed.records, analysis, {
      source,
      uploadDate: new Date().toISOString(),
      filename,
      planTier: structure.plan.tier,
      planLabel: plan.label,
      industry,
    }),
    industry
  );
  const sessionId = crypto.randomUUID();
  const fileHash = hashContent(buffer);
  const contentHash = hashContent(JSON.stringify({ analyzed: analysis.analyzed, v: executiveAssessment.version }));
  const sessionToken = createSessionToken(sessionId, contentHash, keySecret);
  const createdAt = new Date().toISOString();
  const uploadStorageKey = await saveUploadedFile(sessionId, filename, buffer);
  const preview = buildPreview(analysis, structure, executiveAssessment);

  const workItemMetrics =
    structure.compatibility?.workItemMetrics ||
    structure.plan?.workItemMetrics ||
    null;
  const enterpriseGate = structure.compatibility?.enterpriseGate === true;

  let salesRequestRef = null;
  if (enterpriseGate && workItemMetrics) {
    const country = detectCountry(req);
    const salesRequest = await createEnterpriseSalesRequest(
      { sessionId, filename, source, industry, uploadStorageKey },
      workItemMetrics,
      {
        country,
        detectedPlatform: structure.compatibility?.detectedPlatform || source,
        fileHash,
        auditId: fileHash.slice(0, 16),
        suggestedPlan: structure.plan?.tier || "enterprise",
      }
    );
    salesRequestRef = {
      requestId: salesRequest.requestId,
      secureReference: salesRequest.secureReference,
      status: salesRequest.status,
      statusLabel: salesRequest.statusLabel,
    };
    await notifySalesTeam(salesRequest, getSiteUrl());
  }

  await saveSessionRecord({
    sessionId,
    filename,
    source,
    industry,
    country: detectCountry(req),
    contentHash,
    fileHash,
    createdAt,
    expiresAt: getSessionExpiresAt(new Date(createdAt)),
    uploadStorageKey,
    preview,
    analysis,
    executiveAssessment,
    validation: structure,
    workItemMetrics,
    enterpriseGate,
    salesRequestRef,
    validationMetrics: workItemMetrics,
    selfServeAllowed: structure.selfServe,
    planTier: structure.plan.tier,
    paymentStatus: "pending",
  });

  await trackEvent("upload_completed", req, {
    correlationId,
    sessionId,
    source,
    planTier: structure.plan.tier,
    enterpriseGate,
  });

  await incrementOpsCounter("validation_complete");
  await recordOpsTiming("upload_ms", Date.now() - startedAt);
  await logSessionAudit(sessionId, AUDIT_EVENTS.UPLOAD_RECEIVED, {
    correlationId,
    requestId,
    planTier: structure.plan.tier,
    enterpriseGate,
  });
  await logSessionAudit(sessionId, AUDIT_EVENTS.VALIDATION_COMPLETE, {
    correlationId,
    requestId,
    workItems: workItemMetrics?.totalWorkItems ?? null,
  });

  if (salesRequestRef?.requestId) {
    await logSessionAudit(sessionId, AUDIT_EVENTS.ENTERPRISE_REQUEST_CREATED, {
      enterpriseRequestId: salesRequestRef.requestId,
      correlationId,
    });
  }

  logger.finish("success", {
    statusCode: 200,
    assessmentId: sessionId,
    enterpriseRequestId: salesRequestRef?.requestId || null,
  });

  return sendJson(res, 200, {
    sessionId,
    sessionToken,
    preview,
    compatibility: structure.compatibility,
    plan: structure.plan,
    fieldReport: structure.fieldReport,
    source,
    industry,
    enterpriseGate,
    salesRequestRef,
    reportFormats: ["html", "pdf", "docx", "pptx", "text"],
  });
}
