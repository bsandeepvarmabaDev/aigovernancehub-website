# DEPLOY — v25.7 (PowerShell)

Run from repository root. **Do not deploy until staging verification is complete.**

## Prerequisites

```powershell
node --version
vercel --version
```

## Run regression + audit tests

```powershell
Set-Location "c:\Projects\ai-governance-hub\aigovernancehub-website"

node scripts/production-audit-test.mjs
node scripts/enterprise-gate-test.mjs
node scripts/launch-hardening-test.mjs
node scripts/customer-journey-test.mjs
node scripts/payment-architecture-test.mjs
```

## Package release artifact

```powershell
node scripts/package-v25.7.mjs
# Output: aigovernancehub-website-v25.7.zip
```

## Deploy to Vercel (preview)

```powershell
Set-Location "c:\Projects\ai-governance-hub\aigovernancehub-website"
vercel
```

## Deploy to production (after approval)

```powershell
Set-Location "c:\Projects\ai-governance-hub\aigovernancehub-website"
vercel --prod
```

## Post-deploy smoke check

```powershell
$base = "https://aigovernancehub.ai"  # or preview URL
Invoke-RestMethod "$base/api/health" | ConvertTo-Json
# Expect: version "25.7", status "ok" when env configured
```

## Staging payment verification (manual)

After deploy to preview with live Razorpay test keys:

1. Upload ≤1000-item CSV → checkout → complete test payment.
2. Confirm verify-payment succeeds and download works.
3. Attempt verify with wrong signature → must fail.
4. Attempt recover-reports with known email → must receive magic link, no inline tokens.

## Required environment variables (unchanged)

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `BLOB_READ_WRITE_TOKEN` (or configured storage)
- `ADMIN_API_KEY`
- `SITE_URL`
- SMTP (`ZOHO_SMTP_*` or `SMTP_*`) for recovery magic links and delivery emails
