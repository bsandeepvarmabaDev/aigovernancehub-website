# Test Checklist — v17.0 Upload → Preview → Pay → Download

## Pre-deploy

- [ ] `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` set in Vercel
- [ ] All v17.0 files deployed atomically (including `api/lib/`)
- [ ] `vercel.json` function memory/duration applied

## Upload & preview (no payment)

- [ ] Open `pricing.html`
- [ ] Upload valid CSV with AI-related rows
- [ ] Preview shows: total records, AI candidates, high/medium/low risk, governance score
- [ ] Full report section shows "locked" state
- [ ] Unlock button disabled until upload succeeds
- [ ] Upload empty file → error shown
- [ ] Upload file > 5 MB → error shown
- [ ] Upload unsupported extension → error shown

## Payment gate

- [ ] Click Unlock without upload → blocked with message
- [ ] Click Unlock without name/email → validation error
- [ ] `POST /api/create-order` without session → 400
- [ ] Razorpay opens with amount **₹199** (19900 paise)

## Payment success

- [ ] Complete test payment
- [ ] Redirect to `starter-success.html?confirmation=...`
- [ ] Success page shows unverified until token validates
- [ ] After validation: Download Report button visible
- [ ] Click Download Report → HTML file downloads
- [ ] Click Download Text Version → TXT file downloads
- [ ] Report contains scan summary and AI candidate inventory

## Payment failure / cancel

- [ ] Cancel Razorpay modal → `starter-pending.html`
- [ ] Pending page has Retry Payment link
- [ ] No download available from pending page
- [ ] Failed payment → pending page, no report

## Security (must pass)

- [ ] Direct `/starter-success.html` (no query) → unverified, no download
- [ ] `/starter-success.html?confirmation=fake` → unverified, no download
- [ ] `POST /api/download-report` without token → 403
- [ ] `POST /api/download-report` with expired/invalid token → 403
- [ ] No localStorage/sessionStorage unlock keys used
- [ ] Browser devtools cannot enable download without server token

## API smoke tests

- [ ] `POST /api/upload-report` → 200 with sessionId + preview
- [ ] `POST /api/generate-preview` with valid sessionToken → 200
- [ ] `POST /api/create-order` with valid session → 200, amount 19900
- [ ] `POST /api/verify-payment` with valid Razorpay payload → confirmationToken + downloadReady
- [ ] `POST /api/verify-payment` with confirmationToken → valid: true

## Regression

- [ ] Hero "Buy Starter" scrolls to checkout form
- [ ] Razorpay order notes include `sessionId`
- [ ] Amount unchanged at 19900 paise
