# Re-test checklist — v25.23

## Health & version

- [ ] `GET /api/health` → HTTP **200**, `"version": "25.23"`
- [ ] Under 5 rapid health probes → no spurious **503** when storage writable
- [ ] `signedDownloads: true` when `APP_SIGNING_SECRET` or `DOWNLOAD_TOKEN_SECRET` set
- [ ] `email: not_configured` does not flip health to unavailable

## Security (fail closed)

- [ ] Fake Razorpay signature → **400**
- [ ] Fake download token → **403**
- [ ] Unsigned webhook → **400**
- [ ] XSS CSV upload → **400**
- [ ] >5 MB upload → **400**

## Self-serve journey (≤1,000 items)

- [ ] Upload sample Jira CSV → preview with work item counts
- [ ] Order quote → INR totals display correctly (e.g. ₹999 base, not ₹99900)
- [ ] Create order → Razorpay order ID returned
- [ ] Cancel payment → no success page / no downloads
- [ ] **Live payment test** → verify-payment **200** → success page → HTML/PDF/DOCX/PPTX download

## Enterprise (>1,000 items)

- [ ] Upload 1,001+ items → `enterpriseGate: true`
- [ ] Create order → **403**
- [ ] `POST /api/enterprise-sales-request` → **200** with Request ID
- [ ] `POST /api/enterprise-request-status` → **200** with status
- [ ] Without SMTP → message states request saved, email not sent

## Email (with/without SMTP)

- [ ] Magic link without SMTP → **200**, `emailConfigured: false`, no **500**
- [ ] Recover reports without SMTP → helpful fallback message
- [ ] With SMTP → email received (magic link / recovery)

## Auth rewrites

- [ ] `POST /api/auth-magic-link` → works via rewrite to customer-email
- [ ] `POST /api/recover-reports` → works via rewrite
- [ ] `GET /api/auth-session` → **401** without cookie
- [ ] `POST /api/auth-verify` → **400** invalid token

## UX

- [ ] No visible word "Candidates" on pricing/dashboard
- [ ] Success page lists all report format download buttons when ready
- [ ] Currency selector shows INR when pricing API unavailable
