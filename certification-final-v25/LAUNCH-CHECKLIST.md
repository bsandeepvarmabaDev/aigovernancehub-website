# Launch Checklist — v25.14 Production

**Use after deploy. All items must be ✅ before GO certification.**

---

## P0 — Security (must pass)

- [ ] `/api/health` returns 200 + `"version": "25.14"`
- [ ] CSP: no `unsafe-inline` in script-src on homepage/pricing
- [ ] `create-order` rejects request without valid session
- [ ] `verify-payment` rejects invalid Razorpay signature
- [ ] No report/download before verified payment
- [ ] Enterprise session cannot create Razorpay order
- [ ] Admin endpoints reject missing/invalid `ADMIN_API_KEY`
- [ ] Rate limits active on auth/admin/upload
- [ ] Webhook signature validation live
- [ ] No secrets in client JS or error responses

## P1 — Functional (must pass)

- [ ] `/pricing` returns 200 (not just pricing.html)
- [ ] `/features`, `/faq`, `/login.html`, `/dashboard.html` → 200
- [ ] Upload 25-item CSV → validation → preview → quote
- [ ] Upload 1000-item CSV → Business tier → checkout
- [ ] Upload 1001-item CSV → enterprise gate (no Razorpay)
- [ ] Razorpay test payment → verify → report generated
- [ ] Download HTML, PDF, DOCX, PPTX
- [ ] Magic link login → dashboard shows history
- [ ] Recover report flow works
- [ ] Repeat assessment from dashboard

## P2 — Customer journey

- [ ] Homepage shows 6-step journey strip
- [ ] Wizard progress bar + step guidance visible
- [ ] Drag-drop upload zone works
- [ ] Marketplace vs website boundary visible
- [ ] Enterprise warm messaging at >1000 items
- [ ] Owner confirms UX change vs old production

## P3 — Look & feel

- [ ] Logo loads on mobile
- [ ] Hero contrast acceptable
- [ ] No broken nav links
- [ ] Loading/error states friendly

## P4 — Commercial

- [ ] Order summary shows tax + total before checkout
- [ ] Razorpay amount matches server quote
- [ ] Refund policy linked from checkout path
- [ ] “From ₹199” or equivalent tier messaging

## Operations

- [ ] Admin portal: enterprise queue visible
- [ ] Audit events logging on upload/payment/download
- [ ] Diagnostics panel accessible to admin
- [ ] Uptime monitor on `/api/health`

## Infrastructure (post-launch hardening)

- [ ] CAA DNS records
- [ ] MTA-STS policy
- [ ] DMARC handling runbook
- [ ] HSTS verified

## Sign-off

| Role | Name | Date | GO / NO GO |
|------|------|------|------------|
| QA Director | | | |
| CISO | | | |
| CTO | | | |
| CEO | | | |

**Current status: 0/N checklist items verified on production (2026-06-27).**
