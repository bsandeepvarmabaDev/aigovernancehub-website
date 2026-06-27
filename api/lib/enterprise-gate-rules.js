/**
 * Enterprise gate rules (P0) — pure logic, no storage dependencies.
 */
import { getPlanById, ENTERPRISE_GATE_WORK_ITEMS } from "./assessment-config.js";

export { ENTERPRISE_GATE_WORK_ITEMS };

export const ENTERPRISE_STATUS = {
  SALES_REVIEW_PENDING: "sales_review_pending",
  CONTACT_RECEIVED: "contact_received",
  QUOTE_SET: "quote_set",
  PAYMENT_LINK_READY: "payment_link_ready",
  PAYMENT_RECEIVED: "payment_received",
  REPORT_DELIVERED: "report_delivered",
  CLOSED: "closed",
};

export function enterpriseStatusLabel(status) {
  const labels = {
    sales_review_pending: "Assessment received — sales review pending",
    contact_received: "Contact received — sales review in progress",
    quote_set: "Quote prepared — payment link pending",
    payment_link_ready: "Secure payment link sent",
    payment_received: "Payment verified — report generating",
    report_delivered: "Report delivered",
    closed: "Request closed",
    paid: "Payment verified — report delivered",
  };
  return labels[status] || "Sales review pending";
}

export function generateSecureReference(requestId) {
  return `ENT-${requestId.slice(0, 8).toUpperCase()}`;
}

export function isEnterpriseGated(metrics) {
  if (!metrics || typeof metrics.totalWorkItems !== "number") return true;
  return metrics.totalWorkItems > ENTERPRISE_GATE_WORK_ITEMS;
}

export function assertSelfServeAllowed(session) {
  const metrics = session.workItemMetrics || session.validation?.compatibility?.workItemMetrics;
  if (!metrics) {
    return { allowed: false, reason: "Upload metrics unavailable. Upload your file again." };
  }
  if (isEnterpriseGated(metrics)) {
    return {
      allowed: false,
      reason: "Enterprise Assessment Required. Self-service checkout is not available for uploads over 1,000 work items.",
      enterpriseGate: true,
    };
  }
  if (session.enterpriseGate === true) {
    return {
      allowed: false,
      reason: "Enterprise Assessment Required. Contact sales@aigovernancehub.ai.",
      enterpriseGate: true,
    };
  }
  if (session.selfServeAllowed === false) {
    return {
      allowed: false,
      reason:
        session.validation?.plan?.blockReason ||
        "This assessment requires enterprise processing.",
      enterpriseGate: true,
    };
  }
  const plan = getPlanById(session.planTier || session.validation?.plan?.tier);
  if (!plan.selfServe) {
    return {
      allowed: false,
      reason: "Enterprise Assessment Required.",
      enterpriseGate: true,
    };
  }
  return { allowed: true };
}

/** Reject client-supplied pricing or counts (anti-fraud). */
export function rejectClientPricingTamper(body) {
  const blocked = ["planId", "planTier", "amount", "totalMinor", "razorpayAmount", "workItems", "workItemCount", "taskCount", "price", "total"];
  for (const key of blocked) {
    if (body[key] != null && body[key] !== "") {
      return key;
    }
  }
  return null;
}
