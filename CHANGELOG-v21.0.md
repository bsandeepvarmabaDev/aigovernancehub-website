# Changelog — v21.0 Commercial SaaS Release

**Release date:** 2026-06-27  
**Scope:** Multi-tier commercial pricing, order summary, global currencies, trust center, enterprise copywriting, enhanced compatibility.

## Summary

v21.0 transforms AI Governance Hub into a commercial SaaS assessment platform with six pricing tiers, backend-driven global pricing, order summary with taxes/fees, automatic plan detection for all tiers, and enterprise sales gate. Self-serve Razorpay checkout for Starter through Business Plus. Enterprise and Enterprise Plus contact sales only.

## P0 — Security

- Order amounts calculated server-side only (`buildOrderQuote`)
- `create-order` requires `orderConfirmed: true`
- Razorpay amount verified matches quote before returning to client
- `pendingCheckout` stored on session; verify-payment validates order ID
- Enterprise tiers blocked from Razorpay (403)
- All v18–v19 security controls maintained

## P1 — Functional

### Multi-tier pricing (INR base, multi-currency display)
| Plan | INR | Self-serve |
|------|-----|------------|
| Starter | ₹199 | Yes |
| Professional | ₹599 | Yes |
| Business | ₹999 | Yes |
| Business Plus | ₹5,999 | Yes |
| Enterprise | ₹9,999 | No (sales) |
| Enterprise Plus | Custom | No (sales) |

### New APIs
- `api/order-quote.js` — POST order summary for upload session
- `api/pricing.js` — GET commercial catalog + currencies + sample quote

### Enhanced validation
- Compatibility: platform, encoding, estimated analysis time, project count
- Plan recommendation with explanatory reason (never down-tier)

## P2 — User Journey / Commercial

- Homepage answers: what, who, problems, analysis, timing, deliverables, trust
- Order summary before payment (plan, base, fees, tax, total)
- Currency selector (INR, USD, EUR, GBP, AUD, SGD)
- Trust Center page
- FAQ expanded to 30 questions
- Copy: "Unlock Your Complete AI Governance Assessment"

## P3 — UI

- Order summary table styling
- Currency row
- Enterprise gate benefits list
- Premium lock explanations

## New files

| File | Purpose |
|------|---------|
| `api/order-quote.js` | Order summary API |
| `trust-center.html` | Trust center page |

## Modified files

| File | Change |
|------|--------|
| `api/lib/pricing.js` | Full commercial pricing engine |
| `api/lib/assessment-config.js` | 6-tier plan catalog |
| `api/lib/report-engine.js` | Enhanced compatibility |
| `api/create-order.js` | Dynamic plan pricing + quote |
| `api/verify-payment.js` | Pending checkout validation |
| `api/upload-report.js` | v21 |
| `assets/js/guided-assessment.js` | Order summary, currency |
| `pricing.html` | Order summary UI |
| `index.html` | Product overview section |
| `faq.html` | 30 questions |
| `styles.css` | Order summary styles |

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CONVENIENCE_FEE_PAISE` | 0 | Optional convenience fee |
| `TAX_RATE` | 0.18 | Tax rate (e.g. GST) |
| `TAX_LABEL` | Applicable taxes | Display label |

## Unchanged

- HMAC payment verification
- Signed downloads
- Persistent storage fail-closed
- Rate limiting + audit logs
