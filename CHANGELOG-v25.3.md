# CHANGELOG — v25.3

## Razorpay-only launch hardening with enterprise gate and sales workflow

### Security (P0)
- Server-only work item counting; 1,000 item self-service ceiling enforced on upload, quote, and order creation.
- Anti-fraud: reject client-supplied task counts, plan tiers, and price fields (`rejectClientPricingTamper`).
- Stripe fully removed; Razorpay-only payment provider configuration.
- Enterprise admin APIs require `ADMIN_API_KEY` / `ADMIN_SECRET`; all sales actions audited.
- Payment verification remains HMAC-based; reports generate only after verified payment.

### Enterprise gate
- Uploads over 1,000 work items auto-create enterprise sales requests with audit trail.
- Customer UX: metrics, request ID, status label, sales contact, no self-service checkout.
- Sales notification email with secure internal file reference (no raw attachment).
- Enterprise checkout via custom Razorpay payment links from admin portal.

### Self-service flow
- Order summary shows server-detected plan, work items, taxes/fees, report formats, and confirmation checkbox.
- Checkout labeled **Secure Checkout** (not provider-branded in primary CTA).
- Amount shown matches Razorpay order amount exactly.

### Admin portal
- Enterprise request queue: quote, payment link, notes, mark delivered, close.
- Existing analytics and report search retained.

### Customer dashboard
- Assessment ID, upload date, work items, payment/report status, payment reference, format downloads.

### APIs added/updated
- `api/enterprise-request-status.js`
- `api/admin-enterprise-requests.js`
- Extended `api/admin-actions.js` enterprise actions
- Enriched `api/order-quote.js`, `api/dashboard.js`, `api/upload-report.js`

### Tests
- `scripts/enterprise-gate-test.mjs`
- `scripts/payment-architecture-test.mjs`
- `scripts/launch-hardening-test.mjs` (new)
