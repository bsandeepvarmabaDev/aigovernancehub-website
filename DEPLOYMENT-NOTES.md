# AI Governance Hub Website — Vercel Deployment Notes (v16.4)

## Overview

The website is a static site with two Vercel Serverless Functions for secure Razorpay checkout:

- `POST /api/create-order` — creates a Razorpay order server-side
- `POST /api/verify-payment` — verifies payment signature server-side before onboarding

The Razorpay **Key Secret** is never stored in the repository or frontend. It is configured only as a Vercel environment variable.

## Vercel environment variables

In the Vercel project dashboard, go to **Settings → Environment Variables** and add:

| Variable | Value | Environments |
|----------|-------|--------------|
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID (public), e.g. `rzp_live_xxxxx` or `rzp_test_xxxxx` | Production, Preview, Development |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret | Production, Preview, Development |

Example (placeholders only — use your real values in Vercel, never in git):

```
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

**Never commit `RAZORPAY_KEY_SECRET` to the repository.**

After adding or changing environment variables, redeploy the project so serverless functions receive the updated values.

## Deploy to Vercel

### Option A — Vercel CLI

1. Install the Vercel CLI: `npm i -g vercel`
2. From the website root (`aigovernancehub-website/`):
   ```bash
   vercel
   ```
3. Set the project root to `aigovernancehub-website` when prompted.
4. Add environment variables in the Vercel dashboard (or via `vercel env add`).
5. Deploy to production:
   ```bash
   vercel --prod
   ```

### Option B — GitHub integration

1. Connect the repository to Vercel.
2. Set **Root Directory** to `aigovernancehub-website`.
3. Framework Preset: **Other** (static site + serverless functions).
4. Build Command: leave empty (no build step required).
5. Output Directory: `.` (project root).
6. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in project environment variables.
7. Deploy.

## Local development

1. Install Vercel CLI.
2. From `aigovernancehub-website/`:
   ```bash
   vercel env pull .env.local
   vercel dev
   ```
3. Open the local URL shown by `vercel dev` and test `pricing.html`.

Use Razorpay **test** keys in local/preview environments. Use **live** keys only in production.

## Security checklist

- Key Secret is used only in `api/create-order.js` and `api/verify-payment.js` via `process.env.RAZORPAY_KEY_SECRET`
- Frontend receives only `keyId` and `orderId` from `/api/create-order`
- Payment success redirects to `starter-success.html` only after `/api/verify-payment` returns `success: true`
- No `localStorage` payment gating
- No PDF or report unlock on the website

## Custom domain

Point `aigovernancehub.ai` to the Vercel project in **Settings → Domains**. Ensure SSL is enabled (automatic on Vercel).
