# Test Checklist — v25.15 Executive Buyer Review

**Use after deploy.** Mark ✅ when verified on **production**.

## P0 — Security
- [ ] `/api/health` → 200, version 25.15
- [ ] CSP: no script `unsafe-inline` on homepage/pricing
- [ ] create-order without session → rejected
- [ ] verify-payment invalid signature → rejected
- [ ] download before payment → rejected
- [ ] enterprise session → no Razorpay checkout

## P1 — Functional
- [ ] `/pricing` → 200 (not 404)
- [ ] `/login`, `/dashboard`, `/features`, `/faq` → 200
- [ ] Upload sample CSV → validation → preview → quote
- [ ] Razorpay test payment → report → downloads
- [ ] Dashboard history + recover report

## P2 — Enterprise experience
- [ ] Homepage `#executive-buyers` section visible
- [ ] Wizard progress + drop zone on pricing
- [ ] Hero headline readable (contrast)
- [ ] Logo loads on mobile

## P3 — Commercial
- [ ] Pricing card shows “From ₹199”
- [ ] Order summary before checkout
- [ ] Refund policy linked

## Executive sign-off
- [ ] CEO demo recorded from production URL
- [ ] CISO live control review
- [ ] Procurement brief available
- [ ] One paid live transaction completed

**Pre-deploy repo checks (2026-06-27):**
- ✅ vercel.json rewrites present
- ✅ Executive buyer section in index.html
- ✅ From ₹199 on pricing.html
- ✅ API version 25.15 in health.js
