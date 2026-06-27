// AI Governance Hub API — pricing v21.0
import {
  detectCurrency,
  getAllCurrencies,
  getCommercialCatalog,
  getLegacyStarterPricing,
  buildOrderQuote,
} from "./lib/pricing.js";
import { applySecurityHeaders, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const currency = detectCurrency(req);
  const planId = typeof req.query?.plan === "string" ? req.query.plan : "starter";

  return sendJson(res, 200, {
    version: "25.22",
    correlationId,
    currency,
    selected: getLegacyStarterPricing(req),
    plans: getCommercialCatalog(currency),
    currencies: getAllCurrencies(),
    sampleQuote: buildOrderQuote(planId, currency),
  });
}
