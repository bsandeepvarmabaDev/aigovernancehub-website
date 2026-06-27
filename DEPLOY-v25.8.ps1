# DEPLOY — v25.8 (PowerShell)

## Run all tests

```powershell
Set-Location "c:\Projects\ai-governance-hub\aigovernancehub-website"

node scripts/resilience-test.mjs
node scripts/production-audit-test.mjs
node scripts/launch-hardening-test.mjs
node scripts/enterprise-gate-test.mjs
node scripts/customer-journey-test.mjs
node scripts/payment-architecture-test.mjs
```

## Package

```powershell
node scripts/package-v25.8.mjs
```

## Deploy

```powershell
vercel          # preview
vercel --prod   # production
```

## Post-deploy

```powershell
Invoke-RestMethod "https://aigovernancehub.ai/api/health" | ConvertTo-Json
# Expect version "25.8"
```

## New environment variables (v25.8)

| Variable | Purpose |
|----------|---------|
| `APP_SIGNING_SECRET` | Fallback app signing (optional if purpose secrets set) |
| `SESSION_TOKEN_SECRET` | Upload session tokens |
| `DOWNLOAD_TOKEN_SECRET` | Success + recovery download tokens |
| `ENTERPRISE_TOKEN_SECRET` | Enterprise payment link tokens |
| `RATE_LIMIT_SECRET` | Rate limit bucket hashing |
| `AUTH_TOKEN_SECRET` | Magic link + auth session |
| `ANALYTICS_HASH_SECRET` | Email index + analytics hashing |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook HMAC (recommended) |
| `PENDING_CHECKOUT_HOURS` | Checkout TTL (default 24) |
| `RETENTION_REPORT_DAYS` | Report retention (default 90) |
| `RETENTION_SESSION_DAYS` | Session retention (default 1) |
| `RETENTION_AUDIT_DAYS` | Audit log retention (default 365) |

Configure Razorpay dashboard webhook URL: `https://aigovernancehub.ai/api/razorpay-webhook`

Events: `payment.captured`, `payment.failed`, `refund.processed`
