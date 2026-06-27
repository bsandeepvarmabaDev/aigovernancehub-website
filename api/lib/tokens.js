/**
 * Purpose-specific signing secrets — v25.8 resilience.
 * Each token type uses an independent secret with legacy fallback for rotation.
 */
import crypto from "crypto";

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const SUCCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const RECOVERY_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const ENTERPRISE_PAY_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const PURPOSE_ENV = {
  session: "SESSION_TOKEN_SECRET",
  download: "DOWNLOAD_TOKEN_SECRET",
  enterprise: "ENTERPRISE_TOKEN_SECRET",
  rate_limit: "RATE_LIMIT_SECRET",
  analytics: "ANALYTICS_HASH_SECRET",
  auth: "AUTH_TOKEN_SECRET",
};

export function trimEnv(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function safeCompare(expected, actual) {
  if (typeof expected !== "string" || typeof actual !== "string") {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/** Razorpay API secret only — not used for app tokens. */
export function getKeySecret() {
  return trimEnv(process.env.RAZORPAY_KEY_SECRET);
}

export function getSigningSecret(purpose) {
  const envName = PURPOSE_ENV[purpose];
  const specific = envName ? trimEnv(process.env[envName]) : "";
  if (specific) {
    return specific;
  }
  const app = trimEnv(process.env.APP_SIGNING_SECRET);
  if (app) {
    return app;
  }
  return getKeySecret();
}

export function getSessionSigningSecret() {
  return getSigningSecret("session");
}

export function getDownloadSigningSecret() {
  return getSigningSecret("download");
}

export function getEnterpriseSigningSecret() {
  return getSigningSecret("enterprise");
}

export function getRateLimitSecret() {
  return getSigningSecret("rate_limit");
}

export function getAnalyticsHashSecret() {
  return getSigningSecret("analytics");
}

export function getAuthSigningSecret() {
  return getSigningSecret("auth");
}

/** Primary + previous + legacy secrets for validation during rotation (v25.11). */
export function getSigningSecretsForPurpose(purpose) {
  const envName = PURPOSE_ENV[purpose];
  const primary = getSigningSecret(purpose);
  const previous = envName ? trimEnv(process.env[`${envName}_PREVIOUS`]) : "";
  const legacy = getKeySecret();
  const secrets = [];
  if (primary) secrets.push(primary);
  if (previous && previous !== primary) secrets.push(previous);
  if (legacy && legacy !== primary && legacy !== previous) secrets.push(legacy);
  return secrets;
}

function signPayload(payload, keySecret) {
  return crypto.createHmac("sha256", keySecret).update(payload).digest("hex");
}

function encodeToken(parts) {
  return Buffer.from(parts.join("|")).toString("base64url");
}

function decodeToken(token) {
  try {
    return Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function validateWithSecrets(validateFn, token, secrets) {
  for (const secret of secrets) {
    if (!secret) continue;
    const result = validateFn(token, secret);
    if (result) return result;
  }
  return null;
}

export function createSessionToken(sessionId, contentHash, _legacyKeySecret) {
  const keySecret = getSessionSigningSecret();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${sessionId}|${contentHash}|${expiresAt}`;
  const signature = signPayload(payload, keySecret);
  return encodeToken([sessionId, contentHash, String(expiresAt), signature]);
}

function validateSessionTokenWithSecret(token, keySecret) {
  if (!isNonEmptyString(token)) {
    return null;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return null;
  }

  const parts = decoded.split("|");
  if (parts.length !== 4) {
    return null;
  }

  const [sessionId, contentHash, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (!sessionId || !contentHash || !Number.isFinite(expiresAt) || !signature) {
    return null;
  }

  if (Date.now() > expiresAt) {
    return null;
  }

  const payload = `${sessionId}|${contentHash}|${expiresAt}`;
  const expectedSignature = signPayload(payload, keySecret);

  if (!safeCompare(expectedSignature, signature)) {
    return null;
  }

  return { sessionId, contentHash, expiresAt };
}

export function validateSessionToken(token, _legacyKeySecret) {
  return validateWithSecrets(validateSessionTokenWithSecret, token, getSigningSecretsForPurpose("session"));
}

export function createSuccessToken(orderId, paymentId, _legacyKeySecret) {
  const keySecret = getDownloadSigningSecret();
  const expiresAt = Date.now() + SUCCESS_TOKEN_TTL_MS;
  const payload = `success|${orderId}|${paymentId}|${expiresAt}`;
  const signature = signPayload(payload, keySecret);
  return encodeToken(["success", orderId, paymentId, String(expiresAt), signature]);
}

function validateSuccessTokenWithSecret(token, keySecret) {
  if (!isNonEmptyString(token)) {
    return null;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return null;
  }

  const parts = decoded.split("|");
  if (parts.length !== 5 || parts[0] !== "success") {
    return null;
  }

  const [, orderId, paymentId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (!orderId || !paymentId || !Number.isFinite(expiresAt) || !signature) {
    return null;
  }

  if (Date.now() > expiresAt) {
    return null;
  }

  const payload = `success|${orderId}|${paymentId}|${expiresAt}`;
  const expectedSignature = signPayload(payload, keySecret);

  if (!safeCompare(expectedSignature, signature)) {
    return null;
  }

  return { orderId, paymentId, expiresAt, tokenType: "success" };
}

export function validateSuccessToken(token, _legacyKeySecret) {
  return validateWithSecrets(validateSuccessTokenWithSecret, token, getSigningSecretsForPurpose("download"));
}

export function createRecoveryToken(orderId, paymentId, email, _legacyKeySecret) {
  const keySecret = getDownloadSigningSecret();
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const expiresAt = Date.now() + RECOVERY_TOKEN_TTL_MS;
  const payload = `recovery|${orderId}|${paymentId}|${normalizedEmail}|${expiresAt}`;
  const signature = signPayload(payload, keySecret);
  return encodeToken(["recovery", orderId, paymentId, normalizedEmail, String(expiresAt), signature]);
}

function validateRecoveryTokenWithSecret(token, keySecret, expectedEmail) {
  if (!isNonEmptyString(token)) {
    return null;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return null;
  }

  const parts = decoded.split("|");
  if (parts.length !== 6 || parts[0] !== "recovery") {
    return null;
  }

  const [, orderId, paymentId, email, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (!orderId || !paymentId || !email || !Number.isFinite(expiresAt) || !signature) {
    return null;
  }

  if (Date.now() > expiresAt) {
    return null;
  }

  if (expectedEmail && email !== String(expectedEmail).trim().toLowerCase()) {
    return null;
  }

  const payload = `recovery|${orderId}|${paymentId}|${email}|${expiresAt}`;
  const expectedSignature = signPayload(payload, keySecret);

  if (!safeCompare(expectedSignature, signature)) {
    return null;
  }

  return { orderId, paymentId, email, expiresAt, tokenType: "recovery" };
}

export function validateRecoveryToken(token, _legacyKeySecret, expectedEmail) {
  for (const secret of getSigningSecretsForPurpose("download")) {
    const result = validateRecoveryTokenWithSecret(token, secret, expectedEmail);
    if (result) return result;
  }
  return null;
}

export function validateDownloadToken(token, _legacyKeySecret, expectedEmail) {
  const success = validateSuccessToken(token, _legacyKeySecret);
  if (success) {
    return success;
  }
  return validateRecoveryToken(token, _legacyKeySecret, expectedEmail);
}

export function createEnterprisePayToken(sessionId, orderId, _legacyKeySecret) {
  const keySecret = getEnterpriseSigningSecret();
  const expiresAt = Date.now() + ENTERPRISE_PAY_TOKEN_TTL_MS;
  const payload = `enterprise|${sessionId}|${orderId}|${expiresAt}`;
  const signature = signPayload(payload, keySecret);
  return encodeToken(["enterprise", sessionId, orderId, String(expiresAt), signature]);
}

function validateEnterprisePayTokenWithSecret(token, keySecret) {
  if (!isNonEmptyString(token)) {
    return null;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return null;
  }

  const parts = decoded.split("|");
  if (parts.length !== 5 || parts[0] !== "enterprise") {
    return null;
  }

  const [, sessionId, orderId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (!sessionId || !orderId || !Number.isFinite(expiresAt) || !signature) {
    return null;
  }

  if (Date.now() > expiresAt) {
    return null;
  }

  const payload = `enterprise|${sessionId}|${orderId}|${expiresAt}`;
  const expectedSignature = signPayload(payload, keySecret);

  if (!safeCompare(expectedSignature, signature)) {
    return null;
  }

  return { sessionId, orderId, expiresAt, tokenType: "enterprise_pay" };
}

export function validateEnterprisePayToken(token, _legacyKeySecret) {
  return validateWithSecrets(validateEnterprisePayTokenWithSecret, token, getSigningSecretsForPurpose("enterprise"));
}

/** @deprecated use createSuccessToken */
export function createConfirmationToken(orderId, paymentId, keySecret) {
  return createSuccessToken(orderId, paymentId, keySecret);
}

/** @deprecated use validateSuccessToken */
export function validateConfirmationToken(token, keySecret) {
  return validateSuccessToken(token, keySecret);
}

export function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function getEmailIndexSecret() {
  return getAnalyticsHashSecret() || getKeySecret();
}

export function hashIdentifier(value, keySecret) {
  const secret = keySecret || getRateLimitSecret() || getKeySecret();
  if (!secret) {
    throw new Error("Rate limit hashing is not configured.");
  }
  return crypto.createHmac("sha256", secret).update(String(value || "")).digest("hex");
}
