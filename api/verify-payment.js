// AI Governance Hub API — verify-payment v25.23
import {
  getKeySecret,
  isNonEmptyString,
  validateSuccessToken,
  validateSessionToken,
  validateEnterprisePayToken,
} from "./_lib/tokens.js";
import { getPlanById } from "./_lib/assessment-config.js";
import { assertSelfServeAllowed, loadSalesRequestBySession } from "./_lib/enterprise-gate.js";
import {
  assertStorageConfigured,
  loadReportRecord,
  loadSessionRecord,
} from "./_lib/storage.js";
import { enforceRateLimit } from "./_lib/rate-limit.js";
import { isEmailConfigured } from "./_lib/email.js";
import { verifyRazorpayPaymentSignature } from "./_lib/razorpay-client.js";
import { assertPaymentAmountMatches } from "./_lib/payment-reconcile.js";
import { isPendingCheckoutExpired, REPORT_STATE, isGenerationInProgress, isGenerationStale, buildCustomerStatusView } from "./_lib/payment-state.js";
import { applySecurityHeaders, sendError, sendJson } from "./_lib/security.js";
import { getCorrelationId, getRequestId, attachRequestHeaders, createRequestLogger, hashCustomerIdentifier, logEvent } from "./_lib/correlation.js";
import { emitAlert, ALERT_TYPES } from "./_lib/alerting.js";
import { incrementOpsCounter, recordOpsTiming } from "./_lib/ops-metrics.js";
import { AUDIT_EVENTS, logAudit } from "./_lib/audit.js";

