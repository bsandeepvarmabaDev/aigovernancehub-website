# Security Report — v18.0 Commercial Launch

**Date:** 2026-06-27  
**Verdict:** **PASS with operational prerequisites**

## Executive summary

v18.0 extends v17.1 production hardening with passwordless authentication, customer dashboard, admin tooling, and analytics. Security posture remains **fail-closed** with server-side payment verification, signed downloads, persistent storage, rate limiting, and security headers. No Razorpay secrets in frontend code.

## Mandatory controls

| Control | Status | Notes |
|---------|--------|-------|
| No secrets in frontend | ✅ PASS | Key secret server-only |
| Server-side payment verification | ✅ PASS | HMAC in `verify-payment.js` |
| Signed downloads | ✅ PASS | Success + recovery tokens |
| Persistent storage only | ✅ PASS | Blob/S3; 503 if unconfigured |
| Rate limiting | ✅ PASS | All sensitive + auth + admin APIs |
| CSP headers | ✅ PASS | Meta CSP on key pages |
| HSTS | ✅ PASS | API + `vercel.json` static headers |
| XSS protection | ✅ PASS | Output encoding; no innerHTML in checkout |
| CSRF (payment) | ✅ PASS | No cookie-based payment state |
| Input validation | ✅ PASS | Email, tokens, file size/type |
| Audit logs | ✅ PASS | Payment, download, admin actions |
| Secure cookies | ✅ PASS | HttpOnly, Secure, SameSite=Lax |
| Fail closed | ✅ PASS | Missing config → 503/401/403 |

## Authentication

- **Magic links:** Single-use, 15-minute TTL, stored hashed in Blob
- **Sessions:** Random cookie value, 30-day TTL, server-side record
- **Dashboard / invoice:** Requires valid session cookie
- **Admin:** Bearer `ADMIN_API_KEY` — must be strong, rotated, never committed

## Known limitations

1. **Admin UI stores API key in sessionStorage** — acceptable for internal MVP; prefer SSO or server-side admin session in future.
2. **Display pricing in non-INR currencies** — reference only; checkout always INR ₹199.
3. **Analytics events** — client-submitted; rate limited but not cryptographically signed (acceptable for marketing funnel metrics).
4. **Lighthouse targets** — not verified in CI; manual audit recommended post-deploy.

## Pre-production checklist

- [ ] Set `BLOB_READ_WRITE_TOKEN`
- [ ] Set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`
- [ ] Set `ADMIN_API_KEY` (32+ random bytes)
- [ ] Set `SITE_URL=https://aigovernancehub.ai`
- [ ] Configure SMTP for magic links and report delivery
- [ ] Verify `/api/health` returns `ok: true`
- [ ] Confirm robots.txt blocks `/admin.html`, `/dashboard.html`, `/login.html`

## Files reviewed

- `api/lib/auth.js`, `api/lib/security.js`, `api/lib/rate-limit.js`, `api/lib/tokens.js`
- `api/verify-payment.js`, `api/download-report.js`, `api/dashboard.js`, `api/invoice.js`
- `api/admin-*.js`, `assets/js/starter-checkout.js`

## P0 verdict

**PASS** — No blocking security defects identified in static review. Production deploy requires env configuration above.
