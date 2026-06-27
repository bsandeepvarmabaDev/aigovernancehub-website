# Deployment Guide — v18.0 Commercial Launch

**Date:** 2026-06-27  
**Platform:** Vercel (recommended)

## Prerequisites

- Vercel project linked to repository
- Razorpay live/test keys
- Vercel Blob store (or AWS S3 equivalent env)
- SMTP credentials (Zoho or generic)
- Custom domain `aigovernancehub.ai` with HTTPS

## Environment variables

```bash
# Required
BLOB_READ_WRITE_TOKEN=vercel_blob_...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Strongly recommended
SITE_URL=https://aigovernancehub.ai
ADMIN_API_KEY=<32+ byte random secret>

# Email (magic links + report delivery)
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=465
ZOHO_SMTP_USER=support@aigovernancehub.ai
ZOHO_SMTP_PASS=...
ZOHO_SMTP_FROM=support@aigovernancehub.ai
```

## Deploy steps

1. Install dependencies: `npm install`
2. Set all environment variables in Vercel dashboard
3. Deploy: `vercel --prod` (or push to production branch)
4. Verify health: `GET https://aigovernancehub.ai/api/health`
5. Smoke test: upload → preview → test payment → download
6. Test magic link sign-in with production SMTP
7. Test admin portal with `ADMIN_API_KEY`

## Post-deploy verification

| Check | Expected |
|-------|----------|
| `/api/health` | `{ ok: true, storage: true, razorpay: true }` |
| `/api/pricing` | JSON with `selected.amountDisplay` |
| Upload without Blob token | 503 (should not happen in prod) |
| HSTS header | Present on HTML and API |
| Sitemap | `https://aigovernancehub.ai/sitemap.xml` |

## Rollback

- Revert to v17.1 deployment tag in Vercel
- Blob data is forward-compatible; no migration required

## Do not

- Commit `.env` or secrets to git
- Expose `ADMIN_API_KEY` in client-side code
- Change Razorpay amount without product approval

## Package

Deploy from `aigovernancehub-website-v18.0-commercial-launch.zip` or git tag `v18.0`.
