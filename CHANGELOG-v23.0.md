# Changelog — v23.0 Enterprise Launch Readiness

**Release focus:** Fortune 500 enterprise SaaS polish across customer flows. No major new features. No report, payment, or authentication redesign.

## Added

### Enterprise UX Layer (`assets/js/enterprise-ux.js`)
- Shared `AGHUX` module: human-readable error normalization (What / Why / Fix / Next)
- Progress indicators with ETA for long-running upload validation
- Empty states with welcome copy, explanation, and primary CTA
- Toast notifications replacing raw `window.alert` on assessment wizard
- Loading spinners, status alerts, and busy-state button handling

### v23 CSS (`styles.css`)
- Alert variants (success, error, info, warning)
- Progress bar, spinner, empty state, toast positioning
- Page intro and trust strip components
- Sticky wizard steps, responsive format buttons, reduced-motion support
- Button hover/focus polish

## Changed

### Customer pages
- **pricing.html** — v23 SEO/OG meta; Executive Assessment terminology; loads `enterprise-ux.js`
- **dashboard.html** — What/Why/Next intro; trust strip; enterprise empty state; skip link
- **login.html** — Enterprise sign-in copy; magic-link status messaging
- **recover-report.html** — v23 copy; skip link; empty state for no results
- **starter-success.html** — Multi-format dynamic downloads (HTML/PDF/DOCX/PPTX/text); next steps panel
- **starter-pending.html** — Human-readable payment interruption guidance

### Client scripts
- **guided-assessment.js** — Upload progress steps; AGHUX toasts and status
- **dashboard.js** — Empty state; loading inline; format download status
- **recover-report.js** — Empty state; busy submit; improved recovery messaging
- **auth.js** — Magic-link verification and send status via AGHUX

### API version
- **health.js** / **pricing.js** — version `23.0`
- **verify-payment.js** — returns `availableFormats` in verified response (fixes success page format buttons)

## Security (unchanged, verified)
- No secrets added to frontend
- No weakening of HMAC tokens, signed downloads, rate limits, or server-side generation
- Error messages remain non-enumerating where applicable

## Not in scope (by design)
- No new marketing pages
- No checkout/payment flow redesign
- No auth mechanism changes
- No report engine or intelligence changes (v22 preserved)

## Testing
- `scripts/v23-enterprise-review.mjs` — automated UX/security/deliverable checks
- `scripts/v22-report-quality-test.mjs` — regression for v22 report pipeline

## Known limitations (documented in ENTERPRISE-READINESS-REPORT-v23.0.md)
- Production deploy may lag local v23 (verify `/api/health` returns 23.0 after deploy)
- Binary `.xlsx` uploads still require CSV export or Enterprise processing
- Self-serve upload cap remains 5 MB / 5,000 records
