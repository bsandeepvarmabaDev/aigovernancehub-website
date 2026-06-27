# WEBSITE CONSISTENCY REPORT — v25.17

**Date:** 2026-06-27  
**Scope:** P7 — Navigation, footer, typography, terminology

---

## Terminology Sweep

| Term (legacy) | Term (standard) | Status |
|---------------|-------------------|--------|
| Starter Report | Executive Assessment | ✅ Updated in index, pricing, checkout desc, invoice, report-engine, case-study |
| Starter · (tier badge) | Executive Assessment · | ✅ pricing.html |
| Starter Report (nav/marketing) | Executive Assessment | ✅ |

**Intentionally retained:** Internal CSS/JS filenames (`starter-experience.*`, `starter-checkout.js`) — implementation names, not user-facing.

---

## Navigation Consistency

| Page | Nav pattern | Trust footer | Breadcrumbs |
|------|-------------|--------------|-------------|
| index.html | Full marketing nav | ✅ | N/A (hero CTAs) |
| features.html | Legal nav | ✅ v25.17 | ✅ |
| sample-files.html | Legal nav | ✅ v25.17 | ✅ |
| pricing.html | Marketing nav | ✅ | ✅ |
| login.html | Minimal | ✅ v25.17 | ✅ |
| starter-success.html | Minimal | ✅ v25.17 | — |
| enterprise-procurement.html | Legal nav | ✅ | ✅ |
| dashboard.html | App shell | Partial (welcome panel) | — |

---

## Footer Additions

- **Procurement** link added to index, pricing, features, sample-files footers
- `site-trust-footer.js` injects version 25.17 + health probe where `.site-footer` exists

---

## Remaining Inconsistencies

| Item | Severity |
|------|----------|
| Checkout/success use minimal nav vs full marketing nav | Low — intentional |
| dashboard.html no full marketing footer | Low |
| Old CHANGELOG/ARCHITECTURE docs still say “Starter Report” | Info only — not customer-facing |

---

## Verdict

Customer-facing HTML is **consistent** for Executive Assessment terminology and core footer links after v25.17.
