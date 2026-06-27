# PERFORMANCE AUDIT — v25.7

**Scope:** Load, upload, preview, checkout, dashboard, reports, bundle, caching, fonts, images  
**Date:** 2026-06-27

---

## Performance Score: **78 / 100**

---

## Measured / Observed

| Area | Assessment | Score |
|------|------------|-------|
| Initial HTML load | Static pages; minimal blocking scripts | Good |
| CSS bundle | Single `styles.css`; no purge | Medium |
| JS defer | Most scripts use `defer` | Good |
| API cold start | Vercel serverless; storage round-trips | Medium |
| Upload (1k rows) | Parse + analyze in-function | Acceptable |
| Upload (100k rows) | Risk function timeout | **Test required** |
| Preview generation | On-demand per session | Medium |
| Checkout | Razorpay modal external | Good |
| verify-payment | Multi-format generation post-pay | Heavy |
| Dashboard | Session + report list | Light |
| Large report download | Blob stream | Medium |
| Fonts | System stack primary | Good |
| Images | Logo lazy on some pages | Good |
| Caching | `Cache-Control` via security headers | Partial |

---

## Bundle & Assets

| Asset | Recommendation |
|-------|----------------|
| `styles.css` | Measure unused CSS; split critical above-fold (P2) |
| `guided-assessment.js` | Largest customer JS; already deferred |
| `admin-portal.js` | Admin-only; no customer impact |
| `app-logo-512.png` | Consider WebP + srcset (P3) |

---

## Measurable Improvements (recommended)

1. **Precompute preview hash cache** — avoid re-parse on order-quote if unchanged (est. −200ms).
2. **Stream CSV parse** for >5000 rows — reduce memory peak (est. −40% memory).
3. **Defer PDF/PPTX generation** to background job for enterprise orders >5000 items.
4. **Add `Cache-Control: public, max-age=3600`** on static assets via vercel.json.
5. **Preconnect** to `api.razorpay.com` on checkout pages only.

---

## Core Web Vitals (estimate — run Lighthouse on staging)

| Metric | Target | Notes |
|--------|--------|-------|
| LCP | <2.5s | Hero + logo |
| INP | <200ms | Form interactions |
| CLS | <0.1 | Status regions use aria-live |

---

## Accessibility Overlap

Performance fixes (lazy images, defer scripts) support both perf and a11y scores.

**Performance Score: 78/100**
