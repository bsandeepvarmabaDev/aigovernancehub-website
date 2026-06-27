# Changelog — v18.0 Commercial Launch

**Release date:** 2026-06-27  
**Scope:** Commercial launch readiness — accounts, dashboard, admin, analytics, SEO, i18n pricing, monitoring.

## Summary

Builds on v17.1 production hardening with passwordless accounts, customer dashboard, internal admin portal, analytics pipeline, backend-driven pricing display, marketing/trust pages, and operational monitoring. No architectural rewrites. Razorpay checkout remains **₹199 (19900 paise)** with server-side HMAC verification.

## Security (P0)

- Magic-link auth with 15-minute tokens; HttpOnly / Secure / SameSite session cookies (30 days)
- Admin APIs gated by `ADMIN_API_KEY` Bearer token; rate limited
- Correlation IDs on all v18 API routes; structured logging via `api/lib/correlation.js`
- HSTS on API responses and static site via `vercel.json`
- Invoice download requires authenticated session + signed recovery token
- No payment proof in `localStorage` / `sessionStorage` (admin key in sessionStorage is internal-only UI convenience)
- Persistent storage only — fail closed if Blob/S3 unconfigured

## Functional (P1)

### Account system
- `api/auth-magic-link.js`, `api/auth-verify.js`, `api/auth-session.js`, `api/auth-logout.js`
- `login.html`, `assets/js/auth.js`

### Customer dashboard
- `api/dashboard.js` — purchased reports, download counts, invoice availability
- `api/invoice.js` — HTML invoice download for verified payments
- `dashboard.html`, `assets/js/dashboard.js`

### Admin portal
- `api/admin-search.js` — search by email, order ID, payment ID, session ID
- `api/admin-analytics.js` — 7-day event summary
- `api/admin-actions.js` — resend email, disable/enable download, delete expired
- `admin.html`, `assets/js/admin-portal.js`

### Analytics
- `api/lib/analytics.js` — daily event aggregation in Blob
- `api/analytics-track.js` — client event ingestion
- `assets/js/analytics-client.js` — checkout funnel events

### Internationalization (display)
- `api/pricing.js`, `api/lib/pricing.js` — INR/USD/EUR/GBP/AUD/SGD display pricing
- `assets/js/pricing-i18n.js` — dynamic UI prices from backend (checkout stays INR)

### Monitoring
- `api/health.js` — storage, Razorpay, email configuration status

## UX / Marketing (P2–P3)

- `features.html`, `faq.html`, `case-study.html`, `blog/index.html`
- `refund-policy.html`, `cookie-policy.html`
- Updated `sitemap.xml`, `robots.txt`, Open Graph / Twitter Cards / JSON-LD
- Skip links, focus-visible states, lazy-load CSS hook

## New API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/pricing` | GET | Multi-currency display pricing |
| `/api/auth-magic-link` | POST | Request magic link |
| `/api/auth-verify` | POST | Consume token, set cookie |
| `/api/auth-session` | GET | Current session |
| `/api/auth-logout` | POST | Clear session |
| `/api/dashboard` | GET | Customer reports |
| `/api/invoice` | POST | Invoice download |
| `/api/admin-search` | POST | Admin search |
| `/api/admin-analytics` | GET | Analytics summary |
| `/api/admin-actions` | POST | Admin actions |
| `/api/analytics-track` | POST | Client analytics |

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `BLOB_READ_WRITE_TOKEN` | Yes (prod) | Persistent storage |
| `RAZORPAY_KEY_ID` | Yes | Checkout |
| `RAZORPAY_KEY_SECRET` | Yes | HMAC + tokens |
| `SITE_URL` | Recommended | Magic links, emails |
| `ADMIN_API_KEY` | Recommended | Admin portal |
| `ZOHO_SMTP_*` / `SMTP_*` | Optional | Email delivery |

## Unchanged

- Razorpay amount: **19900 paise**
- HMAC payment verification flow
- Upload → Preview → Pay → Download journey
- v17.1 persistent storage model

## Future-ready (stubbed)

- Re-run assessment from dashboard
- Razorpay refund integration from admin
- Blog content
