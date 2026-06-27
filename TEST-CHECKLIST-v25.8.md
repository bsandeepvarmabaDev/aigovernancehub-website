# TEST CHECKLIST — v25.8

## Automated (111 tests)

```powershell
Set-Location "c:\Projects\ai-governance-hub\aigovernancehub-website"
node scripts/resilience-test.mjs           # 26
node scripts/production-audit-test.mjs     # 20
node scripts/launch-hardening-test.mjs     # 25
node scripts/enterprise-gate-test.mjs      # 20
node scripts/customer-journey-test.mjs     # 14
node scripts/payment-architecture-test.mjs # 6
```

- [ ] 111/111 pass

## Staging manual

### Payment resilience
- [ ] Complete payment → verify → download
- [ ] Refresh success page → idempotent verify works
- [ ] Expired pendingCheckout rejected
- [ ] Webhook duplicate ignored (replay same event)

### Failure recovery
- [ ] Simulate SMTP off → payment succeeds, emailError set
- [ ] Admin resend_email succeeds after SMTP restored
- [ ] Admin retry_generation on failed report

### Security
- [ ] Rate limit returns 503 when RATE_LIMIT_SECRET unset (preview env test)
- [ ] Download blocked while reportStatus=generating
- [ ] Refunded report returns 410

### Enterprise
- [ ] 1001+ gate unchanged
- [ ] Enterprise payment link + verify

## Sign-off

| Role | Date | Pass |
|------|------|------|
| Engineering | | |
| SRE | | |
| Security | | |
