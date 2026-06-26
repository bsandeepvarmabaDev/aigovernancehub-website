# Deployment Checklist — v16.5.2 Production Remediation

## Pre-deploy

- [ ] Confirm local/GitHub contains all seven modified files at v16.5.2
- [ ] Commit and push to `main` (single atomic commit)
- [ ] Verify Vercel project linked to `bsandeepvarmabaDev/aigovernancehub-website`
- [ ] Verify production branch is `main`
- [ ] Confirm `RAZORPAY_KEY_ID` is set (format `rzp_live_...` or `rzp_test_...`, no spaces)
- [ ] Confirm `RAZORPAY_KEY_SECRET` is set (trimmed, no quotes)
- [ ] Razorpay dashboard: account active, live mode enabled for production keys

## Deploy

- [ ] Trigger production deployment from v16.5.2 commit
- [ ] Wait for build success (no failed steps)
- [ ] Confirm `/api/create-order` and `/api/verify-payment` routes in deployment output

## Post-deploy verification (run PowerShell commands in `VERIFY-v16.5.2.ps1`)

- [ ] All seven files show `v16.5.2` version marker in production HTML/JS
- [ ] Homepage shows ₹199, not ₹499
- [ ] `POST /api/create-order` returns 200 (not 502/503)
- [ ] Response `amount` is `19900`
- [ ] Hero button scrolls to `#starter-checkout-form`
- [ ] `/starter-success.html` shows unverified message (no query param)
- [ ] `/starter-pending.html` has Retry Payment → `#starter-checkout-form`
- [ ] No `jiraSite` in verify-payment errors for name+email+signature test

## Rollback

- [ ] Note previous deployment ID in Vercel before promoting v16.5.2
- [ ] If checkout fails post-deploy, rollback and check Vercel function logs for Razorpay HTTP status
