# Changelog — v17.1 Production Hardening

**Release date:** 2026-06-27  
**Scope:** Production readiness — persistent storage, security controls, recovery, email delivery.

## Summary

Hardens v17.0 RC1 for commercial SaaS production. Removes all `/tmp` storage, adds Vercel Blob / AWS S3 persistence, rate limiting, audit logging, dual-token download security, report recovery, and Zoho/SMTP email delivery.

## Security (P0)

- Removed `api/lib/session-store.js` (`/tmp`) entirely — **fail closed** if Blob/S3 not configured
- Completed `api/lib/storage.js` using official `@vercel/blob` and `@aws-sdk/client-s3` SDKs
- Added `api/lib/rate-limit.js` — per-IP and per-email limits on all sensitive APIs (429)
- Added `api/lib/audit.js` — payment, generation, download, email, recovery events
- Dual tokens: 15-minute success token + 90-day recovery token (post-verified payment only)
- Download audit: `downloadCount`, `lastDownloadAt`, hashed IP
- Security headers on all API responses via `api/lib/security.js`
- Masked order/payment references in reports and recovery UI

## Functional (P1)

- Persist uploaded source files, preview JSON, report HTML/text, buyer metadata
- `api/recover-reports.js` — email-based report recovery with signed tokens
- `api/lib/email.js` — Zoho/SMTP payment confirmation + invoice + recovery link
- Enhanced `report-engine.js`: executive summary, score reason, frameworks, disclaimer
- Idempotent payment verification (safe replay returns existing tokens)

## UX (P2)

- `recover-report.html` + `assets/js/recover-report.js`
- Success page: email delivery status + Recover My Report link
- Pricing/pending pages: recovery links

## New files

| File | Purpose |
|------|---------|
| `api/lib/storage.js` | Persistent Blob/S3 storage |
| `api/lib/rate-limit.js` | API rate limiting |
| `api/lib/audit.js` | Audit event logging |
| `api/lib/email.js` | SMTP email delivery |
| `api/lib/security.js` | Security headers helpers |
| `api/recover-reports.js` | Email report recovery |
| `recover-report.html` | Recovery UI |
| `assets/js/recover-report.js` | Recovery client |
| `package.json` | `@vercel/blob`, `@aws-sdk/client-s3`, `nodemailer` |

## Removed

| File | Reason |
|------|--------|
| `api/lib/session-store.js` | Ephemeral `/tmp` — not production safe |

## Unchanged

- Razorpay amount: **19900 paise**
- HMAC payment verification
- Upload → Preview → Pay → Download journey

## Breaking changes

Production deploy **requires** `BLOB_READ_WRITE_TOKEN` (or full AWS S3 env). Without it, APIs return **503**.
