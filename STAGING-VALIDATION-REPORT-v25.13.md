# STAGING VALIDATION REPORT — v25.13

**Verdict:** **READY for staging deploy** (scripts + static validation complete; live smoke requires `STAGING_URL`)

## v25.10 Deliverables

| Artifact | Path |
|----------|------|
| Env check script | `scripts/staging-env-check.mjs` |
| Validation test suite | `scripts/staging-validation-test.mjs` |
| E2E checklist | See TEST-CHECKLIST-v25.13.md § Staging |

## Environment Validation

Run on staging:

```powershell
node scripts/staging-env-check.mjs
```

Validates: Razorpay keys, webhook secret, blob token, admin key, site URL, purpose secrets, SMTP.

## API Route Coverage (static)

All required routes present:

- `/api/health`, `/api/pricing`, `/api/upload-report`, `/api/order-quote`
- `/api/create-order`, `/api/verify-payment`, `/api/download-report`
- `/api/recover-reports`, `/api/dashboard`, `/api/razorpay-webhook`

## Razorpay Test-Mode Flow (manual staging)

| Case | Expected |
|------|----------|
| Order create | Order ID returned, amount matches server quote |
| Payment success | verify-payment → paid, reports queued |
| Invalid signature | 400/403, no state change |
| Duplicate verify | Idempotent — no double fulfillment |
| Webhook replay | Idempotent |
| Cancelled/failed | Terminal payment state, no download |

## Enterprise Gate (automated + manual)

- 1000 items: self-serve checkout available
- 1001 items: enterprise gate, no Razorpay order
- Enterprise request created, sales email path

## Report Flow

- HTML, PDF, DOCX, PPTX generation after verified payment
- Download blocked before payment (403)
- Download allowed after verify

## Live Smoke (optional)

```powershell
$env:STAGING_URL = "https://your-staging.vercel.app"
node scripts/staging-validation-test.mjs
```

## Open Items

- Full Razorpay test-mode E2E requires deployed staging + test keys
- Webhook replay test requires ngrok or Vercel staging URL in Razorpay dashboard
