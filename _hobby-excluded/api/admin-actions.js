// AI Governance Hub API — admin actions v25.3 (Razorpay launch + enterprise ops)
import {
  loadReportRecord,
  saveReportRecord,
  loadSessionRecord,
  saveSessionRecord,
  maskOrderId,
  maskPaymentId,
  isStorageConfigured,
  getStorageBackendName,
  loadAuditEvents,
} from "./lib/storage.js";
import { sendReportResendEmail, isEmailConfigured } from "./lib/email.js";
import { isAdminAuthorized } from "./lib/correlation.js";
import { enforceRateLimit } from "./lib/rate-limit.js";
import { logAudit, AUDIT_EVENTS } from "./lib/audit.js";
import { applySecurityHeaders, sendError, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation, logEvent, getRequestId, attachRequestHeaders, createRequestLogger } from "./lib/correlation.js";
import { trimEnv, getKeySecret } from "./lib/tokens.js";
import {
  loadSalesRequest,
  attachEnterprisePaymentLink,
  setEnterpriseQuote,
  addEnterpriseNote,
  markEnterpriseReportDelivered,
  closeEnterpriseRequest,
  listEnterpriseRequests,
} from "./lib/enterprise-gate.js";
import { createRazorpayOrder, isRazorpayConfigured } from "./lib/razorpay-client.js";
import { formatMoney } from "./lib/pricing.js";
import { retryReportGeneration } from "./lib/payment-fulfillment.js";
import { updatePaymentState } from "./lib/payment-reconcile.js";
import { PAYMENT_STATE, REPORT_STATE } from "./lib/payment-state.js";
import { retentionSummary, getPendingCheckoutExpiresAt } from "./lib/retention.js";
import { getAdminReadiness } from "./lib/ops-readiness.js";
import { incrementOpsCounter } from "./lib/ops-metrics.js";
import { emitAlert, ALERT_TYPES } from "./lib/alerting.js";
import { getClientIp } from "./lib/rate-limit.js";

