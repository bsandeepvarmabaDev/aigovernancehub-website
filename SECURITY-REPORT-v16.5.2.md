# Security Report — v16.5.2 Production Remediation

## Threat model

Public marketing site with two serverless payment endpoints. Razorpay Key Secret must never reach the browser. Payment success must not be spoofable client-side.

## Controls implemented

| Control | Status | Implementation |
|---------|--------|----------------|
| Razorpay Key Secret server-only | ✅ | `process.env.RAZORPAY_KEY_SECRET` in API routes only |
| No hardcoded keys in frontend | ✅ | `starter-checkout.js` receives `keyId` from `/api/create-order` only |
| Server-side order creation | ✅ | `api/create-order.js` calls Razorpay with Basic auth |
| HMAC payment verification | ✅ | `crypto.timingSafeEqual` on Razorpay signature |
| Confirmation token (success page) | ✅ | HMAC-signed, 15-minute TTL, validated server-side |
| No localStorage unlock | ✅ | No payment gating in client storage |
| No direct success spoofing | ✅ | `starter-success.html` shows unverified until token validates |
| Env variable trimming | ✅ | `trimEnv()` prevents whitespace misconfiguration |
| Key ID format validation | ✅ | `/^rzp_(test|live)_[A-Za-z0-9]+$/` before Razorpay call |
| Safe error responses | ✅ | Generic client errors; Razorpay status logged server-side only |
| CSP on checkout page | ✅ | `pricing.html` meta CSP restricts scripts and frames |

## Removed risks (from audit)

- **False success page:** Direct `/starter-success.html` no longer shows verified state
- **jiraSite bypass / mismatch:** API no longer requires field removed from form
- **Price manipulation:** Order amount fixed server-side at 19900 paise
- **Field ID leak:** Company optional; not required for verification

## Residual risks (operational)

| Risk | Mitigation |
|------|------------|
| Razorpay keys misconfigured in Vercel | Deployment checklist + env trim validation |
| Partial deploy (split versions) | Atomic deploy of all seven files |
| Confirmation token replay within TTL | 15-minute expiry; token bound to order/payment IDs |
| `company` not persisted server-side | Accept in payload; fulfillment via email/support process |

## Files reviewed

- `index.html` — no secrets, no payment logic
- `pricing.html` — form fields only; Razorpay checkout.js from CDN
- `assets/js/starter-checkout.js` — no secrets, verify-before-redirect
- `starter-success.html` — token validation via `/api/verify-payment`
- `starter-pending.html` — static; noindex
- `api/create-order.js` — secret handling, logging without secrets
- `api/verify-payment.js` — HMAC verify + token signing

## Verdict

**Ready for secure deployment** when all seven files are deployed together and Vercel Razorpay env vars are validated.
