# DEPLOYMENT CHECKLIST — v25.9

## Pre-deploy

- [ ] Run all test suites (129+ checks)
- [ ] Set purpose-specific secrets (or APP_SIGNING_SECRET)
- [ ] Set `ALERT_WEBHOOK_URL` when alerting ready (optional)
- [ ] Configure Razorpay webhook URL

## Deploy

```powershell
Set-Location "c:\Projects\ai-governance-hub\aigovernancehub-website"
node scripts/operations-test.mjs
node scripts/resilience-test.mjs
node scripts/production-audit-test.mjs
vercel --prod
```

## Post-deploy verification

- [ ] `GET /api/health` → version 25.9, readiness ready/degraded
- [ ] Health does NOT expose storageBackend or config details
- [ ] Admin operations_dashboard returns metrics
- [ ] Test upload → quote → payment (staging keys)
- [ ] Verify structured logs appear in Vercel dashboard
- [ ] Webhook test event (Razorpay test mode)

## Rollback

- Promote previous Vercel deployment
- Secrets unchanged — rollback safe

## Backup verification

- [ ] Blob/S3 access confirmed via health probe write/read
- [ ] Retention env vars documented

## Secrets rotation post-deploy

See `OPERATIONS-HANDBOOK-v25.9.md` and v25.8 runbook.
