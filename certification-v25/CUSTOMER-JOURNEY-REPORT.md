# Customer Journey Report — v25.14 Certification

**Personas exercised:** First-time visitor (browser), returning customer (static), enterprise buyer (copy review)  
**Date:** 2026-06-27  

## What the customer sees (local — pricing wizard)

Screenshot: `screenshots/02-local-pricing-wizard.png`

1. **Hero:** “From export to executive report — guided every step” with “Start Guided Assessment”
2. **Wizard strip:** Source → Export → Upload → Validate → Preview → Secure Checkout
3. **Step guidance banner:** “Right now / Up next” contextual copy
4. **Upload:** Drag-drop zone “Drop your export here” + industry selector
5. **Trust:** Server-side validation messaging, refund/recovery links
6. **Commercial clarity:** “What you receive — before you pay” + Marketplace boundary panel

## Journey question scorecard (local)

| Question | Homepage | Pricing wizard |
|----------|----------|----------------|
| What does product do? | ✅ Clear | ✅ |
| What to upload? | ✅ | ✅ source buttons + samples |
| Why fields required? | Partial | ✅ required fields section |
| Plan limit? | ✅ 1000 self-serve | ✅ enterprise panel |
| Pre-pay deliverables? | ✅ | ✅ locked preview copy |
| Total price? | “From ₹199” | Order summary step (not live-tested) |
| Trust payment? | ✅ Razorpay + trust list | ✅ |
| After payment? | ✅ | ✅ FAQ |
| Recover report? | ✅ nav links | ✅ |
| Enterprise path? | ✅ | ✅ warm upsell |
| Support? | ✅ emails | ✅ |

## Gaps

| ID | Issue |
|----|-------|
| FIND-P2-001 | Production not verified — owner may see old deploy |
| FIND-P2-002 | Long pricing page — wizard + cards + FAQ |
| FIND-P2-003 | Mobile broken logo |

## Homepage journey strip

Automated **CJ-ux-home-journey** PASS — 6-step strip on index.html (browser confirmed nav to pricing).

## Status

**Pass locally** for v25.14 UX intent; **production customer journey uncertified**.
