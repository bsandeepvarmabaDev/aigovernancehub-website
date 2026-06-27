# TEST CHECKLIST — v25.3 Launch Hardening

Rank findings: **P0 Security → P1 Functional → P2 Customer Journey → P3 UI**

## Automated scripts

```bash
node scripts/enterprise-gate-test.mjs
node scripts/payment-architecture-test.mjs
node scripts/launch-hardening-test.mjs
```

## P0 — Security

- [ ] 50 / 500 / 1000 items → self-service (automated)
- [ ] 1001 / 5000 items → enterprise gate (automated)
- [ ] Duplicate issue keys detected (automated)
- [ ] Client task count / price fields rejected (automated)
- [ ] Stripe files absent (automated)
- [ ] Admin portal 401 without key (manual)
- [ ] Report download before payment blocked (manual)

## P1 — Functional

- [ ] Self-service E2E: upload → checkout → verify → report
- [ ] Order total matches Razorpay amount
- [ ] Enterprise auto-request >1000 items
- [ ] Admin payment link → enterprise checkout → reports

## P2 — Customer journey

- [ ] Enterprise gate shows metrics, request ID, sales email
- [ ] Order confirmation checkbox before Secure Checkout

## P3 — UI

- [ ] Primary CTA: "Secure Checkout"
