import crypto from "crypto";
import { getKeySecret } from "./tokens.js";
import { getJson, putJson } from "./storage.js";
import { getClientIp, hashIp } from "./rate-limit.js";

const ANALYTICS_EVENTS = new Set([
  "upload_started",
  "upload_completed",
  "preview_viewed",
  "checkout_started",
  "payment_verified",
  "report_downloaded",
  "recovery_used",
  "magic_link_requested",
  "dashboard_viewed",
  "workspace_viewed",
  "workspace_task_updated",
]);

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function analyticsDayKey(date = new Date()) {
  return `analytics/daily/${dayKey(date)}.json`;
}

export async function trackEvent(event, req, metadata = {}) {
  if (!ANALYTICS_EVENTS.has(event)) {
    return;
  }
  const keySecret = getKeySecret();
  const ip = getClientIp(req);
  const ipHash = keySecret ? hashIp(ip, keySecret) : crypto.createHash("sha256").update(ip).digest("hex");
  const userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : "";
  const referrer = typeof req.headers.referer === "string" ? req.headers.referer : "";
  const country =
    (typeof req.headers["x-vercel-ip-country"] === "string" && req.headers["x-vercel-ip-country"]) || "unknown";

  const entry = {
    event,
    timestamp: new Date().toISOString(),
    ipHash,
    country,
    userAgent: userAgent.slice(0, 256),
    referrer: referrer.slice(0, 512),
    metadata,
  };

  const key = analyticsDayKey();
  const existing = (await getJson(key)) || [];
  existing.push(entry);
  await putJson(key, existing.slice(-5000));
}

export async function getAnalyticsSummary(days = 7) {
  const summary = {
    uploads: 0,
    previews: 0,
    checkouts: 0,
    payments: 0,
    downloads: 0,
    recoveries: 0,
    countries: {},
    referrers: {},
  };

  for (let i = 0; i < days; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const events = (await getJson(analyticsDayKey(date))) || [];
    events.forEach((entry) => {
      if (entry.event === "upload_completed") summary.uploads += 1;
      if (entry.event === "preview_viewed") summary.previews += 1;
      if (entry.event === "checkout_started") summary.checkouts += 1;
      if (entry.event === "payment_verified") summary.payments += 1;
      if (entry.event === "report_downloaded") summary.downloads += 1;
      if (entry.event === "recovery_used") summary.recoveries += 1;
      summary.countries[entry.country] = (summary.countries[entry.country] || 0) + 1;
      if (entry.referrer) {
        summary.referrers[entry.referrer] = (summary.referrers[entry.referrer] || 0) + 1;
      }
    });
  }

  return summary;
}
