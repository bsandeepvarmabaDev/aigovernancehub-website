export function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Permissions-Policy", "interest-cohort=(), geolocation=(), microphone=(), camera=()");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
}

export function sendJson(res, status, body) {
  applySecurityHeaders(res);
  return res.status(status).json(body);
}

export function sendError(res, status, message) {
  return sendJson(res, status, { error: message });
}
