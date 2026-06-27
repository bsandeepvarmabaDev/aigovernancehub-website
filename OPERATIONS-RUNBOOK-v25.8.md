# OPERATIONS RUNBOOK — v25.8

## Daily checks

```powershell
Invoke-RestMethod "https://aigovernancehub.ai/api/health"
# status: ok, version: 25.8
```

Admin diagnostics:
```json
POST /api/admin-actions
{ "action": "diagnostics" }
Authorization: Bearer $ADMIN_API_KEY
```

---

## Payment reconciliation

### Automatic
- Customer verify-payment (primary)
- Razorpay webhook `/api/razorpay-webhook`

### Manual
1. Admin search order by payment ID
2. `get_audit_trail` for orderId
3. If paid but report failed → `retry_generation`
4. If refund in Razorpay dashboard → `mark_refunded`

---

## Enterprise queue

1. `list_enterprise_requests` (filter by status)
2. `enterprise_set_quote` → `create_enterprise_payment`
3. Monitor `payment_link_ready` → `payment_received` → `report_delivered`

---

## Failed reports

| reportStatus | Action |
|--------------|--------|
| generating | Wait 2 min, then retry_generation |
| failed | retry_generation |
| ready | resend_email if needed |

---

## Secret rotation

1. Generate new secret value
2. Set env var (e.g. `DOWNLOAD_TOKEN_SECRET`)
3. Deploy preview; verify new tokens work
4. Legacy tokens valid until TTL via `RAZORPAY_KEY_SECRET` fallback
5. After max TTL (90d recovery / 15m success), remove fallback dependency

---

## Webhook setup (Razorpay dashboard)

- URL: `https://aigovernancehub.ai/api/razorpay-webhook`
- Secret: set `RAZORPAY_WEBHOOK_SECRET`
- Events: payment.captured, payment.failed, refund.processed

---

## Incident response

1. Capture `X-Correlation-Id` from customer report
2. Search Vercel logs for correlationId
3. Load audit trail via admin
4. Reference `DISASTER-RECOVERY-GUIDE-v25.8.md`

---

## Support actions

| Customer issue | Admin action |
|----------------|--------------|
| Paid, no email | resend_email |
| Paid, no download | retry_generation |
| Refund processed | mark_refunded |
| Wrong download disabled | enable_download |
