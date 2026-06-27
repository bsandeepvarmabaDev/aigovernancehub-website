import { appendAuditEvent } from "./storage.js";

export const AUDIT_EVENTS = {
  UPLOAD_RECEIVED: "upload_received",
  VALIDATION_COMPLETE: "validation_complete",
  QUOTE_CREATED: "quote_created",
  PAYMENT_STARTED: "payment_started",
  PAYMENT_VERIFIED: "payment_verified",
  PAYMENT_VERIFY_FAILED: "payment_verify_failed",
  PAYMENT_STATE_CHANGED: "payment_state_changed",
  PAYMENT_WEBHOOK: "payment_webhook",
  REPORT_GENERATED: "report_generated",
  REPORT_GENERATION_FAILED: "report_generation_failed",
  REPORT_DOWNLOADED: "report_downloaded",
  REPORT_EMAILED: "report_emailed",
  REPORT_EMAIL_FAILED: "report_email_failed",
  REPORT_RECOVERED: "report_recovered",
  REPORT_REGENERATED: "report_regenerated",
  ENTERPRISE_REQUEST_CREATED: "enterprise_request_created",
  ADMIN_ACTION: "admin_action",
  REFUND_STATUS_UPDATED: "refund_status_updated",
};

export async function logAudit(orderId, event, details = {}) {
  if (!orderId) {
    return;
  }

  await appendAuditEvent(orderId, {
    event,
    ...details,
  });
}

export async function logSessionAudit(sessionId, event, details = {}) {
  if (!sessionId) return;
  await appendAuditEvent(`session:${sessionId}`, {
    event,
    sessionId,
    ...details,
  });
}

export async function logEnterpriseAudit(requestId, event, details = {}) {
  if (!requestId) return;
  await appendAuditEvent(`enterprise:${requestId}`, {
    event,
    requestId,
    ...details,
  });
}
