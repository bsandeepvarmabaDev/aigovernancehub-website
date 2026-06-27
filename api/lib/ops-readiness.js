/**
 * Production readiness checks — v25.23 (non-destructive probes).
 */
import {
  trimEnv,
  getRateLimitSecret,
  getSessionSigningSecret,
  getDownloadSigningSecret,
} from "./tokens.js";
import { isStorageConfigured, getStorageBackendName, getJson, putJson } from "./storage.js";
import { isEmailConfigured } from "./email.js";
import { isRazorpayConfigured, getRazorpayKeyId, getRazorpayKeySecret } from "./razorpay-client.js";
import { listEnterpriseRequests, ENTERPRISE_STATUS } from "./enterprise-gate.js";
import { getOperationsMetrics } from "./ops-metrics.js";

const PROBE_KEY = "ops/health-probe.json";
const STORAGE_PROBE_TTL_MS = 45_000;

let lastStorageProbe = { checkedAt: 0, result: null };

async function checkStorageConnectivity() {
  if (!isStorageConfigured()) {
    return { status: "down", ok: false };
  }

  const now = Date.now();
  if (lastStorageProbe.result && now - lastStorageProbe.checkedAt < STORAGE_PROBE_TTL_MS) {
    return lastStorageProbe.result;
  }

  let result;
  try {
    const existing = await getJson(PROBE_KEY);
    if (existing?.probeAt) {
      result = { status: "up", ok: true };
    } else {
      const payload = { probeAt: new Date().toISOString(), nonce: Math.random().toString(36).slice(2) };
      await putJson(PROBE_KEY, payload);
      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 200));
        }
        const read = await getJson(PROBE_KEY);
        if (read?.nonce === payload.nonce) {
          result = { status: "up", ok: true };
          break;
        }
      }
      if (!result) {
        result = { status: "degraded", ok: true };
      }
    }
  } catch {
    result = { status: "degraded", ok: true };
  }

  lastStorageProbe = { checkedAt: now, result };
  return result;
}

async function checkRazorpayConnectivity() {
  if (!isRazorpayConfigured()) {
    return { status: "not_configured", ok: false };
  }
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/payments?count=1", {
      method: "GET",
      headers: { Authorization: `Basic ${auth}` },
    });
    if (response.ok || response.status === 404) {
      return { status: "up", ok: true };
    }
    return { status: "down", ok: false };
  } catch {
    return { status: "down", ok: false };
  }
}

function checkConfigCompleteness() {
  const required = {
    storage: isStorageConfigured(),
    razorpay: isRazorpayConfigured(),
    admin: Boolean(trimEnv(process.env.ADMIN_API_KEY) || trimEnv(process.env.ADMIN_SECRET)),
    siteUrl: Boolean(trimEnv(process.env.SITE_URL)),
    rateLimitSecret: Boolean(getRateLimitSecret()),
    sessionSigning: Boolean(getSessionSigningSecret()),
  };
  const optional = {
    email: isEmailConfigured(),
    webhookSecret: Boolean(trimEnv(process.env.RAZORPAY_WEBHOOK_SECRET)),
    purposeSecrets: Boolean(getDownloadSigningSecret()),
    dedicatedDownloadSecret: Boolean(
      trimEnv(process.env.DOWNLOAD_TOKEN_SECRET) ||
        trimEnv(process.env.APP_SIGNING_SECRET)
    ),
  };
  const complete = Object.values(required).every(Boolean);
  return { complete, required, optional };
}

async function checkQueueHealth() {
  try {
    const requests = await listEnterpriseRequests(null);
    const byStatus = {};
    for (const req of requests) {
      const status = req.status || "unknown";
      byStatus[status] = Number(byStatus[status] || 0) + 1;
    }
    const pendingReview = Number(byStatus[ENTERPRISE_STATUS.SALES_REVIEW_PENDING] || 0);
    const paymentReady = Number(byStatus[ENTERPRISE_STATUS.PAYMENT_LINK_READY] || 0);
    return {
      ok: true,
      total: requests.length,
      byStatus,
      pendingReview,
      paymentReady,
    };
  } catch {
    return { ok: false, total: 0, byStatus: {} };
  }
}

async function checkReportGenerationHealth() {
  try {
    const metrics = await getOperationsMetrics(1);
    const generated = Number(metrics.counters.report_generated || 0);
    const failed = Number(metrics.failedReportGenerations || 0);
    const rate = generated + failed > 0 ? failed / (generated + failed) : 0;
    return {
      ok: rate < 0.1 || failed === 0,
      generated,
      failed,
      failureRate: Math.round(rate * 1000) / 10,
    };
  } catch {
    return { ok: false, generated: 0, failed: 0, failureRate: null };
  }
}

export async function getPublicReadiness() {
  const storage = await checkStorageConnectivity();
  const payments = await checkRazorpayConnectivity();
  const email = { status: isEmailConfigured() ? "up" : "not_configured", ok: isEmailConfigured() };
  const config = checkConfigCompleteness();

  const services = {
    storage: storage.status,
    payments: payments.status,
    email: email.status,
  };

  const storageUsable = storage.status !== "down";
  const paymentsUsable = payments.status === "up";
  const criticalUp = storageUsable && paymentsUsable && config.complete;

  let status = "unavailable";
  let readiness = "not_ready";
  if (criticalUp) {
    if (storage.status === "degraded" || !email.ok) {
      status = "degraded";
      readiness = "degraded";
    } else {
      status = "ok";
      readiness = "ready";
    }
  }

  const securityPosture = {
    configComplete: config.complete,
    signedDownloads: Boolean(getDownloadSigningSecret()),
    dedicatedDownloadSecret: Boolean(config.optional.dedicatedDownloadSecret),
    webhookSignatureConfigured: Boolean(config.optional.webhookSecret),
    rateLimitConfigured: Boolean(config.required.rateLimitSecret),
    sessionSigningConfigured: Boolean(config.required.sessionSigning),
  };

  return { status, readiness, services, securityPosture };
}

export async function getAdminReadiness() {
  const publicReadiness = await getPublicReadiness();
  const storage = await checkStorageConnectivity();
  const payments = await checkRazorpayConnectivity();
  const config = checkConfigCompleteness();
  const queue = await checkQueueHealth();
  const reports = await checkReportGenerationHealth();
  const metrics = await getOperationsMetrics(7);

  return {
    ...publicReadiness,
    storageBackend: getStorageBackendName(),
    config,
    queue,
    reportGeneration: reports,
    operations: metrics,
    checkedAt: new Date().toISOString(),
  };
}