function getSiteUrl() {
  return (
    (typeof process.env.SITE_URL === "string" && process.env.SITE_URL.trim()) ||
    "https://aigovernancehub.ai"
  ).replace(/\/$/, "");
}

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  const requestId = getRequestId(req);
  attachRequestHeaders(res, { correlationId, requestId });
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  if (!isAdminAuthorized(req)) {
    await incrementOpsCounter("admin_auth_failed");
    await emitAlert(ALERT_TYPES.ADMIN_AUTH_FAILED, {
      correlationId,
      requestId,
      ipHash: getClientIp(req),
    });
    return sendError(res, 403, "Admin access denied.");
  }

  const rateLimited = await enforceRateLimit(req, "admin-actions");
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  const body = req.body || {};
  const action = typeof body.action === "string" ? body.action : "";
  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";

  async function auditAdmin(adminAction, meta = {}) {
    const auditKey = meta.orderId || meta.requestId || `admin:${adminAction}`;
    await logAudit(auditKey, AUDIT_EVENTS.ADMIN_ACTION, {
      action: adminAction,
      correlationId,
      requestId,
      admin: true,
      ...meta,
    });
  }

  if (action === "operations_dashboard") {
    const readiness = await getAdminReadiness();
    return sendJson(res, 200, {
      success: true,
      correlationId,
      requestId,
      version: "25.22",
      dashboard: readiness,
    });
  }

  if (action === "diagnostics") {
    const readiness = await getAdminReadiness();
    return sendJson(res, 200, {
      success: true,
      correlationId,
      requestId,
      version: "25.22",
      ...readiness,
    });
  }

  if (action === "get_audit_trail") {
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) return sendError(res, 400, "Order ID is required.");
    const events = await loadAuditEvents(orderId);
    return sendJson(res, 200, { success: true, orderId, events });
  }

  if (action === "list_enterprise_requests") {
    const status = typeof body.status === "string" ? body.status.trim() : null;
    const requests = await listEnterpriseRequests(status || null);
    return sendJson(res, 200, { success: true, requests, count: requests.length });
  }

  if (action === "enterprise_set_quote") {
    if (!requestId) return sendError(res, 400, "Request ID is required.");
    const record = await loadSalesRequest(requestId);
    if (!record) return sendError(res, 404, "Enterprise request not found.");
    const amountMinor = Number(body.amountMinor);
    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "INR";
    const discountMinor = Number(body.discountMinor || 0);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      return sendError(res, 400, "Valid quote amount is required.");
    }
    await setEnterpriseQuote(record, { amountMinor, currency, discountMinor }, "admin");
    await auditAdmin("enterprise_set_quote", { requestId, amountMinor, currency });
    logEvent("info", "admin_enterprise_quote", { correlationId, requestId, amountMinor, currency });
    return sendJson(res, 200, { success: true, request: record });
  }

  if (action === "enterprise_add_note") {
    if (!requestId) return sendError(res, 400, "Request ID is required.");
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (!note) return sendError(res, 400, "Note text is required.");
    const record = await loadSalesRequest(requestId);
    if (!record) return sendError(res, 404, "Enterprise request not found.");
    await addEnterpriseNote(record, note, "admin");
    await auditAdmin("enterprise_add_note", { requestId });
    return sendJson(res, 200, { success: true, request: record });
  }

  if (action === "enterprise_mark_delivered") {
    if (!requestId) return sendError(res, 400, "Request ID is required.");
    const record = await loadSalesRequest(requestId);
    if (!record) return sendError(res, 404, "Enterprise request not found.");
    await markEnterpriseReportDelivered(record, body.orderId || record.customOrderId, "admin");
    await auditAdmin("enterprise_mark_delivered", { requestId, orderId: body.orderId || record.customOrderId });
    return sendJson(res, 200, { success: true, request: record });
  }

  if (action === "enterprise_close") {
    if (!requestId) return sendError(res, 400, "Request ID is required.");
    const record = await loadSalesRequest(requestId);
    if (!record) return sendError(res, 404, "Enterprise request not found.");
    await closeEnterpriseRequest(record, "admin");
    await auditAdmin("enterprise_close", { requestId });
    return sendJson(res, 200, { success: true, request: record });
  }

  if (action === "create_enterprise_payment") {
    if (!requestId) return sendError(res, 400, "Request ID is required.");
    const amountMinor = Number(body.amountMinor);
    const currency =
      typeof body.currency === "string" ? body.currency.toUpperCase() : "INR";

    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      return sendError(res, 400, "Request ID and valid amount are required.");
    }

    if (!isRazorpayConfigured()) {
      return sendError(res, 503, "Payment service is not configured.");
    }

    const keySecret = getKeySecret();
    const salesRequest = await loadSalesRequest(requestId);
    if (!salesRequest) {
      return sendError(res, 404, "Enterprise sales request not found.");
    }

    const session = await loadSessionRecord(salesRequest.sessionId);
    if (!session) {
      return sendError(res, 404, "Upload session not found.");
    }

    await setEnterpriseQuote(
      salesRequest,
      {
        amountMinor,
        currency,
        discountMinor: Number(body.discountMinor || salesRequest.discountMinor || 0),
      },
      "admin"
    );

    const receipt = `ent_${requestId.slice(0, 8)}_${Date.now()}`;
    let order;
    try {
      order = await createRazorpayOrder({
        amountMinor: Math.round(amountMinor),
        currency,
        receipt,
        notes: {
          product: "AI Governance Enterprise Assessment",
          sessionId: session.sessionId,
          requestId,
          secureReference: salesRequest.secureReference,
        },
      });
    } catch {
      return sendError(res, 502, "Unable to create enterprise payment order.");
    }

    const siteUrl = getSiteUrl();
    const linkResult = await attachEnterprisePaymentLink(
      salesRequest,
      session,
      order,
      keySecret,
      siteUrl
    );

    await saveSessionRecord({
      ...session,
      pendingCheckout: {
        orderId: order.id,
        amountMinor: order.amount,
        currency: order.currency,
        planId: "enterprise",
        quote: {
          totalDisplay: formatMoney(order.amount, order.currency),
          plan: { id: "enterprise", label: "Enterprise Assessment", selfServe: false },
        },
        enterprisePayment: true,
        paymentProvider: "razorpay",
        paymentState: PAYMENT_STATE.PENDING,
        createdAt: new Date().toISOString(),
        expiresAt: getPendingCheckoutExpiresAt(),
      },
    });

    await logAudit(order.id, AUDIT_EVENTS.PAYMENT_STARTED, {
      admin: true,
      requestId,
      secureReference: salesRequest.secureReference,
      correlationId,
    });
    await auditAdmin("create_enterprise_payment", { requestId, orderId: order.id });

    return sendJson(res, 200, {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      amountDisplay: formatMoney(order.amount, order.currency),
      checkoutUrl: linkResult.checkoutUrl,
      secureReference: salesRequest.secureReference,
    });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) {
    return sendError(res, 400, "Order ID or supported enterprise action is required.");
  }

  const report = await loadReportRecord(orderId);
  if (!report) {
    return sendError(res, 404, "Report not found.");
  }

  if (action === "retry_generation") {
    try {
      const regenerated = await retryReportGeneration(orderId, correlationId);
      await logAudit(orderId, AUDIT_EVENTS.ADMIN_ACTION, { action, correlationId, admin: true });
      await auditAdmin("retry_generation", { orderId });
      return sendJson(res, 200, {
        success: true,
        orderId,
        reportStatus: regenerated.reportStatus,
        paymentStatus: regenerated.paymentStatus,
      });
    } catch (error) {
      return sendError(
        res,
        502,
        error instanceof Error ? error.message : "Report regeneration failed."
      );
    }
  }

  if (action === "mark_refunded") {
    const updated = await updatePaymentState(orderId, PAYMENT_STATE.REFUNDED, {
      admin: true,
      correlationId,
    });
    await logAudit(orderId, AUDIT_EVENTS.REFUND_STATUS_UPDATED, { action, correlationId, admin: true });
    return sendJson(res, 200, { success: true, paymentState: updated?.paymentState });
  }

  if (action === "resend_email") {
    const siteUrl = getSiteUrl();
    const result = await sendReportResendEmail({
      buyerName: report.buyerName,
      buyerEmail: report.buyerEmail,
      company: report.company,
      orderRef: maskOrderId(orderId),
      paymentRef: maskPaymentId(report.paymentId),
      paidAt: report.createdAt,
      downloadUrl: `${siteUrl}/dashboard.html`,
      recoverUrl: `${siteUrl}/recover-report.html`,
    });
    report.emailSent = result.sent === true;
    report.emailError = result.sent ? null : result.reason;
    await saveReportRecord(report);
    await auditAdmin("resend_email", { orderId, emailSent: result.sent });
    await logAudit(orderId, AUDIT_EVENTS.REPORT_EMAILED, { admin: true, correlationId });
    return sendJson(res, 200, { success: true, emailSent: result.sent });
  }

  if (action === "disable_download") {
    report.downloadDisabled = true;
    await saveReportRecord(report);
    await auditAdmin("disable_download", { orderId });
    logEvent("warn", "admin_disable_download", { correlationId, orderId });
    return sendJson(res, 200, { success: true, downloadDisabled: true });
  }

  if (action === "enable_download") {
    report.downloadDisabled = false;
    await saveReportRecord(report);
    await auditAdmin("enable_download", { orderId });
    return sendJson(res, 200, { success: true, downloadDisabled: false });
  }

  if (action === "delete_expired") {
    report.paymentStatus = "deleted";
    report.downloadDisabled = true;
    await saveReportRecord(report);
    await auditAdmin("delete_expired", { orderId });
    logEvent("warn", "admin_delete_report", { correlationId, orderId });
    return sendJson(res, 200, { success: true, status: "deleted" });
  }

  return sendError(res, 400, "Unsupported admin action.");
}
