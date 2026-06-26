# Changelog — v16.5.2 Production Remediation

**Release date:** 2026-06-27  
**Scope:** Remediation only — no new features, no redesign.

## Summary

Aligns Local, GitHub, and Production to a single consistent v16.5.2 purchase flow: ₹199 Introductory Offer, secure Razorpay checkout, token-gated success page, and matching API payloads.

## Modified files

| File | Changes |
|------|---------|
| `index.html` | Starter section updated to ₹199 Introductory Offer; removed ₹499, 30 days, and Starter Launch Edition copy |
| `pricing.html` | Version bump to v16.5.2 (content unchanged from v16.5.1) |
| `assets/js/starter-checkout.js` | Version bump; hero scroll + bottom checkout bindings; `starter-buyer-company`; confirmation token redirect |
| `starter-success.html` | Version bump; unverified-by-default; server token validation before verified state |
| `starter-pending.html` | Version bump; Retry Payment deep-link; Return Home |
| `api/create-order.js` | ₹199 (19900 paise); env trim; key format validation; secure logging |
| `api/verify-payment.js` | No `jiraSite`; name/email required; HMAC verification; confirmation tokens |

## Fixes addressed (from Production Deployment Audit)

- P0: Incomplete v16.5.1 deploy — all seven payment files now consistent
- P0: API amount ₹499 vs UI ₹199 — fixed to 19900 paise
- P0: `verify-payment` required `jiraSite` — removed
- P1: False success page on direct access — token gate enforced
- P1: Hero Buy button scroll — `data-starter-scroll-checkout` handler
- P1: Homepage ₹499 mismatch — aligned to ₹199
- P2: Company field ID mismatch — `starter-buyer-company` in HTML and JS
- P2: Pending page retry deep-link — `pricing.html#starter-checkout-form`

## Breaking changes

None for end users. Deploy must update **all seven files atomically**.
