// AI Governance Hub API — order quote v25.1 (enterprise gate P0)
import { getKeySecret, validateSessionToken } from "./_lib/tokens.js";
import { loadSessionRecord } from "./_lib/storage.js";
import { buildOrderQuote, detectCurrency } from "./_lib/pricing.js";
import { assertSelfServeAllowed } from "./_lib/enterprise-gate.js";
import { applySecurityHeaders, sendError, sendJson } from "./_lib/security.js";
import { getCorrelationId, getRequestId, attachRequestHeaders, createRequestLogger } from "./_lib/correlation.js";
import { AUDIT_EVENTS, logSessionAudit } from "./_lib/audit.js";
import { incrementOpsCounter } from "./_lib/ops-metrics.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  const requestId = getRequestId(req);
  attachRequestHeaders(res, { correlationId, requestId });
  applySecurityHeaders(res);

  const logger = createRequestLogger({
    correlationId,
    requestId,
    route: "/api/order-quote",
    assessmentId: typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : null,
  });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  const body = req.body || {};
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken : "";
  const currencyOverride =
    typeof body.currency === "string" ? body.currency.toUpperCase() : detectCurrency(req);

  if (!sessionId || !sessionToken) {
    return sendError(res, 400, "Upload session is required.");
  }

  const tokenData = validateSessionToken(sessionToken, getKeySecret());
  if (!tokenData || tokenData.sessionId !== sessionId) {
    return sendError(res, 400, "Upload session is invalid or expired.");
  }

  const session = await loadSessionRecord(sessionId);
  if (!session || session.contentHash !== tokenData.contentHash) {
    return sendError(res, 404, "Upload session not found.");
  }

  const gateCheck = assertSelfServeAllowed(session);
  if (!gateCheck.allowed) {
    return sendJson(res, 200, {
      correlationId,
      quote: {
        checkoutAvailable: false,
        enterpriseGate: true,
        message: gateCheck.reason,
        plan: {
          id: session.planTier || "enterprise",
          label: "Enterprise Assessment Required",
          selfServe: false,
        },
      },
      planRecommendation: session.validation?.plan?.blockReason || gateCheck.reason,
      compatibility: session.validation?.compatibility || null,
      workItemMetrics: session.workItemMetrics || null,
      salesRequestRef: session.salesRequestRef || null,
    });
  }

  const planId = session.planTier || session.validation?.plan?.tier || "starter";
  const quote = buildOrderQuote(planId, currencyOverride);

  await incrementOpsCounter("quote_created");
  await logSessionAudit(sessionId, AUDIT_EVENTS.QUOTE_CREATED, {
    correlationId,
    requestId,
    planId,
    checkoutAvailable: quote.checkoutAvailable,
  });

  logger.finish("success", { statusCode: 200, assessmentId: sessionId });

  return sendJson(res, 200, {
    correlationId,
    requestId,
    quote,
    workItemMetrics: session.workItemMetrics || session.validation?.compatibility?.workItemMetrics || null,
    detectedPlan: {
      tier: planId,
      label: session.validation?.plan?.label || planId,
    },
    reportFormats: ["html", "pdf", "docx", "pptx", "text"],
    planRecommendation: session.validation?.plan?.reason || null,
    compatibility: session.validation?.compatibility || null,
  });
}
