// AI Governance Hub API — enterprise custom checkout (P0)
import { getKeySecret, trimEnv, validateEnterprisePayToken } from "./lib/tokens.js";
import { loadSessionRecord } from "./lib/storage.js";
import { loadSalesRequestBySession } from "./lib/enterprise-gate.js";
import { formatMoney } from "./lib/pricing.js";
import { applySecurityHeaders, sendError, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return sendError(res, 405, "Method not allowed.");
  }

  const keySecret = getKeySecret();
  const keyId = trimEnv(process.env.RAZORPAY_KEY_ID);
  if (!keySecret || !keyId) {
    return sendError(res, 503, "Payment service is not configured.");
  }

  const token =
    typeof req.query?.token === "string"
      ? req.query.token
      : typeof req.body?.token === "string"
        ? req.body.token
        : "";

  const tokenData = validateEnterprisePayToken(token, keySecret);
  if (!tokenData) {
    return sendError(res, 400, "Payment link is invalid or expired.");
  }

  const session = await loadSessionRecord(tokenData.sessionId);
  if (!session) {
    return sendError(res, 404, "Assessment session not found.");
  }

  const salesRequest = await loadSalesRequestBySession(tokenData.sessionId);
  if (!salesRequest || salesRequest.customOrderId !== tokenData.orderId) {
    return sendError(res, 400, "Payment link is invalid or has been revoked.");
  }

  if (salesRequest.status === "paid" || salesRequest.status === "payment_received" || salesRequest.status === "report_delivered") {
    return sendJson(res, 200, {
      paid: true,
      secureReference: salesRequest.secureReference,
      message: "Payment already completed for this assessment.",
    });
  }

  const checkout = session.pendingCheckout;
  if (!checkout || checkout.orderId !== tokenData.orderId) {
    return sendError(res, 400, "Checkout session is not ready. Contact sales@aigovernancehub.ai.");
  }

  if (req.method === "GET") {
    return sendJson(res, 200, {
      paid: false,
      secureReference: salesRequest.secureReference,
      buyerName: salesRequest.buyerName,
      buyerEmail: salesRequest.buyerEmail,
      company: salesRequest.company,
      planLabel: "Enterprise Assessment",
      orderId: checkout.orderId,
      amount: checkout.amountMinor,
      amountDisplay: formatMoney(checkout.amountMinor, checkout.currency),
      currency: checkout.currency,
      keyId,
      sessionId: session.sessionId,
      workItems: session.workItemMetrics?.totalWorkItems ?? null,
    });
  }

  return sendJson(res, 200, {
    paid: false,
    orderId: checkout.orderId,
    amount: checkout.amountMinor,
    currency: checkout.currency,
    keyId,
    sessionId: session.sessionId,
    sessionToken: null,
    secureReference: salesRequest.secureReference,
    buyerName: salesRequest.buyerName,
    buyerEmail: salesRequest.buyerEmail,
    message: "Proceed to Razorpay checkout.",
  });
}
