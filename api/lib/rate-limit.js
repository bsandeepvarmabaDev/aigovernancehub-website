import crypto from "crypto";
import { getRateLimitSecret, hashIdentifier } from "./tokens.js";
import { getJson, putJson, rateLimitKey } from "./storage.js";
import { logEvent } from "./correlation.js";
import { incrementOpsCounter } from "./ops-metrics.js";

const WINDOWS = {
  "upload-report": { limit: 10, windowMs: 60 * 60 * 1000 },
  "create-order": { limit: 20, windowMs: 60 * 60 * 1000 },
  "verify-payment": { limit: 30, windowMs: 60 * 60 * 1000 },
  "payment-status": { limit: 60, windowMs: 60 * 60 * 1000 },
  "download-report": { limit: 60, windowMs: 60 * 60 * 1000 },
  "recover-reports": { limit: 5, windowMs: 60 * 60 * 1000 },
  "auth-magic-link": { limit: 5, windowMs: 60 * 60 * 1000 },
  "auth-verify": { limit: 20, windowMs: 60 * 60 * 1000 },
  "analytics-track": { limit: 120, windowMs: 60 * 60 * 1000 },
  "admin-search": { limit: 60, windowMs: 60 * 60 * 1000 },
  "admin-actions": { limit: 30, windowMs: 60 * 60 * 1000 },
  "admin-enterprise": { limit: 30, windowMs: 60 * 60 * 1000 },
  "razorpay-webhook": { limit: 120, windowMs: 60 * 60 * 1000 },
};

async function consume(scope, identifier, limit, windowMs) {
  const keySecret = getRateLimitSecret();
  if (!keySecret) {
    logEvent("error", "rate_limit_unconfigured", { scope, category: "reliability" });
    return { allowed: false, unavailable: true };
  }

  let hash;
  try {
    hash = hashIdentifier(`${scope}:${identifier}`, keySecret);
  } catch (error) {
    logEvent("error", "rate_limit_hash_failed", {
      scope,
      category: "reliability",
      message: error instanceof Error ? error.message : "unknown",
    });
    return { allowed: false, unavailable: true };
  }

  const storageKey = rateLimitKey(scope, hash);
  const now = Date.now();

  try {
    const bucket = (await getJson(storageKey)) || { count: 0, windowStart: now };

    if (now - bucket.windowStart > windowMs) {
      bucket.count = 0;
      bucket.windowStart = now;
    }

    bucket.count += 1;
    await putJson(storageKey, bucket);

    if (bucket.count > limit) {
      return { allowed: false, retryAfterMs: windowMs - (now - bucket.windowStart) };
    }

    return { allowed: true };
  } catch (error) {
    logEvent("error", "rate_limit_storage_failed", {
      scope,
      category: "reliability",
      message: error instanceof Error ? error.message : "unknown",
    });
    return { allowed: false, unavailable: true };
  }
}

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

export function hashIp(ip, keySecret) {
  return crypto.createHmac("sha256", keySecret).update(String(ip || "unknown")).digest("hex");
}

export async function enforceRateLimit(req, scope, email) {
  const config = WINDOWS[scope];
  if (!config) {
    return null;
  }

  const ip = getClientIp(req);
  const ipResult = await consume(`${scope}:ip`, ip, config.limit, config.windowMs);
  if (ipResult.unavailable) {
    return {
      status: 503,
      error: "Service temporarily unavailable. Please try again shortly.",
    };
  }
  if (!ipResult.allowed) {
    await incrementOpsCounter("rate_limit_exceeded");
    return { status: 429, error: "Too many requests. Please try again later." };
  }

  if (email) {
    const emailLimit = Math.max(3, Math.floor(config.limit / 2));
    const emailResult = await consume(`${scope}:email`, email.toLowerCase(), emailLimit, config.windowMs);
    if (emailResult.unavailable) {
      return {
        status: 503,
        error: "Service temporarily unavailable. Please try again shortly.",
      };
    }
    if (!emailResult.allowed) {
      await incrementOpsCounter("rate_limit_exceeded");
      return { status: 429, error: "Too many requests. Please try again later." };
    }
  }

  return null;
}
