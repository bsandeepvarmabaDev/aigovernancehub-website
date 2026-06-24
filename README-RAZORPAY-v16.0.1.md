# AI Governance Hub Website v16.0.1 — Razorpay Integration

## What changed

This package integrates Razorpay into the existing website without exposing secret keys.

### Frontend
- Adds `razorpay-checkout.js`
- Adds secure payment actions for:
  - `assessment` — ₹99 AI Governance Assessment Report
  - `professional` — ₹299 Professional Governance Review
  - `enterprise` — ₹999 Enterprise Governance Review
- Updates assessment payment CTA to use Razorpay payment flow
- Updates pricing buttons to use the shared payment helper
- Adds payment help page copy and safer post-payment report page copy

### Backend example
- Updates `backend-examples/razorpay-order-and-verify.example.js`
- Includes:
  - order creation
  - Razorpay signature verification
  - placeholders for licence/report fulfilment

## Important production note

Razorpay Order creation and payment signature verification must be done on the backend. Do not put `RAZORPAY_KEY_SECRET` in the static website.

Official Razorpay guidance requires creating an order server-side and verifying payment signatures after Checkout.

## Setup

1. Replace frontend placeholder in `razorpay-checkout.js`:

```js
keyId: "rzp_live_xxxxxxxxxx"
```

2. Configure backend endpoints after deployment:

```js
createOrderEndpoint: "https://your-api.example.com/api/razorpay/create-order",
verifyEndpoint: "https://your-api.example.com/api/razorpay/verify-payment"
```

3. Set backend environment variables:

```bash
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

4. Until backend is deployed, the ₹99 assessment falls back to the existing Razorpay hosted payment link.

## Modified files

See `MODIFIED-FILES-v16.0.1-Razorpay-Website.txt`.
