# DEPLOYMENT CHECKLIST — v25.13

## Pre-Deploy

- [ ] Run `node scripts/run-all-tests.mjs` — all suites pass
- [ ] Run `node scripts/staging-env-check.mjs` on staging env
- [ ] Confirm Razorpay **test mode** keys on staging, **live** keys only on production
- [ ] Purpose-specific secrets set (not only `APP_SIGNING_SECRET`)
- [ ] `SITE_URL` matches deployed domain (HTTPS)
- [ ] `BLOB_READ_WRITE_TOKEN` valid for Vercel Blob store

## Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `RAZORPAY_KEY_ID` | Checkout |
| `RAZORPAY_KEY_SECRET` | API + payment HMAC |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification |
| `BLOB_READ_WRITE_TOKEN` | Report/storage |
| `ADMIN_API_KEY` | Admin portal |
| `SITE_URL` | Links, callbacks |
| `SESSION_TOKEN_SECRET` | Session tokens |
| `DOWNLOAD_TOKEN_SECRET` | Download tokens |
| `RECOVERY_TOKEN_SECRET` | Report recovery |
| `AUTH_TOKEN_SECRET` | Magic link auth |
| `ENTERPRISE_TOKEN_SECRET` | Enterprise pay tokens |
| `RATE_LIMIT_SECRET` | Rate limit hashing |
| SMTP vars | Email delivery |

## Post-Deploy Smoke

- [ ] `GET /api/health` → version **25.13**
- [ ] `GET /api/pricing` → plans returned
- [ ] Upload sample CSV (≤50 items) → quote → test payment (staging)
- [ ] Admin login with `ADMIN_API_KEY`
- [ ] Operations dashboard loads

## Do NOT

- Deploy to production automatically from this sprint
- Commit `.env` files
- Use Razorpay live keys on staging

## Package

```
node scripts/package-v25.13.mjs
```

Output: `aigovernancehub-website-v25.13-production-readiness.zip`
