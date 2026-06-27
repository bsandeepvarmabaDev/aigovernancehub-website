# Admin Guide — v21.0 Commercial SaaS

**Updates from v18:** Multi-tier plans, order quotes with tax/fees, plan tier on report records.

## Admin access

Unchanged — `admin.html` with `ADMIN_API_KEY`. See v18 ADMIN-GUIDE for search, resend, disable download.

## New session fields (v21)

| Field | Purpose |
|-------|---------|
| `planTier` | Detected plan (starter–enterprise_plus) |
| `selfServeAllowed` | Whether Razorpay checkout permitted |
| `pendingCheckout` | Order ID, amount, quote at checkout start |

## Report records

Verified reports now include `planTier` for support lookups.

## Pricing configuration

Set in environment (not admin UI):

```bash
CONVENIENCE_FEE_PAISE=0
TAX_RATE=0.18
TAX_LABEL=GST (18%)
```

Plan base prices defined in `api/lib/pricing.js` — deploy update required to change.

## Enterprise escalations

When customer hits enterprise gate:

1. Search by email in admin
2. Note `planTier: enterprise` or `enterprise_plus` on session
3. Direct to sales@aigovernancehub.ai
4. Manual assessment delivery outside self-serve flow

## Analytics

Track plan tier in upload events: `planTier` in analytics metadata.
