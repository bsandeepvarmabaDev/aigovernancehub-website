# CHANGELOG — v25.8 Production Resilience & Reliability

**Release:** v25.8 (Production Series → v25.25)  
**Date:** 2026-06-27  
**Type:** SRE hardening — no new customer features

---

## P0 Security (unchanged protections preserved)

- Razorpay HMAC verification order unchanged from v25.7
- Recovery email verification unchanged
- Purpose-specific secrets reduce blast radius of key rotation

---

## P1 Reliability

### Purpose-specific signing secrets (`api/lib/tokens.js`)
Independent env vars: `SESSION_TOKEN_SECRET`, `DOWNLOAD_TOKEN_SECRET`, `ENTERPRISE_TOKEN_SECRET`, `RATE_LIMIT_SECRET`, `AUTH_TOKEN_SECRET`, `ANALYTICS_HASH_SECRET`, optional `APP_SIGNING_SECRET` fallback. Legacy `RAZORPAY_KEY_SECRET` used only for Razorpay API + rotation fallback during validation.

### Rate limiting fail-closed (`api/lib/rate-limit.js`)
Missing secret or storage failure → HTTP 503 + structured log (no silent bypass).

### Payment lifecycle (`api/lib/payment-state.js`)
Canonical states: pending, paid, failed, cancelled, refunded, expired. Report states: generating, ready, failed.

### Checkout expiration (`api/create-order.js`, `api/verify-payment.js`)
`pendingCheckout.expiresAt` enforced; expired checkout rejected.

### Report generation resilience (`api/lib/payment-fulfillment.js`)
- Saves generating stub before artifact creation
- Failed generation preserves paid state for admin retry
- verify-payment returns 202 with recovery message on generation failure
- `retryReportGeneration()` for admin

### Razorpay webhook reconciliation (`api/razorpay-webhook.js`)
- Signature verification via `RAZORPAY_WEBHOOK_SECRET`
- Idempotent event deduplication
- Handles payment.captured, payment.failed, refund events

### Download guard (`api/download-report.js`)
Blocks generating/refunded reports with appropriate HTTP codes (409/410).

---

## P3 Disaster Recovery

- Configurable retention (`api/lib/retention.js`)
- Admin `retry_generation`, `resend_email`, `mark_refunded`, `diagnostics`, `get_audit_trail`

---

## Version

- `api/health.js`, `api/dashboard.js` → **25.8**

---

## Tests

| Suite | Result |
|-------|--------|
| `scripts/resilience-test.mjs` | 26/26 |
| `scripts/production-audit-test.mjs` | 20/20 |
| `scripts/launch-hardening-test.mjs` | 25/25 |
| `scripts/enterprise-gate-test.mjs` | 20/20 |
| `scripts/customer-journey-test.mjs` | 14/14 |
| `scripts/payment-architecture-test.mjs` | 6/6 |

**Total: 111/111**

---

## Git commit message

```
v25.8 production resilience — purpose secrets, webhook reconciliation, fail-closed rate limits
```
