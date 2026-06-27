# Test Checklist — v17.1 Production Hardening

## Pre-deploy

- [ ] `BLOB_READ_WRITE_TOKEN` set (Production, Preview)
- [ ] `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` set
- [ ] Optional: `ZOHO_SMTP_*` or `SMTP_*` for email
- [ ] Optional: `SITE_URL=https://aigovernancehub.ai`
- [ ] Run `npm install` in `aigovernancehub-website/` before deploy
- [ ] Deploy all v17.1 files atomically

## P0 Security

- [ ] Upload without Blob token → 503 (not silent /tmp)
- [ ] Direct `/starter-success.html` → unverified
- [ ] Fake confirmation token → blocked
- [ ] Download without token → 403
- [ ] Expired success token (>15 min) → 403
- [ ] Recovery token before payment → not issued
- [ ] Rate limit: rapid upload requests → 429
- [ ] Razorpay secret not in frontend bundle
- [ ] No localStorage unlock keys

## P1 Functional

- [ ] Valid CSV upload → preview
- [ ] Invalid file type → 400
- [ ] File > 5 MB → 400
- [ ] Unlock without upload → blocked
- [ ] Razorpay amount ₹199 (19900 paise)
- [ ] Payment success → download on success page
- [ ] Payment cancel → pending page, no download
- [ ] Browser close → recover by email works
- [ ] Recovery lists purchased reports only
- [ ] Download increments server-side count
- [ ] Email configured → confirmation sent
- [ ] Email not configured → payment still succeeds
- [ ] Idempotent verify (replay) → same result, no duplicate charge

## P2 User Journey

- [ ] Success page shows email status
- [ ] Recover My Report page works
- [ ] Pricing links to recovery
- [ ] Report includes frameworks + disclaimer

## P3 UI

- [ ] Mobile upload/checkout usable
- [ ] Recovery cards render correctly

## Post-deploy smoke

- [ ] `POST /api/upload-report` → 200 with preview
- [ ] `POST /api/recover-reports` → 200 (empty or list)
- [ ] Full end-to-end test payment (test keys)
