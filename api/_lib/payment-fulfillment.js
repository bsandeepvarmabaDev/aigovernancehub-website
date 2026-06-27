/**
 * Shared post-payment fulfillment — Razorpay (server-verified) v25.23
 */
import {
  createRecoveryToken,
  createSuccessToken,
  getDownloadSigningSecret,
  getEmailIndexSecret,
  getKeySecret,
} from "./tokens.js";
import { generateHtmlReport, generateTextReport } from "./report-engine.js";
import { generateAllExecutiveFormatsV24 } from "./report-export-v24.js";
import { applyIndustryModel, normalizeIndustry } from "./industry-models.js";
import { buildIntelligenceSnapshot } from "./intelligence-snapshot.js";
import { hashEmailForAnalytics } from "./platform-analytics.js";
import { getPlanById } from "./assessment-config.js";
import {
  loadSalesRequestBySession,
  saveSalesRequest,
  markEnterpriseReportDelivered,
  ENTERPRISE_STATUS,
} from "./enterprise-gate.js";
import {
  getReportExpiresAt,
  indexReportForEmail,
  indexPaymentOrder,
  indexSessionOrder,
  indexOrderSession,
  findSessionIdByOrderId,
  loadReportRecord,
  loadSessionRecord,
  maskOrderId,
  maskPaymentId,
  normalizeEmail,
  saveReportContent,
  saveReportRecord,
} from "./storage.js";
import { getClientIp, hashIp } from "./rate-limit.js";
import { AUDIT_EVENTS, logAudit } from "./audit.js";
import { sendPaymentEmails } from "./email.js";
import { trackEvent } from "./analytics.js";
import {
  PAYMENT_STATE,
  REPORT_STATE,
  CUSTOMER_PAYMENT_STATE,
  buildCustomerStatusView,
  isGenerationInProgress,
  isGenerationStale,
} from "./payment-state.js";
import { incrementOpsCounter, recordOpsTiming } from "./ops-metrics.js";
import { emitAlert, ALERT_TYPES } from "./alerting.js";
import { logEvent } from "./correlation.js";

function getSiteUrl() {
  return (
    (typeof process.env.SITE_URL === "string" && process.env.SITE_URL.trim()) ||
    "https://aigovernancehub.ai"
  ).replace(/\/$/, "");
}

export async function buildVerifiedResponse(report) {
  const downloadSecret = getDownloadSigningSecret();
  const confirmationToken = createSuccessToken(report.orderId, report.paymentId, downloadSecret);
  const recoveryToken = createRecoveryToken(
    report.orderId,
    report.paymentId,
    report.buyerEmail,
    downloadSecret
  );
  const statusView = buildCustomerStatusView(report);
  const customerPaymentState = statusView.customerPaymentState;
  const downloadReady = statusView.downloadReady;
  let message = statusView.message || "Payment verified. Your full report is ready to download.";
  if (customerPaymentState === CUSTOMER_PAYMENT_STATE.PROCESSING) {
    message = "Payment verified. Your executive assessment is being prepared.";
  }

  return {
    success: true,
    valid: true,
    confirmationToken,
    recoveryToken,
    orderId: report.orderId,
    paymentId: report.paymentId,
    customerPaymentState,
    statusLabel: statusView.statusLabel,
    message,
    downloadReady,
    availableFormats: statusView.availableFormats,
    emailStatus: statusView.emailStatus,
    reportStatus: statusView.reportStatus,
    correlationId: report.correlationId || null,
  };
}

