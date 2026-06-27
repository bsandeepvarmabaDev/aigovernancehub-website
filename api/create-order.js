// AI Governance Hub API — create-order v25.3 (Razorpay launch P0)
import { getKeySecret, validateSessionToken } from "./_lib/tokens.js";
import { assertStorageConfigured, loadSessionRecord, saveSessionRecord, indexOrderSession } from "./_lib/storage.js";
import { enforceRateLimit } from "./_lib/rate-limit.js";
import { AUDIT_EVENTS, logAudit } from "./_lib/audit.js";
import { buildOrderQuote, detectCurrency } from "./_lib/pricing.js";
import { assertSelfServeAllowed } from "./_lib/enterprise-gate.js";
import { rejectClientPricingTamper } from "./_lib/enterprise-gate-rules.js";
import { isRazorpayActive } from "./_lib/payment-provider.js";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from "./_lib/razorpay-client.js";
import { applySecurityHeaders, sendError, sendJson } from "./_lib/security.js";
import { incrementOpsCounter } from "./_lib/ops-metrics.js";
import { getCorrelationId, attachCorrelation } from "./_lib/correlation.js";
import { trackEvent } from "./_lib/analytics.js";
import { getPendingCheckoutExpiresAt } from "./_lib/retention.js";
import { PAYMENT_STATE } from "./_lib/payment-state.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  if (!isRazorpayActive()) {
    return sendError(res, 503, "Payment service is not configured for launch.");
  }

  try {
    assertStorageConfigured();
  } catch {
    return sendError(res, 503, "Payment service is temporarily unavailable.");
  }

  const rateLimited = await enforceRateLimit(req, "create-order");
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  if (!isRazorpayConfigured()) {
    return sendError(res, 503, "Payment service is not configured.");
  }

  const keyId = getRazorpayKeyId();
  const body = req.body || {};
  const tamperKey = rejectClientPricingTamper(body);
  if (tamperKey) {
    return sendError(res, 400, "Invalid checkout request.");
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken : "";
  const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : detectCurrency(req);
  const confirmed = body.orderConfirmed === true;

  if (!sessionId || !sessionToken) {
    return sendError(res, 400, "Upload and preview are required before checkout.");
  }

  if (!confirmed) {
    return sendError(res, 400, "Please review and confirm your order summary before payment.");
  }

  const tokenData = validateSessionToken(sessionToken, getKeySecret());
  if (!tokenData || tokenData.sessionId !== sessionId) {
    return sendError(res, 400, "Upload session is invalid or expired. Upload your file again.");
  }

  const session = await loadSessionRecord(sessionId);
  if (!session || session.contentHash !== tokenData.contentHash) {
    return sendError(res, 400, "Upload session not found. Upload your file again.");
  }

  const gateCheck = assertSelfServeAllowed(session);
  if (!gateCheck.allowed) {
    return sendError(res, 403, gateCheck.reason);
  }

  const planId = session.planTier || session.validation?.plan?.tier || "starter";
  const quote = buildOrderQuote(planId, currency);

  if (!quote.checkoutAvailable) {
    return sendError(
      res,
      403,
      quote.message ||
        "Enterprise assessment detected. Contact sales@aigovernancehub.ai for a guided assessment."
    );
  }

  const receipt = `agh_${planId}_${Date.now()}`;

  try {
    const order = await createRazorpayOrder({
      amountMinor: quote.razorpayAmount,
      currency: quote.razorpayCurrency,
      receipt,
      notes: {
        product: `AI Governance Assessment — ${quote.plan.label}`,
        sessionId,
        planId,
      },
    });

    const checkoutCreatedAt = new Date().toISOString();
    await saveSessionRecord({
      ...session,
      pendingCheckout: {
        orderId: order.id,
        amountMinor: order.amount,
        currency: order.currency,
        planId,
        quote,
        paymentProvider: "razorpay",
        paymentState: PAYMENT_STATE.PENDING,
        createdAt: checkoutCreatedAt,
        expiresAt: getPendingCheckoutExpiresAt(new Date(checkoutCreatedAt)),
      },
    });

    await indexOrderSession(order.id, sessionId);

    await logAudit(order.id, AUDIT_EVENTS.PAYMENT_STARTED, {
      sessionId,
      planId,
      amount: order.amount,
      currency: order.currency,
      paymentProvider: "razorpay",
    });
    await incrementOpsCounter("payment_started");

    await trackEvent("checkout_started", req, {
      correlationId,
      orderId: order.id,
      sessionId,
      planId,
      paymentProvider: "razorpay",
    });

    return sendJson(res, 200, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      checkoutBrand: quote.checkoutBrand,
      orderSummary: quote,
    });
  } catch (error) {
    console.error("Razorpay create-order request error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return sendError(res, 502, "Unable to create payment order.");
  }
}
