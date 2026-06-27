// AI Governance Hub API — razorpay-webhook v25.23
import {
  verifyRazorpayWebhookSignature,
  isRazorpayConfigured,
} from "./_lib/razorpay-client.js";
import {
  assertStorageConfigured,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
} from "./_lib/storage.js";
import { enforceRateLimit } from "./_lib/rate-limit.js";
import { reconcileWebhookPayment } from "./_lib/payment-reconcile.js";
import { AUDIT_EVENTS, logAudit } from "./_lib/audit.js";
import { applySecurityHeaders, sendError, sendJson } from "./_lib/security.js";
import { getCorrelationId, attachCorrelation, logEvent } from "./_lib/correlation.js";

/** Vercel must not pre-parse the body — Razorpay signs raw bytes. */
export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  if (typeof req.body === "string") {
    return req.body;
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  if (!isRazorpayConfigured()) {
    return sendError(res, 503, "Webhook service is not configured.");
  }

  try {
    assertStorageConfigured();
  } catch {
    return sendError(res, 503, "Webhook service is temporarily unavailable.");
  }

  const rateLimited = await enforceRateLimit(req, "razorpay-webhook");
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  const signature =
    req.headers["x-razorpay-signature"] ||
    req.headers["X-Razorpay-Signature"] ||
    "";

  let rawBody = "";
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    logEvent("error", "webhook_body_read_failed", {
      correlationId,
      category: "reliability",
      message: error instanceof Error ? error.message : "unknown",
    });
    return sendError(res, 400, "Invalid webhook payload.");
  }

  if (!verifyRazorpayWebhookSignature(rawBody, String(signature))) {
    logEvent("warn", "webhook_signature_invalid", { correlationId, category: "security" });
    return sendError(res, 400, "Invalid webhook signature.");
  }

  let payload = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return sendError(res, 400, "Invalid webhook payload.");
  }

  const eventId = payload.event_id || payload.id || `${payload.event}:${payload.created_at}`;
  const eventType = payload.event;
  const paymentEntity = payload.payload?.payment?.entity || payload.payload?.order?.entity;

  if (!eventType) {
    return sendError(res, 400, "Unsupported webhook event.");
  }

  if (await isWebhookEventProcessed(eventId)) {
    logEvent("info", "webhook_duplicate_ignored", { correlationId, eventId, eventType });
    return sendJson(res, 200, { received: true, duplicate: true });
  }

  try {
    const result = await reconcileWebhookPayment({
      eventId,
      eventType,
      paymentEntity,
      correlationId,
    });

    if (paymentEntity?.order_id) {
      await logAudit(paymentEntity.order_id, AUDIT_EVENTS.PAYMENT_WEBHOOK, {
        eventId,
        eventType,
        correlationId,
        handled: result.handled,
        state: result.state,
      });
    }

    await markWebhookEventProcessed(eventId, {
      eventType,
      correlationId,
      handled: result.handled,
    });

    let fulfillmentResult = null;
    if (result.needsFulfillment && paymentEntity?.order_id && paymentEntity?.id) {
      const { fulfillFromWebhookPayment } = await import("./_lib/payment-fulfillment.js");
      fulfillmentResult = await fulfillFromWebhookPayment({
        orderId: paymentEntity.order_id,
        paymentId: paymentEntity.id,
        paymentEntity,
        correlationId,
      });
    }

    logEvent("info", "webhook_processed", {
      correlationId,
      eventId,
      eventType,
      category: "payment",
      handled: result.handled,
      fulfillmentTriggered: fulfillmentResult?.fulfilled === true,
    });

    return sendJson(res, 200, { received: true, ...result, fulfillment: fulfillmentResult });
  } catch (error) {
    logEvent("error", "webhook_processing_failed", {
      correlationId,
      eventId,
      eventType,
      category: "reliability",
      message: error instanceof Error ? error.message : "unknown",
    });
    return sendError(res, 500, "Webhook processing failed.");
  }
}
