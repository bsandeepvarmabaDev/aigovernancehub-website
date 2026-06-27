# TEST CHECKLIST — v25.5 Enterprise Launch Review

## Automated

```bash
node scripts/enterprise-gate-test.mjs
node scripts/launch-hardening-test.mjs
node scripts/customer-journey-test.mjs
node scripts/payment-architecture-test.mjs
```

## Enterprise trust review (manual)

- [ ] Homepage: security card explains upload handling
- [ ] Trust Center: confidential upload + audit sections readable
- [ ] Features: navigation and footer present
- [ ] Refund policy: procurement can find timelines
- [ ] Support: no internal "Marketplace listing" language
- [ ] Pricing upload step: Trust Center link works
- [ ] Enterprise checkout: refund + support visible

## Security (no regressions)

- [ ] 1001 items → enterprise gate
- [ ] Tamper fields rejected
- [ ] Admin 401 without key

## Staging E2E

- [ ] 25 / 500 / 1000 item self-service
- [ ] Payment success → all formats
- [ ] Enterprise contact → Request ID

## Sign-off

| Reviewer role | Approved |
|---------------|----------|
| Security | ☐ |
| Product | ☐ |
| Sales | ☐ |
