// AI Governance Hub API — health / readiness v25.23
import { applySecurityHeaders, sendJson } from "./_lib/security.js";
import {
  getCorrelationId,
  getRequestId,
  attachRequestHeaders,
  createRequestLogger,
} from "./_lib/correlation.js";
import { getPublicReadiness } from "./_lib/ops-readiness.js";
import { recordOpsTiming } from "./_lib/ops-metrics.js";

export default async function handler(req, res) {
  const startedAt = Date.now();
  const correlationId = getCorrelationId(req);
  const requestId = getRequestId(req);
  attachRequestHeaders(res, { correlationId, requestId });
  applySecurityHeaders(res);

  const logger = createRequestLogger({
    correlationId,
    requestId,
    route: "/api/health",
  });

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    logger.finish("error", { statusCode: 405, category: "health" });
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const readiness = await getPublicReadiness();
  const statusCode = readiness.status === "unavailable" ? 503 : 200;

  await recordOpsTiming("health_check_ms", Date.now() - startedAt);
  logger.finish(readiness.status === "ok" ? "success" : "degraded", {
    statusCode,
    category: "health",
  });

  return sendJson(res, statusCode, {
    status: readiness.status,
    readiness: readiness.readiness,
    launchReady: readiness.readiness === "ready" || readiness.readiness === "degraded",
    services: readiness.services,
    securityPosture: readiness.securityPosture,
    version: "25.23",
    correlationId,
    requestId,
    timestamp: new Date().toISOString(),
  });
}