export default async function handler(req, res) {
  const startedAt = Date.now();
  const correlationId = getCorrelationId(req);
  const requestId = getRequestId(req);
  attachRequestHeaders(res, { correlationId, requestId });
  applySecurityHeaders(res);

  const bodyEarly = req.body || {};
  const logger = createRequestLogger({
    correlationId,
    requestId,
    route: "/api/verify-payment",
    assessmentId: typeof bodyEarly.sessionId === "string" ? bodyEarly.sessionId.trim() : null,
    customerHash: hashCustomerIdentifier(bodyEarly.email),
  });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  try {
    assertStorageConfigured();
  } catch {
    return sendError(res, 503, "Payment verification is temporarily unavailable.");
  }

  const { buildVerifiedResponse, fulfillPaidAssessment } = await import(
    "./_lib/payment-fulfillment.js"
  );

  const keySecret = getKeySecret();
  if (!keySecret) {
    return sendError(res, 503, "Payment verification is not configured.");
  }

  const body = req.body || {};
  const token =
    typeof body.confirmationToken === "string"
      ? body.confirmationToken
      : typeof body.successToken === "string"
        ? body.successToken
        : "";

  if (isNonEmptyString(token)) {
    const tokenData = validateSuccessToken(token, keySecret);
    if (!tokenData) {
      return sendJson(res, 400, {
        valid: false,
        error: "Confirmation token is invalid or expired.",
      });
    }

    const report = await loadReportRecord(tokenData.orderId);
    if (
      !report ||
      report.paymentId !== tokenData.paymentId ||
      report.paymentStatus !== "verified"
    ) {
      return sendJson(res, 400, {
        valid: false,
        error: "Confirmation token is invalid or expired.",
      });
    }

    return sendJson(res, 200, {
      valid: true,
      orderId: tokenData.orderId,
      paymentId: tokenData.paymentId,
      ...buildCustomerStatusView(report),
      emailConfigured: isEmailConfigured(),
    });
  }

  const rateLimited = await enforceRateLimit(req, "verify-payment", body.email);
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  const name = body.name;
  const email = body.email;
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken : "";
  const enterprisePayToken =
    typeof body.enterprisePayToken === "string" ? body.enterprisePayToken : "";

  if (!isNonEmptyString(orderId) || !isNonEmptyString(paymentId) || !isNonEmptyString(signature)) {
    logEvent("warn", "payment_verify_rejected", { correlationId, requestId, reason: "missing_razorpay_fields", category: "payment" });
    return sendError(res, 400, "Invalid payment verification request.");
  }

  if (!isNonEmptyString(name) || !isNonEmptyString(email)) {
    logEvent("warn", "payment_verify_rejected", { correlationId, requestId, reason: "missing_contact", category: "payment" });
    return sendError(res, 400, "Missing required contact details.");
  }

  if (!sessionId) {
    logEvent("warn", "payment_verify_rejected", { correlationId, requestId, reason: "missing_session", category: "payment" });
    return sendError(res, 400, "Upload session is required for report delivery.");
  }

  if (!verifyRazorpayPaymentSignature(orderId, paymentId, signature, keySecret)) {
    await incrementOpsCounter("payment_verify_failed");
    await emitAlert(ALERT_TYPES.PAYMENT_VERIFY_FAILED, { correlationId, requestId, orderId });
    logger.finish("error", { statusCode: 400, category: "payment" });
    return sendError(res, 400, "Payment verification failed.");
  }

  const session = await loadSessionRecord(sessionId);
  if (!session) {
    logEvent("warn", "payment_verify_rejected", { correlationId, requestId, reason: "session_not_found", sessionId, category: "payment" });
    return sendError(res, 400, "Upload session not found. Upload your file again.");
  }

  const enterpriseTokenData = validateEnterprisePayToken(enterprisePayToken, keySecret);
  const isEnterprisePayFlow =
    enterpriseTokenData &&
    enterpriseTokenData.sessionId === sessionId &&
    enterpriseTokenData.orderId === orderId;

  const sessionTokenData = validateSessionToken(sessionToken, keySecret);
  if (!isEnterprisePayFlow) {
    if (!sessionToken || !sessionTokenData || sessionTokenData.sessionId !== sessionId) {
      logEvent("warn", "payment_verify_rejected", { correlationId, requestId, reason: "session_token_invalid", sessionId, category: "payment" });
      return sendError(res, 400, "Upload session is invalid or expired.");
    }
    if (session.contentHash !== sessionTokenData.contentHash) {
      logEvent("warn", "payment_verify_rejected", { correlationId, requestId, reason: "content_hash_mismatch", sessionId, category: "payment" });
      return sendError(res, 400, "Upload session not found. Upload your file again.");
    }
  }

  const salesRequest = await loadSalesRequestBySession(sessionId);
  const isEnterpriseOrder = salesRequest?.customOrderId === orderId || isEnterprisePayFlow;
  const gateCheck = assertSelfServeAllowed(session);
  if (!gateCheck.allowed && !isEnterpriseOrder) {
    return sendError(res, 403, gateCheck.reason);
  }

  if (!isEnterpriseOrder) {
    if (!session.pendingCheckout || session.pendingCheckout.orderId !== orderId) {
      logEvent("warn", "payment_verify_rejected", {
        correlationId,
        requestId,
        reason: "pending_checkout_mismatch",
        sessionId,
        orderId,
        pendingOrderId: session.pendingCheckout?.orderId || null,
        category: "payment",
      });
      return sendError(res, 400, "Payment verification failed.");
    }
    if (isPendingCheckoutExpired(session.pendingCheckout)) {
      logEvent("warn", "pending_checkout_expired", { correlationId, orderId, sessionId, category: "payment" });
      return sendError(res, 400, "Checkout session expired. Please start checkout again.");
    }
  }

  const existingReport = await loadReportRecord(orderId);
  if (existingReport?.paymentStatus === "verified") {
    if (existingReport.paymentId !== paymentId) {
      await incrementOpsCounter("payment_duplicate_rejected");
      await logAudit(orderId, AUDIT_EVENTS.PAYMENT_VERIFY_FAILED, {
        reason: "duplicate_payment_id",
        correlationId,
        requestId,
      });
      logger.finish("error", { statusCode: 409, category: "payment" });
      return sendError(res, 409, "This order has already been paid with a different payment reference.");
    }
    if (existingReport.sessionId && existingReport.sessionId !== sessionId) {
      return sendError(res, 400, "Payment verification failed.");
    }
    if (existingReport.reportStatus === REPORT_STATE.READY) {
      return sendJson(res, 200, {
        ...(await buildVerifiedResponse(existingReport)),
        emailStatus: existingReport.emailSent ? "sent" : existingReport.emailError ? "failed" : "pending",
        correlationId: existingReport.correlationId || correlationId,
        requestId,
      });
    }
    if (isGenerationInProgress(existingReport, false)) {
      return sendJson(res, 200, {
        ...(await buildVerifiedResponse(existingReport)),
        emailStatus: existingReport.emailSent ? "sent" : existingReport.emailError ? "failed" : "pending",
        correlationId: existingReport.correlationId || correlationId,
        requestId,
      });
    }
    try {
      const retry = await fulfillPaidAssessment({
        session,
        sessionId,
        orderId,
        paymentId,
        name,
        email,
        company,
        industry: session.industry || body.industry,
        keySecret,
        req,
        correlationId,
        paymentProvider: "razorpay",
        isEnterpriseOrder,
        forceRegenerate:
          existingReport.reportStatus === REPORT_STATE.FAILED || isGenerationStale(existingReport),
      });
      return sendJson(res, 200, {
        ...(await buildVerifiedResponse(retry.report)),
        emailStatus: retry.report.emailSent ? "sent" : retry.report.emailError ? "failed" : "pending",
        correlationId,
        requestId,
      });
    } catch {
      return sendJson(res, 200, {
        ...(await buildVerifiedResponse(existingReport)),
        emailStatus: existingReport.emailSent ? "sent" : existingReport.emailError ? "failed" : "pending",
        correlationId,
        requestId,
      });
    }
  }

  if (!isEnterpriseOrder) {
    const checkout = session.pendingCheckout;
    try {
      const amountCheck = await assertPaymentAmountMatches(
        paymentId,
        checkout.amountMinor,
        checkout.currency
      );
      if (!amountCheck.ok) {
        // API responded but amount/status doesn't match — genuine fraud signal, reject
        logEvent("warn", "payment_verify_rejected", {
          correlationId,
          requestId,
          reason: amountCheck.reason || "amount_mismatch",
          sessionId,
          orderId,
          category: "payment",
        });
        return sendError(res, 400, "Payment verification failed.");
      }
    } catch (error) {
      // Razorpay API unreachable or timed out. HMAC verified above proves payment is real.
      // Return verification_pending so the frontend redirects to the pending page.
      // The Razorpay webhook (payment.captured) confirms and triggers fulfillment.
      logEvent("warn", "razorpay_amount_check_pending", {
        correlationId,
        requestId,
        orderId,
        category: "reliability",
        message: error instanceof Error ? error.message : "unknown",
        reason: "api_unavailable_returning_verification_pending",
      });
      return sendJson(res, 202, {
        verification_pending: true,
        orderId,
        message:
          "Payment received. We are verifying it with Razorpay — this usually completes in under a minute. Check your inbox for your report, or use Recover My Report with your checkout email.",
      });
    }
  } else if (salesRequest?.quoteAmountMinor && salesRequest?.quoteCurrency) {
    try {
      const amountCheck = await assertPaymentAmountMatches(
        paymentId,
        salesRequest.quoteAmountMinor,
        salesRequest.quoteCurrency
      );
      if (!amountCheck.ok) {
        return sendError(res, 400, "Payment verification failed.");
      }
    } catch (error) {
      logEvent("warn", "razorpay_amount_check_pending", {
        correlationId,
        orderId,
        category: "reliability",
        message: error instanceof Error ? error.message : "unknown",
        reason: "enterprise_api_unavailable_returning_pending",
      });
      return sendJson(res, 202, {
        verification_pending: true,
        orderId,
        message:
          "Payment received. We are verifying it with Razorpay — this usually completes in under a minute.",
      });
    }
  }

  const planTier = session.planTier || session.pendingCheckout?.planId || "starter";
  const plan = getPlanById(planTier);

  let report;
  try {
    const result = await fulfillPaidAssessment({
      session,
      sessionId,
      orderId,
      paymentId,
      name,
      email,
      company,
      industry: session.industry || body.industry,
      keySecret,
      req,
      correlationId,
      paymentProvider: "razorpay",
      isEnterpriseOrder,
    });
    report = result.report;
  } catch {
    report = await loadReportRecord(orderId);
    if (report?.paymentStatus === "verified") {
      await recordOpsTiming("payment_verify_ms", Date.now() - startedAt);
      logger.finish("success", { statusCode: 200, assessmentId: sessionId, category: "report_generation" });
      return sendJson(res, 200, {
        ...(await buildVerifiedResponse(report)),
        emailStatus: report.emailSent ? "sent" : report.emailError ? "failed" : "pending",
        planLabel: plan.label,
        correlationId,
        requestId,
      });
    }
    await recordOpsTiming("payment_verify_ms", Date.now() - startedAt);
    logger.finish("error", { statusCode: 502, category: "report_generation" });
    return sendError(res, 502, "Payment verification is temporarily unavailable.");
  }

  await incrementOpsCounter("payment_verified");
  await recordOpsTiming("payment_verify_ms", Date.now() - startedAt);
  logger.finish("success", { statusCode: 200, assessmentId: sessionId });

  return sendJson(res, 200, {
    ...(await buildVerifiedResponse(report)),
    emailStatus: report.emailSent ? "sent" : "failed",
    planLabel: plan.label,
    correlationId,
    requestId,
  });
}
