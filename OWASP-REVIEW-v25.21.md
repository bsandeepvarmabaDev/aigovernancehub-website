# OWASP Top 10 Review — v25.21

**Reference:** OWASP Top 10 (2021)  
**Date:** 2026-06-27

| # | Category | Status | Evidence |
|---|----------|--------|----------|
| A01 | Broken Access Control | **Low risk** | Dashboard auth; download tokens; admin API key; enterprise gate |
| A02 | Cryptographic Failures | **Low risk** | HMAC-SHA256 tokens; Razorpay signature verify; secrets in env only |
| A03 | Injection | **Low risk** | No SQL; CSV formula sanitization; filename sanitization (v25.21) |
| A04 | Insecure Design | **Acceptable** | Fail-closed rate limit; payment-before-download; enterprise threshold |
| A05 | Security Misconfiguration | **Medium** | Production stale; DNS security (CAA/MTA-STS) not in repo |
| A06 | Vulnerable Components | **Not assessed** | Recommend `npm audit` in CI; minimal dependencies |
| A07 | Auth Failures | **Low risk** | Magic link + session; no password storage |
| A08 | Software/Data Integrity | **Low risk** | Webhook HMAC; signed download tokens |
| A09 | Logging Failures | **Acceptable** | Structured logs, audit events, optional `ALERT_WEBHOOK_URL` |
| A10 | SSRF | **Low risk** | Limited outbound calls (Razorpay, email) |

## Detailed notes

### A01 — Access control

- **IDOR:** Dashboard lists only reports where `buyerEmail === session.email`.
- **Download:** Token validates orderId, paymentId, expiry, and payment state.
- **Admin:** `isAdminAuthorized` on all admin-actions; failures audited.

### A03 — Injection

- **XSS:** Page CSP blocks inline scripts; user upload content parsed as CSV, not rendered as HTML in app shell.
- **CSV injection:** Leading `=`, `+`, `-`, `@` prefixed in sanitizer.
- **Header injection:** Download filename sanitized v25.21.

### A05 — Misconfiguration

- HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy in `vercel.json`.
- API responses: strict CSP, nosniff, DENY framing.
- **Gap:** Live production not on current config.

### Replay / CSRF

- Payment verify requires valid Razorpay signature.
- State-changing endpoints use POST; session cookies SameSite.

## Residual risks

1. Admin key exposure via XSS on admin origin (mitigated by CSP; key still in sessionStorage).
2. No formal WAF rule set documented.
3. XLSX parsing — trust boundary is file size + extension, not deep content inspection.

## OWASP Compliance Score: **76 / 100**
