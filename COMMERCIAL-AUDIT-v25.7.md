# COMMERCIAL AUDIT — v25.7

**Scope:** Pricing, taxes, fees, refunds, support, invoices, enterprise process, customer expectations  
**Date:** 2026-06-27

---

## Commercial Score: **86 / 100**

---

## Pricing Verification

| Item | Status | Notes |
|------|--------|-------|
| Tier pricing server-authoritative | PASS | `buildOrderQuote` from plan tier |
| Client price tampering blocked | PASS | `rejectClientPricingTamper` |
| Enterprise >1000 items no self-serve price | PASS | Gate + sales quote |
| Currency display | PASS | INR default; USD supported |
| "From ₹X" on homepage | PASS | `pricing-i18n.js` + API fallback |
| No hidden provider switch | PASS | Razorpay-only at launch |

---

## Taxes & Fees

| Item | Status | Notes |
|------|--------|-------|
| Tax rate configurable | PASS | `TAX_RATE`, `TAX_LABEL` env |
| Tax shown in order summary | PASS | Guided assessment quote panel |
| Convenience fee disclosure | PARTIAL | Verify GST line visible at checkout in staging |
| International tax clarity | PARTIAL | USD pricing; local tax responsibility in terms |

---

## Refund Policy

| Item | Status | Notes |
|------|--------|-------|
| Refund policy page/content | PASS | support.html + FAQ references |
| Automated refund API | FAIL | Manual via support |
| Digital goods exception stated | PASS | Terms cover assessment delivery |
| Partial refund edge cases | OPEN | Document in support runbook |

---

## Support & Expectations

| Item | Status | Notes |
|------|--------|-------|
| support@ email visible | PASS | Footer, checkout, emails |
| sales@ for enterprise | PASS | Gate messaging |
| Response time expectation | PASS | Enterprise warmth copy v25.6 |
| No misleading "instant" for enterprise | PASS | Sales review messaging |
| Recover flow sets email expectation | PASS | v25.7 magic link copy |

---

## Invoices

| Item | Status | Notes |
|------|--------|-------|
| Invoice text in payment email | PASS | `buildInvoiceText` |
| `/api/invoice` endpoint | PASS | Recovery token gated |
| PDF invoice download | OPEN | Text-only in email |
| GSTIN on invoice | OPEN | Add if required for India B2B |

---

## Enterprise Commercial Process

| Step | Status |
|------|--------|
| Upload >1000 → gate message | PASS |
| Sales request form | PASS |
| Admin quote + payment link | PASS |
| Custom amount on verify | PASS (v25.7 amount check) |
| 7-day link expiry communicated | PASS |
| No hidden enterprise fees | PASS |

---

## Misleading Wording Review

| Page | Issue | Severity |
|------|-------|----------|
| pricing.html | Commercial clarity panel present | OK |
| index.html | Company/trust section | OK |
| features.html | Deliverables accurate | OK |
| faq.html | 1000 threshold aligned | OK |
| recover-report.html | Updated for email verification | Fixed v25.7 |

---

## Recommendations (wording / ops only)

1. Add explicit GST line example in `#commercial-clarity` if not visible in all currencies.
2. State refund window (e.g. 7 days) in FAQ if policy allows.
3. Enterprise SLA page link from pricing enterprise section.

**Commercial Score: 86/100**
