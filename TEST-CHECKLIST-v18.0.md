# Test Checklist — v18.0 Commercial Launch

**Date:** 2026-06-27  
**Rule:** Testing only — no code changes during this phase.

## P0 — Security

- [ ] Confirm no `RAZORPAY_KEY_SECRET` in frontend bundle or HTML
- [ ] Tampered Razorpay signature rejected by `/api/verify-payment`
- [ ] Download without valid token returns 403
- [ ] Download with `downloadDisabled: true` returns 403
- [ ] Dashboard without cookie returns 401 → redirect to login
- [ ] Admin APIs without Bearer token return 403
- [ ] Magic link expired after 15 minutes
- [ ] Rate limit returns 429 after threshold
- [ ] `/api/health` does not expose secrets
- [ ] Cookies: HttpOnly, Secure (prod), SameSite

## P1 — Functional

### Checkout flow
- [ ] Upload CSV → preview stats displayed
- [ ] Create order → Razorpay modal opens (19900 paise INR)
- [ ] Successful payment → success page + confirmation token
- [ ] Download report HTML/TXT
- [ ] Recovery by email returns reports

### Accounts
- [ ] Magic link email received (if SMTP configured)
- [ ] Magic link sign-in sets cookie
- [ ] Dashboard lists purchased reports
- [ ] Invoice download works for verified payment
- [ ] Sign out clears session

### Admin
- [ ] Search by buyer email
- [ ] Search by order ID / payment ID / session ID
- [ ] Resend email action
- [ ] Disable download blocks customer download
- [ ] Delete expired removes report record
- [ ] Analytics summary loads

### Pricing / i18n
- [ ] `/api/pricing` returns currencies
- [ ] UI prices update from API (no hardcoded-only path)
- [ ] Checkout amount remains ₹199 INR

## P2 — User journey

- [ ] Login → dashboard → download is intuitive
- [ ] Recover without login still works
- [ ] Pricing page funnel: upload → preview → pay
- [ ] Error messages are user-safe (no stack traces)
- [ ] Support links reachable from all key pages

## P3 — UI / SEO

- [ ] Skip link visible on keyboard focus
- [ ] FAQ, Features, Case Study pages load
- [ ] `sitemap.xml` validates
- [ ] `robots.txt` blocks private pages
- [ ] Open Graph tags on index and pricing
- [ ] Lighthouse audit (manual): Performance > 95 target

## Monitoring

- [ ] `/api/health` returns storage + razorpay flags
- [ ] Correlation ID header present on API responses
- [ ] Analytics events appear in admin summary after checkout

## Verdict template

| Area | Verdict |
|------|---------|
| Overall | |
| P0 Security | |
| P1 Functional | |
| P2 User Journey | |
| P3 UI | |