function buildVerifiedStub({
  session,
  sessionId,
  orderId,
  paymentId,
  name,
  email,
  company,
  industry,
  paymentProvider,
  planTier,
  plan,
  createdAt,
}) {
  return {
    orderId,
    paymentId,
    sessionId,
    buyerName: name,
    buyerEmail: normalizeEmail(email),
    company: company || null,
    filename: session.filename,
    uploadDate: session.createdAt || createdAt,
    workItemCount: session.workItemMetrics?.totalWorkItems ?? session.preview?.totalRecords ?? null,
    detectedPlatform: session.source,
    industry: normalizeIndustry(industry || session.industry),
    planTier,
    planLabel: plan.label,
    paymentProvider,
    paymentState: PAYMENT_STATE.PAID,
    paymentStatus: "verified",
    reportStatus: REPORT_STATE.GENERATING,
    createdAt,
    expiresAt: getReportExpiresAt(new Date(createdAt)),
    downloadCount: 0,
    emailSent: false,
    emailError: null,
    preview: session.preview,
    workItemMetrics: session.workItemMetrics || null,
    projectCount: session.workItemMetrics?.projectCount ?? session.validation?.compatibility?.projectCount ?? null,
  };
}

/**
 * Persist server-verified payment before report generation (idempotent).
 * Indexes email so dashboard/recover can locate the payment immediately.
 */
export async function persistVerifiedPayment({
  session,
  sessionId,
  orderId,
  paymentId,
  name,
  email,
  company = "",
  industry,
  paymentProvider = "razorpay",
  keySecret,
  req,
  correlationId,
  isEnterpriseOrder = false,
}) {
  const existingReport = await loadReportRecord(orderId);
  if (existingReport?.paymentStatus === "verified") {
    if (existingReport.paymentId !== paymentId) {
      throw new Error("duplicate_payment_id");
    }
    if (correlationId && !existingReport.correlationId) {
      const patched = { ...existingReport, correlationId };
      await saveReportRecord(patched);
      return patched;
    }
    return existingReport;
  }

  const createdAt = new Date().toISOString();
  const planTier = session.planTier || session.pendingCheckout?.planId || "starter";
  const plan = getPlanById(planTier);
  const analyticsSecret = getEmailIndexSecret();
  const record = {
    ...buildVerifiedStub({
      session,
      sessionId,
      orderId,
      paymentId,
      name,
      email,
      company,
      industry,
      paymentProvider,
      planTier,
      plan,
      createdAt,
    }),
    correlationId: correlationId || existingReport?.correlationId || null,
  };

  await saveReportRecord({ ...record, ...(existingReport || {}) });
  await indexReportForEmail(email, orderId, analyticsSecret);
  await indexPaymentOrder(paymentId, orderId);
  await indexSessionOrder(sessionId, orderId);
  await indexOrderSession(orderId, sessionId);

  await logAudit(orderId, AUDIT_EVENTS.PAYMENT_VERIFIED, {
    sessionId,
    email: normalizeEmail(email),
    paymentProvider,
    ipHash: req && keySecret ? hashIp(getClientIp(req), keySecret) : null,
    correlationId,
  });

  const salesRequest = await loadSalesRequestBySession(sessionId);
  if (salesRequest && isEnterpriseOrder) {
    salesRequest.status = ENTERPRISE_STATUS.PAYMENT_RECEIVED;
    salesRequest.paidAt = createdAt;
    salesRequest.customOrderId = orderId;
    await saveSalesRequest(salesRequest);
  }

  if (req) {
    await trackEvent("payment_verified", req, {
      correlationId,
      orderId,
      planTier,
      paymentProvider,
      emailHash: hashEmailForAnalytics(normalizeEmail(email), analyticsSecret),
    });
  }

  await incrementOpsCounter("payment_verified");
  return record;
}

async function generateReportArtifacts(session, reportMeta, normalizedIndustry) {
  const executiveRaw = session.executiveAssessment;
  const executive = executiveRaw ? applyIndustryModel(executiveRaw, normalizedIndustry) : null;
  let availableFormats = ["html", "text"];

  if (executive) {
    const formats = await generateAllExecutiveFormatsV24(executive, reportMeta);
    await saveReportContent(reportMeta.orderId, formats.html, formats.text, {
      pdf: formats.pdf,
      docx: formats.docx,
      pptx: formats.pptx,
    });
    availableFormats = ["html", "text", "pdf", "docx", "pptx"];
  } else {
    const html = generateHtmlReport(session.analysis, reportMeta);
    const text = generateTextReport(session.analysis, reportMeta);
    await saveReportContent(reportMeta.orderId, html, text);
  }

  return { executive, availableFormats };
}

