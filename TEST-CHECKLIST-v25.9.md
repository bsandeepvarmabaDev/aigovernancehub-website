# TEST CHECKLIST — v25.9

## Automated

```powershell
node scripts/operations-test.mjs      # 18
node scripts/resilience-test.mjs      # 26
node scripts/production-audit-test.mjs # 20
node scripts/launch-hardening-test.mjs # 25
node scripts/enterprise-gate-test.mjs  # 20
node scripts/customer-journey-test.mjs # 14
node scripts/payment-architecture-test.mjs # 6
```

## Operational scenarios (staging)

- [ ] Health returns services without internal details
- [ ] Admin operations_dashboard loads
- [ ] Admin auth failure increments counter (wrong key test)
- [ ] Upload generates audit session events
- [ ] Payment verify records timing metric
- [ ] Duplicate webhook ignored
- [ ] retry_generation admin action
- [ ] resend_email after SMTP restore
- [ ] Rate limit returns 429 and increments counter

## Sign-off

| Role | Pass |
|------|------|
| SRE | |
| Security | |
| Engineering | |
