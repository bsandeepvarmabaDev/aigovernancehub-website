// AI Governance Hub API — auth session + verify (v25.23 Hobby bundle)
import { assertStorageConfigured } from "./_lib/storage.js";
import {
  consumeMagicLink,
  createAuthSessionRecord,
  requireAuth,
  setSessionCookie,
} from "./_lib/auth.js";
import { enforceRateLimit } from "./_lib/rate-limit.js";
import { applySecurityHeaders, sendError, sendJson } from "./_lib/security.js";
import { getCorrelationId, attachCorrelation } from "./_lib/correlation.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method === "GET") {
    const session = await requireAuth(req);
    if (!session) {
      return sendJson(res, 401, { authenticated: false });
    }
    return sendJson(res, 200, {
      authenticated: true,
      email: session.email,
    });
  }

  if (req.method === "POST") {
    try {
      assertStorageConfigured();
    } catch {
      return sendError(res, 503, "Authentication is temporarily unavailable.");
    }

    const body = req.body || {};
    const token = typeof body.token === "string" ? body.token : "";

    if (!token) {
      return sendError(res, 400, "Sign-in token is required.");
    }

    const rateLimited = await enforceRateLimit(req, "auth-verify");
    if (rateLimited) {
      return sendError(res, rateLimited.status, rateLimited.error);
    }

    const email = await consumeMagicLink(token);
    if (!email) {
      return sendError(res, 400, "Sign-in link is invalid or expired.");
    }

    const session = await createAuthSessionRecord(email);
    setSessionCookie(res, session.cookieValue);

    return sendJson(res, 200, {
      authenticated: true,
      email: session.email,
    });
  }

  res.setHeader("Allow", "GET, POST");
  return sendError(res, 405, "Method not allowed.");
}
