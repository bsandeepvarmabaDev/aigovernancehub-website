# Security Report — v17.0 Upload → Preview → Pay → Download

## Threat model

Public marketing site with payment and report delivery endpoints. Attackers may attempt to bypass payment, download reports without paying, spoof success pages, or manipulate order amounts.

## Controls implemented

| Control | Status | Implementation |
|---------|--------|----------------|
| Razorpay Key Secret server-only | ✅ | `process.env.RAZORPAY_KEY_SECRET` in API routes only |
| No hardcoded keys in frontend | ✅ | `keyId` from `/api/create-order` only |
| Server-side order creation | ✅ | Amount fixed at 19900 paise |
| HMAC payment verification | ✅ | `crypto.timingSafeEqual` on Razorpay signature |
| Confirmation token (download gate) | ✅ | HMAC-signed, 15-minute TTL, validated server-side |
| Session token (upload gate) | ✅ | HMAC-signed, 2-hour TTL, bound to content hash |
| No localStorage unlock | ✅ | Session held in page memory only |
| No direct success spoofing | ✅ | `starter-success.html` unverified until token validates |
| No download before payment | ✅ | `/api/download-report` requires valid confirmation token + stored report |
| Upload required before order | ✅ | `/api/create-order` rejects requests without valid session |
| Report tied to payment session | ✅ | `sessionId` in Razorpay notes; report keyed by `orderId` |
| File size limit | ✅ | 5 MB max upload |
| Safe error responses | ✅ | Generic client errors; details logged server-side only |
| CSP on checkout page | ✅ | `pricing.html` meta CSP |

## Removed risks

- **Pay without delivery:** Report generated immediately after verified payment
- **Email-later placeholder:** Instant download on success page
- **Orphan payments:** Order linked to upload session via Razorpay notes

## Residual risks (operational)

| Risk | Mitigation |
|------|------------|
| `/tmp` storage not shared across cold starts | Report generated at verify time; regenerate fallback from session if available |
| Session expiry before checkout (2h) | User re-uploads; clear error messages |
| Confirmation token replay within TTL | Token bound to order/payment IDs; 15-minute expiry |
| Excel binary parsing | MVP reads as text; CSV export recommended in UI copy |

## Files reviewed

- `pricing.html`, `starter-success.html`, `starter-pending.html`
- `assets/js/starter-checkout.js`
- `api/create-order.js`, `api/verify-payment.js`
- `api/upload-report.js`, `api/generate-preview.js`, `api/download-report.js`
- `api/lib/tokens.js`, `api/lib/session-store.js`, `api/lib/report-engine.js`

## Verdict

**Ready for secure deployment** when all v17.0 files are deployed together and Vercel Razorpay env vars are validated.
