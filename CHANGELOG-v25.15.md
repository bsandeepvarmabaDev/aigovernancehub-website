# CHANGELOG — v25.15 Executive Buyer Review

**Release type:** Trust, routing, and positioning — not a feature release  
**Date:** 2026-06-27

## Why v25.15

Fortune 500 executive buyer review identified that **production deploy divergence** (v16.5.2 live vs v25.x repo) and **commercial/positioning gaps** block enterprise purchase — not missing product features.

## Changes (material only)

### P0 — Functional / routing (production blocker when deployed)
- **`vercel.json`** — Added clean URL rewrites (`/pricing`, `/features`, `/faq`, `/login`, `/dashboard`, etc.) so nav links do not 404 on Vercel.

### P2 — Enterprise confidence
- **`index.html`** — New “For enterprise buyers” section: 30-second positioning vs consulting, static tools, and Marketplace app; procurement brief CTA.
- **`assets/css/starter-experience.css`** — Pricing wizard hero headline contrast fix (readability / WCAG).

### P3 — Commercial transparency
- **`pricing.html`** — “From ₹199” with explicit server-side plan/total copy before Secure Checkout.

### Version
- API version strings → **25.15** (`health`, `pricing`, `dashboard`, `admin-actions`, `admin-analytics`).

## Not in this release
- No new product features
- No security weakening
- Production deploy (required separately — see `GO-NO-GO-DECISION-v25.15.md`)

## Modified files
- `vercel.json`
- `index.html`
- `pricing.html`
- `assets/css/starter-experience.css`
- `api/health.js`
- `api/pricing.js`
- `api/dashboard.js`
- `api/admin-actions.js`
- `api/admin-analytics.js`