/**
 * Idempotent — persists verified payment first, then generates report artifacts.
 */
export async function fulfillPaidAssessment({
  session,
  sessionId,
  orderId,
  paymentId,
  name,
  email,
  company = "",
  industry,
  keySecret,
  req,
  correlationId,
  paymentProvider = "razorpay",
  isEnterpriseOrder = false,
  forceRegenerate = false,
}) {
  const existingReport = await loadReportRecord(orderId);
  if (
    existingReport?.paymentStatus === "verified" &&
    existingReport?.reportStatus === REPORT_STATE.READY &&
    !forceRegenerate
  ) {
    return { report: existingReport, alreadyFulfilled: true };
  }

  if (isGenerationInProgress(existingReport, forceRegenerate)) {
    return { report: existingReport, alreadyFulfilled: true, inProgress: true };
  }

  const shouldForceRegenerate =
    forceRegenerate ||
    existingReport?.reportStatus === REPORT_STATE.FAILED ||
    isGenerationStale(existingReport);

  const baseRecord = await persistVerifiedPayment({
    session,
    sessionId,
    orderId,
    paymentId,
    name,
    email,
    company,
    industry,
    paymentProvider,
    keySecret,
    req,
    correlationId,
    isEnterpriseOrder,
  });

  if (baseRecord.reportStatus === REPORT_STATE.READY && !shouldForceRegenerate) {
    return { report: baseRecord, alreadyFulfilled: true };
  }

  const createdAt = baseRecord.createdAt || new Date().toISOString();
  const planTier = session.planTier || session.pendingCheckout?.planId || "starter";
  const plan = getPlanById(planTier);
  const normalizedIndustry = normalizeIndustry(industry || session.industry);
  const storedCorrelationId = correlationId || baseRecord.correlationId || null;

  await saveReportRecord({
    ...baseRecord,
    reportStatus: REPORT_STATE.GENERATING,
    reportError: null,
    correlationId: storedCorrelationId,
    updatedAt: new Date().toISOString(),
  });

  const reportMeta = {
    buyerName: name,
    buyerEmail: normalizeEmail(email),
    company,
    orderId,
    paymentId,
    orderRef: maskOrderId(orderId),
    paymentRef: maskPaymentId(paymentId),
    paidAt: createdAt,
    planTier,
    planLabel: plan.label,
  };

  let executive;
  let availableFormats = ["html", "text"];

  try {
    const generated = await generateReportArtifacts(session, reportMeta, normalizedIndustry);
    executive = generated.executive;
    availableFormats = generated.availableFormats;
  } catch (error) {
    const failedRecord = {
      ...(await loadReportRecord(orderId)),
      paymentState: PAYMENT_STATE.PAID,
      paymentStatus: "verified",
      reportStatus: REPORT_STATE.FAILED,
      reportError: error instanceof Error ? error.message : "Report generation failed.",
      correlationId: storedCorrelationId,
      updatedAt: new Date().toISOString(),
    };
    await saveReportRecord(failedRecord);
    await logAudit(orderId, AUDIT_EVENTS.REPORT_GENERATION_FAILED, {
      sessionId,
      correlationId,
      category: "reliability",
    });
    await incrementOpsCounter("report_generation_failed");
    await emitAlert(ALERT_TYPES.REPORT_GENERATION_FAILED, { orderId, correlationId, sessionId });
    logEvent("error", "report_generation_failed", {
      orderId,
      correlationId,
      category: "reliability",
      message: failedRecord.reportError,
    });
    throw error;
  }

  const intelligenceSnapshot = executive
    ? buildIntelligenceSnapshot(executive, {
        orderId,
        orderRef: maskOrderId(orderId),
        paidAt: createdAt,
        industry: normalizedIndustry,
        source: session.source,
        company,
        planTier,
        planLabel: plan.label,
      })
    : null;

  const priorEmailSent = Boolean(baseRecord.emailSent);

  const reportRecord = {
    orderId,
    paymentId,
    sessionId,
    buyerName: name,
    buyerEmail: normalizeEmail(email),
    company: company || null,
    filename: session.filename,
    uploadDate: session.createdAt || createdAt,
    workItemCount: session.workItemMetrics?.totalWorkItems ?? session.preview?.totalRecords ?? null,
    detectedPlatform: session.source,
    industry: normalizedIndustry,
    planTier,
    planLabel: plan.label,
    reportVersion: executive ? "24.0" : "21.0",
    governanceScore:
      executive?.executiveSummary?.governanceScore ?? session.preview?.governanceScore ?? null,
    aiReadiness: executive?.executiveSummary?.aiReadiness ?? session.preview?.aiReadiness ?? null,
    availableFormats,
    intelligenceSnapshot,
    paymentProvider,
    paymentState: PAYMENT_STATE.PAID,
    paymentStatus: "verified",
    reportStatus: REPORT_STATE.READY,
    reportError: null,
    correlationId: storedCorrelationId,
    createdAt,
    expiresAt: getReportExpiresAt(new Date(createdAt)),
    downloadCount: baseRecord.downloadCount || 0,
    lastDownloadAt: baseRecord.lastDownloadAt || null,
    lastDownloadIpHash: baseRecord.lastDownloadIpHash || null,
    preview: session.preview,
    emailSent: priorEmailSent,
    emailError: priorEmailSent ? null : baseRecord.emailError || null,
  };

  await saveReportRecord(reportRecord);

  if (isEnterpriseOrder) {
    const salesRequest = await loadSalesRequestBySession(sessionId);
    if (salesRequest) {
      await markEnterpriseReportDelivered(salesRequest, orderId, "system");
    }
  }

  await logAudit(orderId, AUDIT_EVENTS.REPORT_GENERATED, {
    sessionId,
    email: normalizeEmail(email),
    paymentProvider,
    correlationId: storedCorrelationId,
  });
  await incrementOpsCounter("report_generated");

  const siteUrl = getSiteUrl();
  let emailResult = { sent: false, reason: "Email not attempted." };
  if (priorEmailSent) {
    emailResult = { sent: true, reason: "Already sent." };
  } else {
    try {
      emailResult = await sendPaymentEmails({
        buyerName: name,
        buyerEmail: normalizeEmail(email),
        company,
        orderRef: maskOrderId(orderId),
        paymentRef: maskPaymentId(paymentId),
        paidAt: createdAt,
        downloadUrl: `${siteUrl}/recover-report.html`,
        recoverUrl: `${siteUrl}/recover-report.html`,
        dashboardUrl: `${siteUrl}/dashboard.html`,
        governanceScore: reportRecord.governanceScore,
        topRecommendation:
          executive?.recommendations?.[0]?.title ||
          executive?.executiveSummary?.overallRecommendation ||
          null,
        planLabel: plan.label,
        availableFormats,
      });
    } catch (error) {
      emailResult = {
        sent: false,
        reason: error instanceof Error ? error.message : "Email delivery failed.",
      };
      logEvent("error", "payment_email_failed", {
        orderId,
        correlationId: storedCorrelationId,
        category: "reliability",
        message: emailResult.reason,
      });
    }
  }

  if (!priorEmailSent) {
    reportRecord.emailSent = emailResult.sent === true;
    reportRecord.emailError = emailResult.sent ? null : emailResult.reason || "Email not sent.";
    await saveReportRecord(reportRecord);

    if (emailResult.sent) {
      await logAudit(orderId, AUDIT_EVENTS.REPORT_EMAILED, {
        email: normalizeEmail(email),
        correlationId: storedCorrelationId,
      });
    } else {
      await logAudit(orderId, AUDIT_EVENTS.REPORT_EMAIL_FAILED, {
        email: normalizeEmail(email),
        reason: reportRecord.emailError,
        correlationId: storedCorrelationId,
      });
      await incrementOpsCounter("report_email_failed");
      await emitAlert(ALERT_TYPES.SMTP_FAILURE, {
        orderId,
        correlationId: storedCorrelationId,
        reason: reportRecord.emailError,
      });
    }
  }

  return { report: reportRecord, alreadyFulfilled: false };
}

