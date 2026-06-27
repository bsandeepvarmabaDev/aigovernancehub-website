# TEST CHECKLIST — v25.6

## Priority order

1. P0 Security  
2. P1 Functional  
3. P2 Customer confidence  
4. P3 Commercial  
5. P4 Enterprise  

## Automated regression

```bash
node scripts/enterprise-gate-test.mjs
node scripts/launch-hardening-test.mjs
node scripts/customer-journey-test.mjs
node scripts/payment-architecture-test.mjs
```

## Enterprise company review (manual)

- [ ] Homepage company section readable
- [ ] Nav: all 10 destinations reachable in ≤2 clicks
- [ ] Pricing commercial clarity panel complete
- [ ] Privacy: 90-day retention stated
- [ ] Security: website assessment section present
- [ ] Support: enterprise + payment + recovery sections
- [ ] Footers consistent across pages

## Security (no regressions)

- [ ] All automated suites pass
- [ ] No API files modified in v25.6

## Sign-off

| Role | Approved |
|------|----------|
| Security | ☐ |
| Product | ☐ |
| Sales | ☐ |
