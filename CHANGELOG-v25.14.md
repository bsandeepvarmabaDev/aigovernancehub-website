# CHANGELOG — v25.14 Production Build-Out

**Release:** v25.14 | **Date:** 2026-06-27 | **Series:** v25 Production (target launch v25.25)

## Security

- **CSP hardening:** Removed `'unsafe-inline'` from `script-src` across all HTML pages
- Extracted inline scripts to `assets/js/site-nav.js` and `assets/js/starter-success.js`
- Removed `onclick="toggleNavigation()"` handlers — event listeners in external JS
- Added CSP meta to previously uncovered pages (faq, dashboard, login, features, etc.)
- API headers: `Cross-Origin-Resource-Policy`, `X-Permitted-Cross-Domain-Policies`, API CSP `default-src 'none'`
- Vercel edge headers aligned with API security posture
- `style-src 'unsafe-inline'` retained (minimal inline style attributes on 2 pages — acceptable)

## Payment

- Payment state machine, webhook reconciliation, idempotent verify — verified (no regression)
- External `starter-success.js` preserves signature-first verify flow

## Enterprise / Admin

- Admin portal: diagnostics panel, `mark_refunded`, `retry_generation`, `enable_download` in search UI
- All admin actions audited (v25.13 baseline retained)
- Admin page: CSP, skip link, `aria-live` status

## Operations

- Version bump to **25.14** (health, dashboard, admin, pricing API)
- Ops dashboard, diagnostics, structured logging unchanged and verified

## Accessibility

- Skip links on payment-pending, thank-you
- Nav keyboard: Escape closes menu, focus moves to first link
- Recover report: focus moves to results heading on success
- Success page: focus moves to verified heading
- Static a11y test suite (`accessibility-test.mjs`) — 32 checks

## Documentation

- Privacy: upload session retention clarified (24 hours)
- FAQ: aligned retention copy
- Terms: refund policy section + link

## Testing

- New: `csp-hardening-test.mjs`, `accessibility-test.mjs`
- **14 suites, 263 tests — all pass**

## Package

`aigovernancehub-website-v25.14-production-buildout.zip`

## Commit message

```
v25.14 production build-out — CSP hardening, admin reconciliation UI, a11y, and documentation alignment
```
