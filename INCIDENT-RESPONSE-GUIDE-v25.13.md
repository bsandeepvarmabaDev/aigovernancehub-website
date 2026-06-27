# INCIDENT RESPONSE GUIDE — v25.13

## Severity Levels

| Level | Example | Response |
|-------|---------|----------|
| SEV-1 | Payment verify broken, reports not generating after pay | Immediate — disable checkout banner, investigate |
| SEV-2 | Email delivery failing, webhook delays | < 1h — retry queue, check SMTP |
| SEV-3 | Single customer report failure | < 4h — admin retry_generation |
| SEV-4 | Rate limit false positives | Next business day |

## Incident Categories (tracked in ops-metrics)

- `storage_failures`
- `email_failures`
- `razorpay_failures`
- `webhook_failures`
- `report_generation_failures`
- `rate_limit_events`
- `admin_auth_failures`

## Playbooks

### Payment stuck in pending

1. Check Razorpay dashboard for payment status
2. Admin search by order ID
3. If paid in Razorpay but not locally → webhook logs / manual reconcile via admin
4. Never enable download without verified payment state

### Report generation failed

1. Admin → retry_generation
2. Check storage token / BLOB_READ_WRITE_TOKEN
3. Verify assessment upload still present

### Webhook signature failures

1. Confirm `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
2. Check for replay attacks (idempotency should dedupe)
3. Rotate webhook secret if compromised (see SECRET-ROTATION-GUIDE)

### Enterprise request not emailed

1. Check SMTP env vars
2. Admin enterprise queue — resend via sales workflow
3. Verify sales@ routing

## Escalation

- Engineering: on-call via internal channel
- Commercial: sales@aigovernancehub.ai
- Customer: support@aigovernancehub.ai

## Post-Incident

1. Log correlation IDs affected
2. Update ops-metrics review
3. Add regression test if gap found
