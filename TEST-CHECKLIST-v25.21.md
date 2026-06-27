# TEST CHECKLIST — v25.21

**Date:** 2026-06-27

---

## Automated (run before RC tag)

```powershell
Set-Location c:\Projects\ai-governance-hub\aigovernancehub-website
node scripts/run-all-tests.mjs
node scripts/full-round-test.mjs   # optional; known legacy failures
node scripts/journey-security-round.mjs
```

| Suite | v25.21 result |
|-------|---------------|
| enterprise-gate-test | ✅ 20/20 |
| launch-hardening-test | ✅ 25/25 |
| customer-journey-test | ✅ 20/20 |
| payment-architecture-test | ✅ 6/6 |
| production-audit-test | ✅ 20/20 |
| resilience-test | ✅ 26/26 |
| v25-workspace-test | ✅ 16/16 |
| v22-report-quality-test | ✅ 18/18 |
| operations-test | ✅ 29/29 |
| staging-validation-test | ✅ 17/17 |
| security-fix-test | ✅ 15/15 |
| performance-smoke-test | ✅ 6/6 |
| csp-hardening-test | ✅ 17/17 |
| accessibility-test | ✅ 32/32 |
| journey-security-round | ✅ 26/26 |

**Total: 15/15 suites PASSED**

---

## Manual security smoke (post-deploy)

- [ ] `/api/health` → version `25.21`, `securityPosture` present
- [ ] Upload >5 MB rejected before processing
- [ ] Upload `.exe` rejected
- [ ] Payment verify with bad signature → 400
- [ ] Download without token → 401/403
- [ ] Recover unknown email → generic success message
- [ ] Admin action without key → 401
- [ ] CSP: no inline script on pricing.html (view source)

---

## Customer journey

- [ ] Home → Pricing wizard → Upload sample CSV
- [ ] Preview shows governance score (locked fields)
- [ ] Razorpay test checkout completes
- [ ] Success page polls until report ready
- [ ] Download HTML + PDF
- [ ] Recover via email → dashboard lists report
- [ ] >1000 items triggers enterprise gate (no self-serve pay)

---

## Compliance

- [ ] Homepage does NOT imply SOC2/HIPAA/GDPR certification
- [ ] Trust Center "what we do not claim" intact
- [ ] Enterprise procurement FAQ honest on SOC 2

---

## Payment edge cases

- [ ] Interrupted payment → recover flow works
- [ ] Duplicate verify same payment_id → idempotent
- [ ] Different payment_id on verified order → 409
- [ ] Expired session at verify → error

---

## Enterprise

- [ ] Enterprise sales request creates audit event
- [ ] Admin can view enterprise queue
- [ ] Enterprise checkout uses separate token

---

## Operations

- [ ] `ALERT_WEBHOOK_URL` receives test alert (if configured)
- [ ] Admin operations dashboard loads metrics
- [ ] Audit events present for upload, verify, download

---

## Known non-regressions (full-round-test)

These fail due to **test expectation drift** or **production 404**, not v25.21 changes:

- Plan tier tests expect business_plus tiers; product gates at enterprise >1000
- Token test needs env bootstrap in full-round script
- Live health 404 until deploy

---

## Accessibility

Automated: 32/32 pass (skip links, lang, focus, ARIA live regions)

---

## Performance smoke

- Parse 1000 records: ~2ms (budget 8000ms) ✅
- Sanitize bulk CSV: ~1ms ✅

---

## Sign-off

| Role | Automated | Manual post-deploy |
|------|-----------|------------------|
| Engineering | ✅ | ⏳ |
| Security | ✅ | ⏳ |
| QA | ✅ | ⏳ |
