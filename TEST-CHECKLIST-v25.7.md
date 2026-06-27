# TEST CHECKLIST — v25.7

**Release:** v25.7 Independent Production Audit  
**Date:** 2026-06-27

---

## Automated (run before deploy)

```powershell
Set-Location "c:\Projects\ai-governance-hub\aigovernancehub-website"
node scripts/production-audit-test.mjs      # 17/17
node scripts/launch-hardening-test.mjs      # 25/25
node scripts/enterprise-gate-test.mjs       # 20/20
node scripts/payment-architecture-test.mjs # 6/6
node scripts/customer-journey-test.mjs      # 14/14
```

- [ ] All 82 automated checks pass

---

## P0 Security (manual staging)

### Payment
- [ ] Upload valid CSV (≤1000 items) → preview → order summary → Razorpay test payment
- [ ] verify-payment returns confirmationToken + downloadReady
- [ ] POST verify with invalid signature → 400 "Payment verification failed"
- [ ] POST verify with valid order/payment but wrong sessionId → 400
- [ ] Attempt download-report before verify → blocked
- [ ] Replay verify with fake signature on known order → blocked (v25.7)

### Recovery
- [ ] POST recover-reports with purchased email → no `recoveryToken` in JSON
- [ ] Magic link email received (SMTP configured)
- [ ] Sign in via link → dashboard shows reports
- [ ] recover-reports uniform message for unknown email

### Enterprise
- [ ] Upload 1001+ items → enterprise gate, no checkout
- [ ] Sales request → admin quote → enterprise payment link
- [ ] Enterprise verify with custom amount mismatch → blocked

---

## Upload edge cases

- [ ] Empty CSV → graceful error
- [ ] Invalid encoding → graceful error
- [ ] Duplicate Issue Keys → counted, not crashed
- [ ] Missing required columns → validation issues
- [ ] ZIP renamed to .csv → generic parse error (no stack trace)

---

## API hygiene

- [ ] GET /api/health → version 25.7, no storageBackend in body
- [ ] 405 on wrong HTTP methods
- [ ] 429 after rate limit exceeded (recover-reports)
- [ ] Admin endpoints reject missing/wrong ADMIN_API_KEY

---

## Customer journey

- [ ] Homepage: what / why / how / trust clear
- [ ] pricing.html: commercial clarity panel visible
- [ ] recover-report.html: email verification copy
- [ ] trust-center, security-policy, support links work
- [ ] Sample files downloadable

---

## Mobile smoke

- [ ] pricing wizard usable on iPhone width
- [ ] recover form submit on Android
- [ ] dashboard downloads on tablet

---

## Commercial

- [ ] Order summary shows plan, tax, total before pay
- [ ] No Stripe references in UI
- [ ] Enterprise contact path clear

---

## Post-deploy

- [ ] Production health check version 25.7
- [ ] Smoke payment with Razorpay test mode
- [ ] Audit log entry for test order

---

## Sign-off

| Role | Name | Date | Pass |
|------|------|------|------|
| Engineering | | | |
| Security | | | |
| Operations | | | |
