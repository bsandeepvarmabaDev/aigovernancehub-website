# CHANGELOG — v25.7 Independent Production Audit

**Release:** v25.7 (Production Series — target final v25.25)  
**Date:** 2026-06-27  
**Type:** Security hardening + certification (no new features)

---

## P0 Security Fixes

### Payment verification (`api/verify-payment.js`)
- **Signature-first:** Razorpay HMAC is verified before any idempotent token re-issue, closing replay-with-fake-signature bypass.
- **Session binding:** Idempotent path rejects mismatched `sessionId` on already-verified orders.
- **Checkout binding:** Self-serve verification now requires `pendingCheckout.orderId` match (no bypass when `pendingCheckout` absent).
- **Amount validation:** Fetches payment from Razorpay API and validates amount/currency/status against session quote (and enterprise custom quote).

### Report recovery (`api/recover-reports.js`, `assets/js/recover-report.js`, `recover-report.html`)
- **Email verification:** Recovery no longer returns HMAC download tokens in API response without proving email ownership.
- Sends magic sign-in link (same pattern as dashboard auth) when active reports exist.
- Uniform response message to reduce account enumeration.
- UI updated: “Send secure sign-in link” flow with email verification copy.

### Supporting hardening
- **`api/lib/razorpay-client.js`:** Added `fetchRazorpayPayment()` for server-side amount verification.
- **`api/upload-report.js`:** Generic parse error message (no parser internals leaked).
- **`api/health.js`:** Reduced public infrastructure recon (`checks`, `storageBackend` removed from response).
- **`api/lib/rate-limit.js`:** Added `admin-enterprise` rate limit scope.

---

## Version

- `api/health.js`, `api/dashboard.js` → **25.7**

---

## Tests

| Suite | Result |
|-------|--------|
| `scripts/production-audit-test.mjs` | 17/17 |
| `scripts/launch-hardening-test.mjs` | 25/25 |
| `scripts/enterprise-gate-test.mjs` | 20/20 |
| `scripts/payment-architecture-test.mjs` | 6/6 |
| `scripts/customer-journey-test.mjs` | 14/14 |

---

## Modified Files

- `api/verify-payment.js`
- `api/recover-reports.js`
- `api/lib/razorpay-client.js`
- `api/lib/rate-limit.js`
- `api/upload-report.js`
- `api/health.js`
- `api/dashboard.js`
- `assets/js/recover-report.js`
- `recover-report.html`
- `scripts/production-audit-test.mjs`
- `scripts/package-v25.7.mjs`
- `scripts/customer-journey-test.mjs`

---

## Certification Artifacts

- `SECURITY-AUDIT-v25.7.md`
- `PRODUCTION-AUDIT-v25.7.md`
- `COMMERCIAL-AUDIT-v25.7.md`
- `PERFORMANCE-AUDIT-v25.7.md`
- `ACCESSIBILITY-AUDIT-v25.7.md`
- `TEST-CHECKLIST-v25.7.md`
- `DEPLOY-v25.7.ps1`
- `aigovernancehub-website-v25.7.zip`

---

## Recommended Git Commit Message

```
v25.7 independent production audit — security hardening and certification
```
