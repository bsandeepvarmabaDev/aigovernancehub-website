# Changelog — v24.0 Enterprise Intelligence Platform

**Release focus:** Transform AI Governance Hub from report delivery into a living intelligence platform. No checkout, payment, or authentication redesign.

## Added

### Intelligence persistence
- `api/lib/intelligence-snapshot.js` — slim reproducible snapshot stored on each verified report
- Reports now retain `intelligenceSnapshot`, `industry`, and `aiReadiness` for portfolio analytics

### Portfolio & executive dashboard
- `api/lib/portfolio-intelligence.js` — multi-assessment aggregation, trends, KPIs, heatmaps
- `api/portfolio.js` — authenticated portfolio intelligence API (60s private cache)
- `dashboard.html` + `assets/js/executive-dashboard.js` — tabbed executive dashboard:
  - Overview (KPIs, recent assessments, top risks/opportunities)
  - Portfolio (project comparison, heatmap, department rankings)
  - Trends (weekly/monthly/quarterly governance charts)
  - Action tracker (owner, status, progress, target date, CSV export)
  - Customer value metrics
  - Reports (multi-format downloads)

### Action tracker
- `api/lib/action-tracker.js` — server-side action storage per email (HMAC-indexed)
- `api/action-tracker.js` — GET/PATCH + CSV export

### Industry models
- `api/lib/industry-models.js` — Healthcare, Banking, Insurance, Retail, Manufacturing, Government, Technology
- Industry selector on assessment wizard upload step
- Reports adapt regulatory framing (no score manipulation)

### Benchmarking foundation
- `api/lib/benchmarking.js` — opt-in architecture schema only; **no fabricated peer data**

### Board presentation
- `api/lib/report-export-v24.js` — 18-slide board-ready PowerPoint (replaces standard 13-slide as delivered PPTX)

### Platform analytics (admin)
- `api/lib/platform-analytics.js` — revenue estimate, plans, countries, conversion, repeat customers, enterprise leads
- Extended `api/admin-analytics.js` response

### Performance
- `api/lib/cache.js` — short-lived in-memory cache for portfolio responses
- `Cache-Control: private, max-age=60` on portfolio API
- Lazy loading preserved on dashboard assets

## Changed
- `api/verify-payment.js` — v24 formats, intelligence snapshot, industry, analytics emailHash
- `api/upload-report.js` — industry parameter, industry model at upload
- `api/dashboard.js` — sorted reports, intelligence API links, v24 fields
- `api/health.js` / `api/pricing.js` — version 24.0
- `assets/js/guided-assessment.js` — sends industry on upload
- `pricing.html` — industry selector
- `styles.css` — v24 executive dashboard styles
- `assets/js/admin-portal.js` — displays platform analytics block

## Security (unchanged principles)
- All intelligence computed server-side from uploaded data
- HMAC tokens, signed downloads, rate limits, audit logs preserved
- Action tracker requires authenticated session
- Portfolio scoped to buyer email only
- No client-side trust of scores or recommendations

## Testing
- `scripts/v24-intelligence-test.mjs` — snapshot, industry, portfolio, benchmark, actions

## Not in scope
- Checkout/payment/auth redesign
- Fabricated benchmark data
- SSO / multi-tenant org model
