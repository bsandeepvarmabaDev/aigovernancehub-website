# SECURITY REPORT — v25.3

**Product:** AI Governance Hub Website (Razorpay-only launch)  
**Date:** 2026-06-27  
**Scope:** Self-service checkout, enterprise gate, admin sales workflow

## Executive summary

Launch hardening enforces **server-side authority** for pricing, work item counts, and payment verification. Stripe is removed. Enterprise uploads (>1,000 work items) cannot reach Razorpay self-service checkout.

## P0 controls implemented

| Control | Implementation |
|--------|----------------|
| Work item authority | `countWorkItems()` in `report-engine.js`; stored on session; never read from client |
| Self-service limit | `ENTERPRISE_GATE_WORK_ITEMS = 1000`; enforced in upload, quote, create-order, verify-payment |
| Client tamper rejection | `rejectClientPricingTamper()` blocks plan/amount/count fields on upload and checkout APIs |
| Payment verification | Razorpay HMAC signature verify before fulfillment |
| Fail closed | Gate violations return generic errors; detailed audit logged server-side |
| Secrets | Razorpay keys and admin keys env-only; not exposed to frontend |
| Admin access | Bearer `ADMIN_API_KEY` required for enterprise ops and admin actions |
| Audit trail | Enterprise requests include `auditTrail`; payment and report events logged |
| File integrity | Upload stores file hash for anti-fraud correlation |

## Threat mitigations

1. **Manipulated frontend task count** — Ignored; server recount from parsed upload.
2. **Client price tampering** — Order amount computed server-side from plan config; client fields rejected.
3. **Direct create-order with fake amount** — Session gate + server quote amount only.
4. **Report download before payment** — Reports created only in `payment-fulfillment.js` after verify.
5. **Enterprise bypass** — `assertSelfServeAllowed()` on all checkout paths; enterprise uses separate pay token flow.
6. **Admin portal public access** — 401 without valid admin key.

## Residual risks / operational notes

- Admin key rotation should be documented operationally (not automated in this release).
- SMTP must be configured for customer and sales emails in production.
- Razorpay international cards depend on merchant account settings (not code-controlled).
- Jira Marketplace billing remains separate (Atlassian); not in website payment scope.

## Recommendation

Safe for Razorpay-only website launch when env vars are set and admin key is restricted to sales operators.
