# Security Report — v21.0 Commercial SaaS

**Date:** 2026-06-27  
**Verdict:** **PASS**

## P0 controls

| Control | Status |
|---------|--------|
| No secrets in frontend | ✅ |
| Server-side payment verification (HMAC) | ✅ |
| Server-side order amount (no client trust) | ✅ NEW |
| Order confirmation required | ✅ NEW |
| Enterprise blocked from checkout | ✅ |
| Signed downloads | ✅ |
| Persistent storage fail-closed | ✅ |
| Rate limiting | ✅ |
| Security headers + HSTS | ✅ |
| No localStorage payment proof | ✅ |
| Audit logging | ✅ |
| Upload security scan | ✅ |
| Pending checkout order ID match on verify | ✅ NEW |

## Payment flow security

1. Upload → plan detected server-side → stored on session
2. Order quote calculated server-side (`buildOrderQuote`)
3. Customer confirms order summary checkbox (client UX; server requires `orderConfirmed`)
4. Razorpay order created with server-calculated `totalMinor`
5. Returned amount verified matches quote
6. HMAC verification on payment callback
7. Report generated only after verified signature

## Risk notes

- **Multi-currency Razorpay:** Requires merchant international payment configuration. Amounts are server-calculated; misconfiguration would fail at Razorpay API, not client bypass.
- **Tax rate:** Configurable via env; must match business tax registration in production.

## P0 verdict

**PASS** — No security regressions. Commercial pricing adds server-side amount enforcement.
