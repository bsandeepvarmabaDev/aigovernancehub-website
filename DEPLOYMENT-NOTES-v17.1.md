# Deployment Notes — v17.1 Production Hardening

## Overview

Static site + Vercel Serverless Functions. **Persistent storage is mandatory** in production. There is **no `/tmp` fallback**.

## Required environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | **Yes** (preferred) | Vercel Blob read/write token |
| `RAZORPAY_KEY_ID` | **Yes** | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | **Yes** | Razorpay secret (server only) |

### Alternative: AWS S3

| Variable | Required |
|----------|----------|
| `AWS_S3_BUCKET` | Yes |
| `AWS_ACCESS_KEY_ID` | Yes |
| `AWS_SECRET_ACCESS_KEY` | Yes |
| `AWS_REGION` | Recommended |

If neither Blob nor S3 is configured, all storage-dependent APIs return **503**.

## Optional environment variables

| Variable | Purpose |
|----------|---------|
| `SITE_URL` | Base URL for email links (default: `https://aigovernancehub.ai`) |
| `ZOHO_SMTP_HOST` | SMTP host (default: `smtp.zoho.com`) |
| `ZOHO_SMTP_PORT` | SMTP port (default: `465`) |
| `ZOHO_SMTP_USER` | SMTP username |
| `ZOHO_SMTP_PASS` | SMTP password |
| `ZOHO_SMTP_FROM` | From address |
| `SMTP_*` | Generic SMTP fallback aliases |

Email failure does **not** block payment or download.

## Install dependencies

From `aigovernancehub-website/`:

```bash
npm install
```

Commit `package.json` and `package-lock.json`. Vercel installs dependencies automatically for serverless functions.

## Vercel Blob setup

1. Vercel Dashboard → Storage → Create Blob store
2. Connect to project — `BLOB_READ_WRITE_TOKEN` is auto-provisioned
3. Redeploy after adding token

## Deploy checklist

1. Set all required env vars for Production and Preview
2. Run `npm install` locally and commit lockfile
3. Deploy all files atomically (including `api/lib/`, `recover-report.html`, `package.json`)
4. Verify `/api/upload-report` returns 200 (not 503)
5. Run test payment with Razorpay test keys
6. Verify recovery flow on `recover-report.html`

## API routes

| Route | Method |
|-------|--------|
| `/api/upload-report` | POST |
| `/api/generate-preview` | POST |
| `/api/create-order` | POST |
| `/api/verify-payment` | POST |
| `/api/download-report` | POST |
| `/api/recover-reports` | POST |

## Function config

`vercel.json`: 256 MB memory, 30s max duration for `api/*.js`.

## Security reminders

- Never commit secrets
- Use test keys in Preview; live keys in Production only
- Monitor Vercel function logs for 503 storage errors
- Review audit objects in Blob at `audit/{orderId}.json`

## Rollback

If issues occur, rollback to previous deployment. Reports already stored in Blob remain available for recovery.
