// AI Governance Hub API — REST v1 workspace foundation v25.0
import workspaceHandler from "./workspace.js";
import { restApiManifest } from "./lib/rest-api-v1.js";
import { applySecurityHeaders, sendJson } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method === "GET" && req.query?.manifest === "1") {
    return sendJson(res, 200, restApiManifest());
  }

  return workspaceHandler(req, res);
}
