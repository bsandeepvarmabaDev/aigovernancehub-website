import crypto from "crypto";
import { getAuthSigningSecret, trimEnv } from "./tokens.js";
import { getJson, putJson } from "./storage.js";

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const AUTH_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = "agh_session";

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function normalizeAuthEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseCookies(req) {
  const header = req.headers.cookie || "";
  const cookies = {};
  header.split(";").forEach((part) => {
    const [rawKey, ...rest] = part.split("=");
    if (!rawKey) return;
    const key = rawKey.trim();
    const value = rest.join("=").trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

export function magicLinkStorageKey(tokenHash) {
  return `auth/magic/${tokenHash}.json`;
}

export function authSessionStorageKey(sessionId) {
  return `auth/sessions/${sessionId}.json`;
}

export async function createMagicLinkRecord(email) {
  const keySecret = getAuthSigningSecret();
  if (!keySecret) {
    throw new Error("Auth is not configured.");
  }
  const normalized = normalizeAuthEmail(email);
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = sign(token, keySecret);
  const expiresAt = Date.now() + MAGIC_LINK_TTL_MS;
  await putJson(magicLinkStorageKey(tokenHash), {
    email: normalized,
    expiresAt,
    used: false,
  });
  return { token, normalized, expiresAt };
}

export async function consumeMagicLink(token) {
  const keySecret = getAuthSigningSecret();
  if (!keySecret || !token) {
    return null;
  }
  const tokenHash = sign(token, keySecret);
  const record = await getJson(magicLinkStorageKey(tokenHash));
  if (!record || record.used || Date.now() > Number(record.expiresAt)) {
    return null;
  }
  await putJson(magicLinkStorageKey(tokenHash), { ...record, used: true });
  return record.email;
}

export async function createAuthSessionRecord(email) {
  const keySecret = getAuthSigningSecret();
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + AUTH_SESSION_TTL_MS;
  await putJson(authSessionStorageKey(sessionId), {
    sessionId,
    email: normalizeAuthEmail(email),
    createdAt: new Date().toISOString(),
    expiresAt,
  });
  const payload = `${sessionId}|${expiresAt}`;
  const signature = sign(payload, keySecret);
  const cookieValue = Buffer.from(`${payload}|${signature}`).toString("base64url");
  return { cookieValue, sessionId, email: normalizeAuthEmail(email), expiresAt };
}

export async function getAuthSession(cookieValue) {
  const keySecret = getAuthSigningSecret();
  if (!keySecret || !cookieValue) {
    return null;
  }
  let decoded = "";
  try {
    decoded = Buffer.from(cookieValue, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const parts = decoded.split("|");
  if (parts.length !== 3) {
    return null;
  }
  const [sessionId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!sessionId || !Number.isFinite(expiresAt) || !signature) {
    return null;
  }
  if (Date.now() > expiresAt) {
    return null;
  }
  const expected = sign(`${sessionId}|${expiresAt}`, keySecret);
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  const record = await getJson(authSessionStorageKey(sessionId));
  if (!record || record.sessionId !== sessionId) {
    return null;
  }
  return record;
}

export function setSessionCookie(res, cookieValue) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(cookieValue)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=2592000",
  ];
  if (secure) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function getSessionCookie(req) {
  return parseCookies(req)[COOKIE_NAME] || "";
}

export async function requireAuth(req) {
  const cookieValue = getSessionCookie(req);
  const session = await getAuthSession(cookieValue);
  if (!session) {
    return null;
  }
  return session;
}
