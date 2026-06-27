# Test Checklist — v21.0 Commercial SaaS

**Rule:** Test only — no code changes during testing.

## P0 — Security

- [ ] Order quote total matches Razorpay checkout amount exactly
- [ ] create-order rejects without `orderConfirmed: true`
- [ ] create-order returns 403 for enterprise upload
- [ ] verify-payment rejects mismatched pending order ID
- [ ] HMAC tamper rejected
- [ ] No pricing secrets in frontend bundle

## P1 — Functional

### Plans
- [ ] 5-item upload → Starter plan + ₹199 quote
- [ ] 100-item upload → Professional plan + ₹599 quote
- [ ] 1000-item upload → Business plan
- [ ] 10000-item upload → Business Plus or Enterprise
- [ ] Enterprise upload → sales gate, no checkout

### Order summary
- [ ] Base + fee + tax = total displayed
- [ ] Currency switch updates quote from API
- [ ] Checkbox required before payment

### End-to-end
- [ ] Upload → preview → pay → verify → download → email → recover

## P2 — Commercial

- [ ] Homepage answers product questions
- [ ] Trust Center accessible
- [ ] FAQ has 30 entries
- [ ] Plan recommendation explains WHY

## P3 — UI

- [ ] Professional enterprise copy (no developer jargon)
- [ ] Order summary readable
- [ ] Enterprise gate shows benefits

## Verdict template

| Area | Verdict |
|------|---------|
| Overall | |
| P0 Security | |
| P1 Functional | |
| P2 Commercial | |
| P3 UI | |
