# TEST CHECKLIST — v26.0 Launch Certification

Rank: **P0 Security → P1 Journey → P2 Trust → P3 Performance → P4 Polish**

## Automated (run before release)

```bash
node scripts/enterprise-gate-test.mjs      # 20 tests
node scripts/launch-hardening-test.mjs     # 25 tests
node scripts/customer-journey-test.mjs     # 9 tests
node scripts/payment-architecture-test.mjs # 6 tests
```

## Manual E2E (staging + Razorpay test mode)

| # | Scenario | Pass | Screenshot |
|---|----------|------|------------|
| 1 | 25 items → Starter checkout | ☐ | |
| 2 | 500 items → Professional quote | ☐ | |
| 3 | 1000 items → Business checkout | ☐ | |
| 4 | 1001 items → Enterprise Assessment | ☐ | |
| 5 | International currency (USD/EUR) | ☐ | |
| 6 | Payment cancelled → retry | ☐ | |
| 7 | Payment success → all formats download | ☐ | |
| 8 | Duplicate issue keys flagged | ☐ | |
| 9 | Corrupted CSV → friendly error | ☐ | |
| 10 | .docx upload → unsupported format error | ☐ | |

## Security validation

- [ ] Server-side pricing unchanged
- [ ] Tamper fields rejected on create-order
- [ ] Report download blocked before payment
- [ ] Admin portal 401 without key
- [ ] Enterprise gate at 1001 items

## UX / accessibility

- [ ] Wizard steps announce current step (screen reader)
- [ ] Dashboard tabs keyboard navigable
- [ ] Mobile portrait pricing wizard usable
- [ ] Mobile landscape dashboard tabs wrap OK
- [ ] FAQ skip link works

## Trust pages

- [ ] Refund policy linked from order summary
- [ ] support@ and sales@ reachable from FAQ
- [ ] Trust Center accessible from footer

## Screenshots captured (static)

- [x] `docs/screenshots/v26/02-sample-files.png`
- [x] `docs/screenshots/v26/03-faq.png`
- [ ] Payment flow (requires live test)
- [ ] Enterprise gate with metrics (requires upload)

## Sign-off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Product | | | ☐ |
| Engineering | | | ☐ |
| Sales | | | ☐ |
