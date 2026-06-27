# OPERATIONS SECURITY — v25.21

**Scope:** Secrets, env vars, webhooks, rotation, retention, backups, alerting  
**Date:** 2026-06-27

---

## Secrets inventory

| Secret | Purpose | Rotation support |
|--------|---------|------------------|
| `APP_SIGNING_SECRET` | Fallback signing | `_PREVIOUS` suffix pattern |
| `SESSION_TOKEN_SECRET` | Upload/checkout sessions | `_PREVIOUS` |
| `DOWNLOAD_TOKEN_SECRET` | Download + recovery tokens | `_PREVIOUS` |
| `ENTERPRISE_TOKEN_SECRET` | Enterprise pay links | `_PREVIOUS` |
| `RATE_LIMIT_SECRET` | Rate limit HMAC | `_PREVIOUS` |
| `AUTH_TOKEN_SECRET` | Magic link auth | `_PREVIOUS` |
| `RAZORPAY_KEY_SECRET` | Payment API | Manual rotate in Razorpay + Vercel |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verify | Manual rotate |
| `ADMIN_API_KEY` / `ADMIN_SECRET` | Admin portal | Manual rotate |
| `EMAIL_*` | Transactional email | Provider rotation |
| `ALERT_WEBHOOK_URL` | Ops alerts (optional) | v25.19 |

**No secrets in frontend** (verified by secret scan; `starter-checkout.js` contains benign "key_secret" substring in comment — false positive).

---

## Environment completeness

`getPublicReadiness()` / health `securityPosture` (v25.21):

- `configComplete`, `signedDownloads`, `webhookSignatureConfigured`, `rateLimitConfigured`, `sessionSigningConfigured`

Required for **ready**: storage, Razorpay, admin key, SITE_URL, rate limit secret, session signing.

---

## Webhook security

- HMAC signature verification on Razorpay webhook
- Duplicate event idempotency
- Fail without `RAZORPAY_WEBHOOK_SECRET` when configured

---

## Retention & deletion

| Data class | Default retention |
|------------|-------------------|
| Pending sessions | ~24 hours |
| Reports | 90 days |
| Audit logs | 365 days |

Admin actions: `delete_expired`, `disable_download`, refund status — all audited.

---

## Alerting & monitoring

- Structured request logging with correlation IDs
- Ops metrics counters (upload, verify, report_generated, failures)
- Optional `ALERT_WEBHOOK_URL` POST on critical events
- Admin `operations_dashboard` diagnostics action

---

## Backups & disaster recovery

| Item | Status |
|------|--------|
| Storage backend backup | **Platform-dependent** (Vercel Blob / S3 — configure in prod) |
| Documented runbooks | ✅ v25.19 SUPPORT, FAILURE-RECOVERY, PRODUCTION-MONITORING |
| RTO/RPO defined | ⚠️ Operational targets in docs, not SLA |

---

## Operational gaps (document only)

1. No automated secret rotation job
2. No centralized SIEM integration in repo
3. Production deploy lag — ops metrics not reflecting live traffic

---

## Operations Security Score: **71 / 100**
