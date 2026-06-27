# CHANGELOG — v25.17 Enterprise SaaS Experience & Product Maturity

**Release:** 2026-06-27  
**Series:** v25 Production  
**Focus:** Product maturity, first-run UX, terminology consistency, procurement readiness — no new features, no security weakening.

---

## Summary

v25.17 makes AI Governance Hub feel like an established enterprise SaaS product through subtle UX maturity (breadcrumbs, next-step guidance), unified terminology (“Executive Assessment”), a dedicated procurement page, post-purchase customer success copy, and report cover polish.

---

## Modified Files

| File | Change |
|------|--------|
| `assets/css/product-maturity.css` | **New** — breadcrumbs, next-step bar, value strip, procurement grid, customer success panels |
| `assets/js/product-maturity.js` | **New** — contextual breadcrumbs and “What to do next” per page |
| `enterprise-procurement.html` | **New** — factual procurement guide (pricing, invoice/PO, SLAs, security, workflow) |
| `index.html` | Value proposition strip above fold; Executive Assessment terminology; Procurement footer link; v25.17 |
| `pricing.html` | Terminology; product-maturity assets; Procurement footer |
| `features.html` | Trust footer, breadcrumbs, next-step guidance |
| `sample-files.html` | Trust footer, breadcrumbs, next-step guidance |
| `login.html` | Footer, product-maturity, trust footer |
| `starter-success.html` | Customer success “Your purchase includes” panel; trust footer |
| `case-study.html` | CTA terminology |
| `assets/js/starter-checkout.js` | Product description → Executive Assessment |
| `assets/js/site-trust-footer.js` | Version 25.17 |
| `api/lib/report-engine.js` | Legacy HTML report title → Executive Assessment |
| `api/lib/report-html-v22.js` | Board-ready badge; version stamp v25.17 |
| `api/invoice.js` | Line item terminology |
| `api/health.js`, `api/pricing.js`, `api/dashboard.js`, `api/admin-actions.js`, `api/admin-analytics.js` | Version 25.17 |
| `vercel.json` | Clean URL rewrite for `/enterprise-procurement` |
| `scripts/package-v25.17.mjs` | **New** — packaging script |

---

## Not Changed

- Authentication, authorization, payments, uploads, downloads, sessions, audit, admin APIs
- Assessment wizard logic, pricing tiers, enterprise gate threshold (1,000 work items)
- Report generation algorithms

---

## Deployment

See PowerShell commands in sprint deliverables. Production remains on v16.5.2 until deploy.
