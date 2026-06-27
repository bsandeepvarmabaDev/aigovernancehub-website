# CHANGELOG — v25.22 Universal Language & Business Excellence

**Release type:** Business clarity and enterprise operations (no features, no security weakening)  
**Date:** 2026-06-27

## Phase 1 — Universal business language

- Replaced "AI candidates" with **AI-related work items** across website, FAQ, pricing, reports
- 15-second homepage: Upload → Analyze → Receive
- Dynamic source labels (`business-terminology.js`, `business-labels.js`)
- Jira → Issues, CSV → Records, etc.

## Phase 2 — Business excellence & enterprise operations

| Area | Change |
|------|--------|
| **P2 Marketplace vs Website** | Dual-product cards on homepage; explicit labels: Executive Governance Assessment vs Continuous AI Governance inside Jira |
| **P3 Enterprise buying** | `#enterprise-buying` section on pricing — purchase, invoice, PO, contacts, upgrade, company purchase |
| **P4 Customer success** | Post-purchase hub on support, dashboard, success page (invoice, re-assess, upgrade paths) |
| **P5 Sales readiness** | Enterprise sales workflow (request → quote → payment → report → follow-up → Marketplace) on procurement page |
| **P6 Premium feel** | `assets/css/business-excellence.css` — product cards, buying grid, customer hub, sales path |
| **P0 Security** | No control changes; verified API headers intact |

## New files

- `assets/css/business-excellence.css`
- `assets/js/business-terminology.js`
- `api/lib/business-labels.js`
- `scripts/business-language-test.mjs`
- `scripts/business-excellence-test.mjs`

## Version

**25.22** — APIs, trust footer, report stamp

## Tests

**17/17 suites pass** in `run-all-tests.mjs`

## Package

`aigovernancehub-website-v25.22-universal-language.zip`
