# STAGING E2E CHECKLIST — v25.10

*(Embedded in v25.13 staging validation — use before production)*

## Pre-flight

- [ ] Staging URL deployed (not production)
- [ ] Razorpay **test** keys configured
- [ ] `node scripts/staging-env-check.mjs` passes

## API Smoke

- [ ] `GET /api/health` → version 25.13
- [ ] `GET /api/pricing`
- [ ] Upload sample CSV via wizard
- [ ] `POST /api/order-quote`
- [ ] `POST /api/create-order`
- [ ] Complete Razorpay test payment
- [ ] `POST /api/verify-payment`
- [ ] Download each report format
- [ ] `POST /api/recover-reports` (recovery flow)
- [ ] Dashboard login + report list
- [ ] Webhook delivery (Razorpay dashboard → staging URL)

## Negative Cases

- [ ] Invalid payment signature rejected
- [ ] Duplicate verify idempotent
- [ ] Download blocked before payment
- [ ] 1001-row upload → enterprise gate (no Razorpay)

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| Ops | | |

See `STAGING-VALIDATION-REPORT-v25.13.md` for full details.