export async function fulfillFromWebhookPayment({
  orderId,
  paymentId,
  paymentEntity,
  correlationId,
}) {
  const existingReport = await loadReportRecord(orderId);
  if (
    existingReport?.paymentStatus === "verified" &&
    existingReport?.reportStatus === REPORT_STATE.READY
  ) {
    return { fulfilled: false, reason: "already_ready" };
  }

  if (isGenerationInProgress(existingReport, false)) {
    return { fulfilled: false, reason: "in_progress" };
  }

  const sessionId =
    existingReport?.sessionId ||
    paymentEntity?.notes?.sessionId ||
    (await findSessionIdByOrderId(orderId));

  if (!sessionId) {
    logEvent("warn", "webhook_fulfillment_no_session", { orderId, correlationId, category: "payment" });
    return { fulfilled: false, reason: "no_session" };
  }

  const session = await loadSessionRecord(sessionId);
  if (!session) {
    logEvent("warn", "webhook_fulfillment_session_missing", { orderId, sessionId, correlationId });
    return { fulfilled: false, reason: "session_not_found" };
  }

  const email =
    existingReport?.buyerEmail ||
    (typeof paymentEntity?.email === "string" ? normalizeEmail(paymentEntity.email) : null);
  const name =
    existingReport?.buyerName ||
    (typeof paymentEntity?.notes?.name === "string" ? paymentEntity.notes.name : "Customer");

  if (!email) {
    logEvent("warn", "webhook_fulfillment_no_email", { orderId, correlationId });
    return { fulfilled: false, reason: "no_email" };
  }

  const salesRequest = await loadSalesRequestBySession(sessionId);
  const isEnterpriseOrder =
    salesRequest?.customOrderId === orderId || session.planTier === "enterprise";

  try {
    const result = await fulfillPaidAssessment({
      session,
      sessionId,
      orderId,
      paymentId,
      name,
      email,
      company: existingReport?.company || "",
      industry: existingReport?.industry || session.industry,
      keySecret: null,
      req: null,
      correlationId,
      paymentProvider: "razorpay",
      isEnterpriseOrder,
      forceRegenerate: existingReport?.reportStatus === REPORT_STATE.FAILED || isGenerationStale(existingReport),
    });
    await logAudit(orderId, AUDIT_EVENTS.PAYMENT_WEBHOOK, {
      correlationId,
      fulfillmentTriggered: true,
      alreadyFulfilled: result.alreadyFulfilled === true,
    });
    return { fulfilled: true, report: result.report, alreadyFulfilled: result.alreadyFulfilled === true };
  } catch (error) {
    logEvent("error", "webhook_fulfillment_failed", {
      orderId,
      correlationId,
      category: "reliability",
      message: error instanceof Error ? error.message : "unknown",
    });
    return { fulfilled: false, reason: "fulfillment_failed" };
  }
}

export async function retryReportGeneration(orderId, correlationId) {
  const report = await loadReportRecord(orderId);
  if (!report) {
    throw new Error("Report not found.");
  }
  const session = await loadSessionRecord(report.sessionId);
  if (!session) {
    throw new Error("Upload session not found.");
  }

  const result = await fulfillPaidAssessment({
    session,
    sessionId: report.sessionId,
    orderId,
    paymentId: report.paymentId,
    name: report.buyerName,
    email: report.buyerEmail,
    company: report.company || "",
    industry: report.industry,
    keySecret: null,
    req: null,
    correlationId,
    paymentProvider: report.paymentProvider || "razorpay",
    isEnterpriseOrder: report.planTier === "enterprise",
    forceRegenerate: true,
  });

  await logAudit(orderId, AUDIT_EVENTS.REPORT_REGENERATED, { correlationId, admin: true });
  return result.report;
}

export function getKeySecretOrThrow() {
  const keySecret = getKeySecret();
  if (!keySecret) {
    throw new Error("Payment verification is not configured.");
  }
  return keySecret;
}
