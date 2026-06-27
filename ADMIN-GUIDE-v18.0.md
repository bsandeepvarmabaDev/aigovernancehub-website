# Admin Guide — v18.0 Commercial Launch

**Audience:** Internal operations / support  
**Access:** `https://aigovernancehub.ai/admin.html`

## Authentication

1. Set `ADMIN_API_KEY` in Vercel environment variables
2. Open `admin.html`
3. Enter the API key — stored in browser sessionStorage for the session only
4. All admin API calls send `Authorization: Bearer <ADMIN_API_KEY>`

**Security:** Rotate the key if exposed. Never share in customer-facing channels.

## Search

Search box accepts:

| Input | Example |
|-------|---------|
| Buyer email | `user@company.com` |
| Razorpay order ID | `order_xxx` |
| Payment ID | `pay_xxx` |
| Upload session ID | UUID from upload |

Results show:

- Masked order/payment references
- Payment status, email delivery status
- Download count
- Preview snapshot
- Recent audit events (last 20)

## Actions

| Action | Effect |
|--------|--------|
| **resend email** | Sends report recovery email to buyer |
| **disable download** | Blocks `/api/download-report` for order |
| **delete expired** | Removes expired report record |

## Analytics

The admin panel displays a 7-day JSON summary from `/api/admin-analytics`:

- Uploads, preview completions, checkout starts
- Payment verifications, downloads, recovery usage
- Top countries, devices, browsers, referrers

## API reference (direct)

```bash
# Search
curl -X POST https://aigovernancehub.ai/api/admin-search \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"user@example.com"}'

# Analytics
curl https://aigovernancehub.ai/api/admin-analytics \
  -H "Authorization: Bearer $ADMIN_API_KEY"

# Resend email
curl -X POST https://aigovernancehub.ai/api/admin-actions \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"order_xxx","action":"resend_email"}'
```

## Future

- Refund via Razorpay API (not implemented in v18.0)
- SSO for admin (recommended upgrade)

## Support escalation

If a customer cannot access reports:

1. Search by email in admin
2. Verify `paymentStatus: verified`
3. Resend email or disable/re-enable download if corrupted
4. Direct customer to `recover-report.html` or `login.html`
