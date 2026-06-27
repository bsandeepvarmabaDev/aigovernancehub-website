/**
 * Payment reconciliation — shared verify + webhook paths (v25.8).
 */
import { fetchRazorpayPayment } from "./razorpay-client.js";
import { PAYMENT_STATE, REPORT_STATE, canTransitionPayment } from "./payment-state.js";
import {
  loadReportRecord,
  saveReportRecord,
  loadSessionRecord,
  saveSessionRecord,
  findOrderIdByPaymentId,
} from "./storage.js";
import { logAudit, AUDIT_EVENTS } from "./audit.js";
import { logEvent } from "./correlation.js";

export async function assertPaymentAmountMatches(paymentId, expectedAmountMinor, expectedCurrency) {
  const payment = await fetchRazorpayPayment(paymentId);
  if (payment.status !== "captured" && payment.status !== "authorized") {
    return { ok: false, payment, reason: "invalid_status" };
  }
  if (typeof payment.amount !== "number" || payment.amount !== expectedAmountMinor) {
    return { ok: false, payment, reason: "amount_mismatch" };
  }
  if (
    typeof payment.currency !== "string" ||
    payment.currency.toUpperCase() !== expectedCurrency.toUpperCase()
  ) {
    return { ok: false, payment, reason: "currency_mismatch" };
  }
  return { ok: true, payment };
}

export async function updatePaymentState(orderId, nextState, details = {}) {
  const report = await loadReportRecord(orderId);
  const current = report?.paymentState || PAYMENT_STATE.PENDING;
  if (!canTransitionPayment(current, nextState)) {
    logEvent("warn", "payment_state_transition_rejected", {
      orderId,
      from: current,
      to: nextState,
      category: "payment",
    });
    return report;
  }

  const patch = {
    ...(report || { orderId }),
    paymentState: nextState,
    paymentStateUpdatedAt: new Date().toISOString(),
    ...details,
  };

  if (nextState === PAYMENT_STATE.PAID) {
    patch.paymentStatus = patch.paymentStatus || "verified";
  }
  if (nextState === PAYMENT_STATE.FAILED) {
    patch.paymentStatus = "failed";
  }
  if (nextState === PAYMENT_STATE.REFUNDED) {
    patch.paymentStatus = "refunded";
    patch.downloadDisabled = true;
  }
  if (nextState === PAYMENT_STATE.EXPIRED) {
    patch.paymentStatus = "expired";
    patch.downloadDisabled = true;
  }

  await saveReportRecord(patch);
  await logAudit(orderId, AUDIT_EVENTS.PAYMENT_STATE_CHANGED, {
    from: current,
    to: nextState,
    ...details,
  });
  return patch;
}

export async function markPendingCheckoutExpired(sessionId) {
  const session = await loadSessionRecord(sessionId);
  if (!session?.pendingCheckout) return null;
  session.pendingCheckout = {
    ...session.pendingCheckout,
    expired: true,
    expiredAt: new Date().toISOString(),
  };
  await saveSessionRecord(session);
  const orderId = session.pendingCheckout.orderId;
  if (orderId) {
    await updatePaymentState(orderId, PAYMENT_STATE.EXPIRED, { source: "checkout_ttl" });
  }
  return session;
}

export async function reconcileWebhookPayment({
  eventId,
  eventType,
  paymentEntity,
  correlationId,
}) {
  const paymentId = paymentEntity?.id;
  const orderId = paymentEntity?.order_id;
  if (!paymentId || !orderId) {
    return { handled: false, reason: "missing_ids" };
  }

  let report = await loadReportRecord(orderId);
  if (!report) {
    const mappedOrder = await findOrderIdByPaymentId(paymentId);
    if (mappedOrder) {
      report = await loadReportRecord(mappedOrder);
    }
  }

  if (eventType === "payment.failed") {
    await updatePaymentState(orderId, PAYMENT_STATE.FAILED, {
      paymentId,
      webhookEventId: eventId,
      correlationId,
    });
    return { handled: true, state: PAYMENT_STATE.FAILED };
  }

  if (eventType === "refund.processed" || eventType === "payment.refunded") {
    await updatePaymentState(orderId, PAYMENT_STATE.REFUNDED, {
      paymentId,
      webhookEventId: eventId,
      correlationId,
    });
    return { handled: true, state: PAYMENT_STATE.REFUNDED };
  }

  if (eventType === "payment.captured" || eventType === "order.paid") {
    const existing = report?.paymentStatus === "verified" && report?.reportStatus === REPORT_STATE.READY;
    if (existing) {
      return { handled: true, state: PAYMENT_STATE.PAID, duplicate: true };
    }

    await updatePaymentState(orderId, PAYMENT_STATE.PAID, {
      paymentId,
      webhookEventId: eventId,
      correlationId,
      reportStatus: report?.reportStatus || REPORT_STATE.GENERATING,
    });

    return {
      handled: true,
      state: PAYMENT_STATE.PAID,
      needsFulfillment: report?.reportStatus !== REPORT_STATE.READY,
    };
  }

  return { handled: false, reason: "unsupported_event" };
}
