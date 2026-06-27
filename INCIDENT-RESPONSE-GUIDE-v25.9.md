# INCIDENT RESPONSE GUIDE — v25.9

## Severity levels

| SEV | Example | Response |
|-----|---------|----------|
| SEV1 | Payments down, data loss risk | Immediate — all hands |
| SEV2 | Report generation failing | <1 hour — admin retry + fix |
| SEV3 | Email delivery failing | <4 hours — resend queue |
| SEV4 | Elevated rate limits | Monitor — possible abuse |

## Triage checklist

1. Get `correlationId` / `requestId` from customer or logs
2. `GET /api/health` — note `readiness` and `services`
3. Admin `operations_dashboard` — check failed counters
4. Admin `get_audit_trail` for orderId
5. Vercel function logs — search correlationId

## Playbooks

### Payment verified but no report
- Check `reportStatus` in admin search
- Admin `retry_generation`
- Audit: report_generation_failed events

### Customer charged, verify failed
- Search Razorpay dashboard by payment ID
- Check payment_verify_failed count
- Manual reconcile via verify-payment retry with valid signature

### Storage outage
- Health returns `storage: down`
- All writes fail closed (503)
- Wait for blob/S3 recovery — no partial corruption by design

### SMTP outage
- Reports still generated
- `report_email_failed` increments
- Fix SMTP → batch `resend_email`

### Webhook duplicates
- Idempotent by event ID — safe to replay
- Check audit payment_webhook events

## Communication template

> We identified an issue affecting [area]. Your payment/data is secure. Reference: [correlationId]. Expected resolution: [ETA].

## Post-incident

1. Document timeline in internal notes
2. Add admin note on enterprise request if applicable
3. Review ops rollup errorsByCategory
4. Update runbook if new failure mode

## Escalation

- Engineering: support@aigovernancehub.ai
- Sales/enterprise: sales@aigovernancehub.ai
