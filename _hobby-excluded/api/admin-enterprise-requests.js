// AI Governance Hub API — admin enterprise requests (internal sales portal)
import { isAdminAuthorized } from "./lib/correlation.js";
import { enforceRateLimit } from "./lib/rate-limit.js";
import { listEnterpriseRequests, loadSalesRequest } from "./lib/enterprise-gate.js";
import { applySecurityHeaders, sendError, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

export default async function handler(req, res) {
  attachCorrelation(res, getCorrelationId(req));
  applySecurityHeaders(res);

  if (!isAdminAuthorized(req)) {
    return sendError(res, 403, "Admin access denied.");
  }

  const rateLimited = await enforceRateLimit(req, "admin-enterprise");
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  if (req.method === "GET") {
    const status =
      typeof req.query?.status === "string" ? req.query.status.trim() : null;
    const requests = await listEnterpriseRequests(status || null);
    return sendJson(res, 200, { requests, count: requests.length });
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    if (!requestId) {
      return sendError(res, 400, "Request ID is required.");
    }
    const record = await loadSalesRequest(requestId);
    if (!record) {
      return sendError(res, 404, "Enterprise request not found.");
    }
    return sendJson(res, 200, { request: record });
  }

  res.setHeader("Allow", "GET, POST");
  return sendError(res, 405, "Method not allowed.");
}
