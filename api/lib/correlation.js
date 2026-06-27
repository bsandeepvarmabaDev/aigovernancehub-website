import crypto from "crypto";
import { trimEnv } from "./tokens.js";
import { hashIdentifier, getAnalyticsHashSecret, getKeySecret } from "./tokens.js";

export function getCorrelationId(req) {
  const header = req.headers["x-correlation-id"];
  if (typeof header === "string" && header.trim()) {
    return header.trim().slice(0, 64);
  }
  return crypto.randomUUID();
}

export function getRequestId(req) {
  const header = req.headers["x-request-id"];
  if (typeof header === "string" && header.trim()) {
    return header.trim().slice(0, 64);
  }
  return crypto.randomUUID();
}

export function attachCorrelation(res, correlationId) {
  res.setHeader("X-Correlation-Id", correlationId);
}

export function attachRequestHeaders(res, { correlationId, requestId }) {
  attachCorrelation(res, correlationId);
  if (requestId) {
    res.setHeader("X-Request-Id", requestId);
  }
}

export function hashCustomerIdentifier(email) {
  const secret = getAnalyticsHashSecret() || getKeySecret();
  if (!secret || !email) return null;
  return hashIdentifier(String(email).trim().toLowerCase(), secret).slice(0, 16);
}

export function createRequestLogger(context) {
  const startedAt = Date.now();
  return {
    finish(outcome, extra = {}) {
      logEvent(extra.level || "info", "api_request", {
        correlationId: context.correlationId,
        requestId: context.requestId,
        assessmentId: context.assessmentId || null,
        enterpriseRequestId: context.enterpriseRequestId || null,
        customerHash: context.customerHash || null,
        route: context.route || null,
        outcome,
        durationMs: Date.now() - startedAt,
        statusCode: extra.statusCode ?? null,
        category: extra.category || "api",
      });
    },
  };
}

export function logEvent(level, message, context = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  console.log(JSON.stringify(payload));
}

export function getAdminSecret() {
  return trimEnv(process.env.ADMIN_API_KEY) || trimEnv(process.env.ADMIN_SECRET);
}

export function isAdminAuthorized(req) {
  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }
  const auth = req.headers.authorization || "";
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    return timingSafeEqual(token, secret);
  }
  const headerKey = req.headers["x-admin-key"];
  if (typeof headerKey === "string" && timingSafeEqual(headerKey.trim(), secret)) {
    return true;
  }
  return false;
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}
