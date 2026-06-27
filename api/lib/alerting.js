/**
 * Alert hooks — v25.19 (optional ALERT_WEBHOOK_URL dispatch).
 */
import { logEvent } from "./correlation.js";
import { recordOperationalIssue } from "./ops-metrics.js";
import { trimEnv } from "./tokens.js";

export const ALERT_TYPES = {
  PAYMENT_VERIFY_FAILED: "payment_verify_failed",
  UPLOAD_FAILURES_SPIKE: "upload_failures_spike",
  ADMIN_AUTH_FAILED: "admin_auth_failed",
  STORAGE_FAILURE: "storage_failure",
  SMTP_FAILURE: "smtp_failure",
  REPORT_GENERATION_FAILED: "report_generation_failed",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  WEBHOOK_PROCESSING_FAILED: "webhook_processing_failed",
};

async function dispatchAlertWebhook(payload) {
  const url = trimEnv(process.env.ALERT_WEBHOOK_URL);
  if (!url) return { dispatched: false, reason: "not_configured" };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { dispatched: response.ok, status: response.status };
  } catch (error) {
    logEvent("warn", "alert_webhook_failed", {
      category: "alerting",
      message: error instanceof Error ? error.message : "unknown",
    });
    return { dispatched: false, reason: "fetch_failed" };
  }
}

export async function emitAlert(type, context = {}) {
  const payload = {
    alertType: type,
    at: new Date().toISOString(),
    service: "ai-governance-hub",
    ...context,
  };
  logEvent("warn", "ops_alert", {
    alertType: type,
    category: "alerting",
    ...context,
  });
  await recordOperationalIssue(type, context);
  await dispatchAlertWebhook(payload);
}

export async function emitAlertIfThreshold(type, count, threshold, context = {}) {
  if (count >= threshold) {
    await emitAlert(type, { ...context, count, threshold });
  }
}
