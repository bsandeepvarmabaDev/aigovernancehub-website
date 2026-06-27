# Changelog — v17.0 Upload → Preview → Pay → Download

**Release date:** 2026-06-27  
**Scope:** Post-payment delivery flow — upload before pay, preview, verified download after payment.

## Summary

Fixes the broken post-payment experience where users paid ₹199 but received no report. v17.0 delivers a complete Upload → Preview → Pay → Download flow with server-side verification as the source of truth.

## New files

| File | Purpose |
|------|---------|
| `api/lib/tokens.js` | HMAC session and confirmation tokens |
| `api/lib/session-store.js` | Ephemeral session/report storage (`/tmp`) |
| `api/lib/report-engine.js` | CSV parse, AI detection, preview, HTML/text report generation |
| `api/upload-report.js` | Accept file upload, validate, analyze, create session |
| `api/generate-preview.js` | Return locked preview from validated session |
| `api/download-report.js` | Serve full report only with valid confirmation token |

## Modified files

| File | Changes |
|------|---------|
| `pricing.html` | Upload UI, free preview panel, unlock button, updated activation/FAQ copy |
| `assets/js/starter-checkout.js` | Upload → preview → pay flow; session in memory; order tied to session |
| `api/create-order.js` | Requires valid upload session; stores `sessionId` in Razorpay order notes |
| `api/verify-payment.js` | Generates report after HMAC verify; token-gated download |
| `starter-success.html` | Download Report buttons after token validation |
| `starter-pending.html` | Retry messaging; no unlock on cancel |
| `styles.css` | Upload/preview panel styles |
| `vercel.json` | Increased function memory/duration for report generation |

## Unchanged (per requirements)

- Razorpay order amount: **19900 paise (₹199)**
- Razorpay order creation: same API call pattern
- Payment verification: HMAC `timingSafeEqual` unchanged
- No localStorage unlock
- No client-side fake success

## User flow

1. Upload CSV/Excel/Jira export on pricing page
2. Server validates and returns free preview
3. Full report remains locked
4. User clicks Unlock Full Report — ₹199
5. Razorpay checkout opens (order linked to upload session)
6. After verify-payment success → report generated server-side
7. Success page shows Download Report (confirmation token required)
8. Payment fail/cancel → pending page, no download

## Breaking changes

Deploy must update **all v17.0 files atomically** including new API routes and `api/lib/` modules.
