# SECURITY AUDIT — v25.7

**Auditor posture:** Independent production certification (Fortune 500 / Big Four lens)  
**Scope:** Authentication, authorization, payment, enterprise gate, uploads, downloads, admin, recovery  
**Date:** 2026-06-27

---

## Security Score: **85 / 100**

| Area | Score | Notes |
|------|-------|-------|
| Authentication | 82 | Magic-link auth; recovery now email-gated |
| Authorization | 86 | Session tokens, admin API key, download tokens |
| Payment integrity | 88 | P0 fixes applied; Razorpay-only |
| Upload validation | 84 | Server-side metrics; tamper rejection |
| Download protection | 87 | Verified payment + HMAC tokens |
| Admin portal | 83 | Fail-closed auth; rate limits added |
| Error hygiene | 90 | No stack traces; generic upload errors |
| Audit logging | 80 | Events logged; SIEM export manual |

---

## P0 Findings — Remediated in v25.7

| ID | Finding | Risk | Fix |
|----|---------|------|-----|
| SEC-P0-01 | `verify-payment` idempotent path re-issued tokens without signature check | Unauthorized report download via known order/payment pair | Signature verified before idempotent branch |
| SEC-P0-02 | `verify-payment` skipped `pendingCheckout` when absent; no amount validation | Pay cheaper tier, receive higher-tier report | Require pendingCheckout; fetch Razorpay payment amount |
| SEC-P0-03 | `recover-reports` returned HMAC recovery tokens without email proof | Targeted report theft for known emails | Magic-link email verification; no tokens in API response |

---

## P1 Open Items (monitor / v25.8+)

| ID | Finding | Recommendation |
|----|---------|----------------|
| SEC-P1-01 | Rate limits fail-open when `RAZORPAY_KEY_SECRET` unset | Decouple rate-limit secret from payment config |
| SEC-P1-02 | All HMAC tokens derive from payment secret | Introduce dedicated `APP_SIGNING_SECRET` for rotation |
| SEC-P1-03 | Client-selectable currency in create-order | Lock currency to geo-detected default or session |
| SEC-P1-04 | No WAF / bot challenge on public APIs | Vercel Firewall or Cloudflare in front of `/api/*` |
| SEC-P1-05 | Admin key is single shared secret | Move to SSO + scoped RBAC for admin portal |
| SEC-P1-06 | Recovery without SMTP configured sends generic message only | Surface “email not configured” ops alert |
| SEC-P1-07 | No automated Razorpay webhook reconciliation | Add webhook for payment.captured + refund events |
| SEC-P1-08 | Session tokens share TTL across all flows | Shorter TTL for checkout vs upload |

---

## Payment Attack Matrix

| Attack | Result |
|--------|--------|
| Price manipulation (client fields) | **Blocked** — `rejectClientPricingTamper` |
| Fake Razorpay signature | **Blocked** — HMAC verify |
| Replay idempotent verify without signature | **Blocked** — v25.7 fix |
| Order reuse across sessions | **Blocked** — pendingCheckout + sessionId bind |
| Pay lower amount, get higher report | **Blocked** — Razorpay amount fetch |
| Download before payment | **Blocked** — `paymentStatus === verified` |
| Reuse another customer's payment ID | **Blocked** — signature + order binding |
| Payment callback replay | **Mitigated** — idempotent path still requires valid signature |
| Expired / cancelled payment | **Blocked** — status check on Razorpay payment |
| Double payment | **Mitigated** — idempotent verified path |

---

## Upload Attack Matrix

| Attack | Result |
|--------|--------|
| Invalid / empty CSV | Graceful 400 with validation object |
| Very large CSV | Size limits in `validateUploadStructure` |
| Duplicate rows | Counted; surfaced in metrics |
| Unicode / malformed UTF | Encoding validation |
| Formula / CSV injection | Sanitized in report export paths |
| ZIP/executable renamed CSV | Parse failure → generic error |
| Header mismatch | Structure validation issues returned |
| >1000 work items | Enterprise gate — no self-serve checkout |

---

## API Security Summary

| Endpoint | Auth | Rate limit | Input validation |
|----------|------|------------|------------------|
| upload-report | Session token (post-parse) | Yes | Strong |
| create-order | Session token | Yes | Strong |
| verify-payment | Session + Razorpay sig | Yes | Strong (v25.7) |
| download-report | Recovery/success token | Yes | Strong |
| recover-reports | Email + rate limit | Yes | Email verification |
| admin-actions | ADMIN_API_KEY | Yes | Scoped actions |
| admin-enterprise-requests | ADMIN_API_KEY | Yes (v25.7) | Request IDs |
| health | Public | No | Minimal response |

---

## Certification Statement

v25.7 closes three **P0** payment/recovery vulnerabilities identified in independent review. Remaining **P1** items are operational hardening suitable for v25.8–v25.25. **Conditional production certification** is recommended after staging Razorpay E2E verification.

**Security Score: 85/100**
