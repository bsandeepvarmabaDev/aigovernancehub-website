/**
 * Canonical payment lifecycle states — v25.24 (P0 certification)
 */

export const PAYMENT_STATE = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  EXPIRED: "expired",
};

export const REPORT_STATE = {
  GENERATING: "generating",
  READY: "ready",
  FAILED: "failed",
};

/** In-flight generation older than this may be retried (crash recovery). */
export const GENERATION_STALE_MS = 15 * 60 * 1000;

/** Map legacy paymentStatus to canonical state. */
export function resolvePaymentState(record) {
  if (!record) return PAYMENT_STATE.PENDING;
  if (record.paymentState) return record.paymentState;
  if (record.paymentStatus === "verified") return PAYMENT_STATE.PAID;
  if (record.paymentStatus === "deleted") return PAYMENT_STATE.CANCELLED;
  return record.paymentStatus || PAYMENT_STATE.PENDING;
}

export function resolveReportStatus(record) {
  if (!record) return null;
  if (record.reportStatus) return record.reportStatus;
  if (record.paymentStatus === "verified") return REPORT_STATE.GENERATING;
  return "pending";
}

export function isDownloadReady(record) {
  if (!record) return false;
  if (record.downloadDisabled) return false;
  const state = resolvePaymentState(record);
  if (state === PAYMENT_STATE.REFUNDED || state === PAYMENT_STATE.CANCELLED) return false;
  if (state === PAYMENT_STATE.EXPIRED) return false;
  if (record.reportStatus === REPORT_STATE.FAILED) return false;
  return record.reportStatus === REPORT_STATE.READY;
}

export function isGenerationStale(record) {
  if (!record || record.reportStatus !== REPORT_STATE.GENERATING) return false;
  const anchor = record.updatedAt || record.createdAt;
  if (!anchor) return true;
  const age = Date.now() - Date.parse(anchor);
  return Number.isFinite(age) && age >= GENERATION_STALE_MS;
}

/** True when generation is actively in progress and must not be re-entered. */
export function isGenerationInProgress(record, forceRegenerate = false) {
  if (forceRegenerate) return false;
  if (!record || record.reportStatus !== REPORT_STATE.GENERATING) return false;
  return !isGenerationStale(record);
}

export function isPendingCheckoutExpired(pendingCheckout) {
  if (!pendingCheckout) return true;
  if (pendingCheckout.expired) return true;
  const expiresAt = pendingCheckout.expiresAt ? Date.parse(pendingCheckout.expiresAt) : null;
  if (expiresAt && Date.now() > expiresAt) return true;
  return false;
}

export function terminalPaymentStates() {
  return [
    PAYMENT_STATE.PAID,
    PAYMENT_STATE.FAILED,
    PAYMENT_STATE.CANCELLED,
    PAYMENT_STATE.REFUNDED,
    PAYMENT_STATE.EXPIRED,
  ];
}

export function canTransitionPayment(from, to) {
  if (from === to) return true;
  const terminal = new Set([
    PAYMENT_STATE.REFUNDED,
    PAYMENT_STATE.CANCELLED,
    PAYMENT_STATE.EXPIRED,
  ]);
  if (terminal.has(from)) return false;
  if (to === PAYMENT_STATE.PENDING) return false;
  return true;
}

/** Customer-facing payment journey state (trust UX). */
export const CUSTOMER_PAYMENT_STATE = {
  FAILED: "failed",
  PROCESSING: "processing",
  SUCCESS: "success",
  GENERATION_FAILED: "generation_failed",
};

export function resolveCustomerPaymentState(record) {
  if (!record) return null;
  const paymentState = resolvePaymentState(record);
  if (
    paymentState === PAYMENT_STATE.FAILED ||
    paymentState === PAYMENT_STATE.CANCELLED ||
    record.paymentStatus === "failed"
  ) {
    return CUSTOMER_PAYMENT_STATE.FAILED;
  }
  if (record.paymentStatus === "verified") {
    if (record.reportStatus === REPORT_STATE.READY) {
      return CUSTOMER_PAYMENT_STATE.SUCCESS;
    }
    if (record.reportStatus === REPORT_STATE.FAILED) {
      return CUSTOMER_PAYMENT_STATE.GENERATION_FAILED;
    }
    return CUSTOMER_PAYMENT_STATE.PROCESSING;
  }
  return null;
}

export function customerStatusLabel(customerPaymentState) {
  switch (customerPaymentState) {
    case CUSTOMER_PAYMENT_STATE.SUCCESS:
      return "Ready";
    case CUSTOMER_PAYMENT_STATE.PROCESSING:
      return "Processing";
    case CUSTOMER_PAYMENT_STATE.GENERATION_FAILED:
      return "Generation failed";
    case CUSTOMER_PAYMENT_STATE.FAILED:
      return "Payment failed";
    default:
      return "Pending";
  }
}

export function customerStatusMessage(record) {
  const state = resolveCustomerPaymentState(record);
  const reportStatus = resolveReportStatus(record);
  if (state === CUSTOMER_PAYMENT_STATE.SUCCESS) {
    return "Payment verified. Your full report is ready to download.";
  }
  if (state === CUSTOMER_PAYMENT_STATE.GENERATION_FAILED) {
    return "Payment verified. Report generation failed — use Recover My Report to retry or contact support@aigovernancehub.ai.";
  }
  if (state === CUSTOMER_PAYMENT_STATE.PROCESSING) {
    return reportStatus === REPORT_STATE.GENERATING
      ? "Payment verified. Your report is being prepared."
      : "Payment verified. Your executive assessment is being prepared.";
  }
  if (state === CUSTOMER_PAYMENT_STATE.FAILED) {
    return "Payment was not completed.";
  }
  return null;
}

/** Canonical customer-visible status derived from persisted report record. */
export function buildCustomerStatusView(record) {
  const customerPaymentState = resolveCustomerPaymentState(record);
  const reportStatus = resolveReportStatus(record);
  const downloadReady = isDownloadReady(record);
  return {
    customerPaymentState,
    reportStatus,
    paymentStatus: record?.paymentStatus || null,
    paymentState: resolvePaymentState(record),
    downloadReady,
    statusLabel: customerStatusLabel(customerPaymentState),
    message: customerStatusMessage(record),
    emailStatus: record?.emailSent ? "sent" : record?.emailError ? "failed" : "pending",
    availableFormats: record?.availableFormats || ["html", "text"],
    correlationId: record?.correlationId || null,
  };
}

export function isPaymentVerified(record) {
  return record?.paymentStatus === "verified";
}
