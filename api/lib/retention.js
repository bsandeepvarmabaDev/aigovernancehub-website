/**
 * Configurable retention periods — v25.8
 */
import { trimEnv } from "./tokens.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysEnv(name, fallbackDays) {
  const raw = trimEnv(process.env[name]);
  if (!raw) return fallbackDays;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallbackDays;
}

export function getReportRetentionMs() {
  return daysEnv("RETENTION_REPORT_DAYS", 90) * DAY_MS;
}

export function getSessionRetentionMs() {
  return daysEnv("RETENTION_SESSION_DAYS", 1) * DAY_MS;
}

export function getAuditRetentionMs() {
  return daysEnv("RETENTION_AUDIT_DAYS", 365) * DAY_MS;
}

export function getEnterpriseRequestRetentionMs() {
  return daysEnv("RETENTION_ENTERPRISE_DAYS", 365) * DAY_MS;
}

export function getPendingCheckoutTtlMs() {
  const hours = Number(trimEnv(process.env.PENDING_CHECKOUT_HOURS) || "24");
  return (Number.isFinite(hours) && hours > 0 ? hours : 24) * 60 * 60 * 1000;
}

export function getReportExpiresAt(fromDate = new Date()) {
  return new Date(fromDate.getTime() + getReportRetentionMs()).toISOString();
}

export function getSessionExpiresAt(fromDate = new Date()) {
  return new Date(fromDate.getTime() + getSessionRetentionMs()).toISOString();
}

export function getPendingCheckoutExpiresAt(fromDate = new Date()) {
  const hours = Number(trimEnv(process.env.PENDING_CHECKOUT_HOURS) || "24");
  const ms = (Number.isFinite(hours) && hours > 0 ? hours : 24) * 60 * 60 * 1000;
  return new Date(fromDate.getTime() + ms).toISOString();
}

export function retentionSummary() {
  return {
    reportDays: daysEnv("RETENTION_REPORT_DAYS", 90),
    sessionDays: daysEnv("RETENTION_SESSION_DAYS", 1),
    auditDays: daysEnv("RETENTION_AUDIT_DAYS", 365),
    enterpriseDays: daysEnv("RETENTION_ENTERPRISE_DAYS", 365),
    pendingCheckoutHours: Number(trimEnv(process.env.PENDING_CHECKOUT_HOURS) || "24"),
  };
}
