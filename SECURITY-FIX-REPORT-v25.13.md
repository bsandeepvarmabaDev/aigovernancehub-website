# SECURITY FIX REPORT — v25.13

*(Consolidates v25.11 security pass)*

## Fixes Applied This Sprint

### 1. Rate Limits — Fail Closed ✅
- Missing `RATE_LIMIT_SECRET` → 503, not bypass
- Storage failure → 503

### 2. HMAC Secret Separation ✅
- Independent env vars per purpose (v25.8)
- Razorpay secret not reused for app tokens when purpose secrets set

### 3. Secret Rotation — `_PREVIOUS` ✅ (v25.11)
- `getSigningSecretsForPurpose` accepts `{ENV}_PREVIOUS`
- Validates tokens signed with previous secret during rotation window

### 4. Payment Integrity ✅
- Payment state machine: pending, paid, failed, cancelled, refunded
- Webhook + verify-payment reconciliation (v25.8)

### 5. CSP Hardening — Documented ⚠️
- `unsafe-inline` remains on static HTML meta CSP
- Reason: no SSR/build nonce injection pipeline
- Target removal: v25.14–v25.16

### 6. Admin Portal Security ✅
- `auditAdmin` on: enterprise actions, retry, resend, disable/enable download, delete_expired
- Admin API key + rate limits

### 7. Upload Security ✅
- `sanitizeSpreadsheetCell` — prefixes `=`, `+`, `-`, `@`, tab, CR
- Existing: size limits, encoding validation, duplicate field handling (report-engine)

## Test Suite

```powershell
node scripts/security-fix-test.mjs
```

## Related

- `SECRET-ROTATION-GUIDE-v25.11.md`
- `ADMIN-SECURITY-REPORT-v25.11.md` (content merged into SECURITY-REPORT-v25.13.md)
