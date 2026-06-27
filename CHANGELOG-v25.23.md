# CHANGELOG — v25.23 Production Readiness

**Release type:** Production readiness fixes only (no new features, no v26)  
**Date:** 2026-06-27

## P1 — Revenue E2E validation

- Razorpay payment unlocks report generation only after server-side signature verification (`verify-payment.js`)
- Confirmation tokens require `paymentStatus === "verified"` — failed/cancelled/fake payments never unlock downloads
- Success page (`starter-success.js` / `starter-success.html`) exposes HTML, PDF, DOCX, PPTX, and text downloads via signed tokens

## P1 — SMTP readiness

- `customer-email.js` bundles magic-link and recover flows; app never crashes when SMTP is off
- Enterprise sales request returns clear message when sales email is not sent; request is still saved securely
- Recovery and sign-in flows return HTTP 200 with actionable fallback when email delivery fails

## P1 — Signed downloads

- `download-report.js` requires valid signed token (success or recovery) bound to paid order
- Health `securityPosture.signedDownloads` reflects `getDownloadSigningSecret()` when configured
- `dedicatedDownloadSecret` flag when `DOWNLOAD_TOKEN_SECRET` or `APP_SIGNING_SECRET` is set

## P1 — Health stability

- Storage probe uses read-first + cached results (45s TTL); transient failures report `degraded` not `down`
- HTTP 200 when core services are usable; 503 only when `status === "unavailable"`
- `launchReady` true for `ready` or `degraded` readiness

## P2 — Hobby plan API limit (12 functions)

Deployed API routes (12):

| Route | Purpose |
|-------|---------|
| `health` | Readiness probe |
| `upload-report` | Guided assessment upload |
| `order-quote` | Server-side pricing quote |
| `create-order` | Razorpay checkout |
| `verify-payment` | Payment verification + fulfillment |
| `download-report` | Signed report download |
| `razorpay-webhook` | Webhook reconciliation |
| `auth-core` | Session + magic-link verify (GET/POST) |
| `customer-email` | Magic link + recover (`?kind=`) |
| `dashboard` | My Reports |
| `enterprise-sales-request` | Enterprise contact |
| `enterprise-request-status` | Enterprise status |

Legacy URLs rewritten in `vercel.json`: `/api/auth-verify`, `/api/auth-session`, `/api/auth-magic-link`, `/api/recover-reports`.

Admin/pricing routes remain in `_hobby-excluded/` (not deployed on Hobby).

## P2 — Pricing API fallback

- `guided-assessment.js` shows multi-currency selector fallback when `/api/pricing` returns 404

## Version

**25.23** — health, trust footer, HTML comments

## Package

`aigovernancehub-website-v25.23-production-readiness.zip`
