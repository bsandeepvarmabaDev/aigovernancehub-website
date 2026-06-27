# DEPLOY — v25.6 (PowerShell)

Run from repository root. **Do not deploy until staging verification is complete.**

## Prerequisites

```powershell
# Verify Node and Vercel CLI
node --version
vercel --version
```

## Run regression tests

```powershell
Set-Location "c:\Projects\ai-governance-hub\aigovernancehub-website"

node scripts/enterprise-gate-test.mjs
node scripts/launch-hardening-test.mjs
node scripts/customer-journey-test.mjs
node scripts/payment-architecture-test.mjs
```

## Package release artifact

```powershell
node scripts/package-v25.6.mjs
# Output: aigovernancehub-website-v25.6.zip
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
# Expect: version "25.6", status "ok" when env configured
```

## Required environment variables (unchanged)

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `BLOB_READ_WRITE_TOKEN` (or configured storage)
- `ADMIN_API_KEY`
- `SITE_URL`
- Optional: SMTP for email delivery
