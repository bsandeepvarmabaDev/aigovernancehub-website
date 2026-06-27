# OPERATIONS HANDBOOK — v25.9

## Daily operations

1. Check `GET /api/health` — expect `readiness: ready` or `degraded`
2. Admin → Operations Dashboard → review failed counts
3. Review enterprise queue for `sales_review_pending`

## Key endpoints

| Endpoint | Audience | Purpose |
|----------|----------|---------|
| `GET /api/health` | Public/monitoring | Readiness probe |
| `POST /api/admin-actions` `{action:"operations_dashboard"}` | Admin | Full ops view |
| `POST /api/admin-actions` `{action:"diagnostics"}` | Admin | Readiness + config |
| `POST /api/admin-actions` `{action:"get_audit_trail"}` | Admin | Order audit |

## Metrics (7-day rollup)

| Metric | Source counter |
|--------|----------------|
| Pending uploads | upload_received − validation_complete |
| Pending payments | payment_started − payment_verified |
| Failed payments | payment_verify_failed |
| Failed reports | report_generation_failed |
| Failed emails | report_email_failed |
| Rate limits | rate_limit_exceeded |

## Averages

- `upload_ms`, `payment_verify_ms`, `health_check_ms` — from ops rollup timings

## Admin actions

| Action | When |
|--------|------|
| retry_generation | reportStatus failed |
| resend_email | emailSent false |
| mark_refunded | Razorpay refund confirmed |
| diagnostics | Incident triage |

## Log search (Vercel)

Filter JSON logs: `"message":"api_request"` or `"message":"ops_alert"`

Use `correlationId` + `requestId` from customer support tickets.

## Environment

See `DEPLOY-v25.8.ps1` for secrets + `ALERT_WEBHOOK_URL` (future).

## Related docs

- `INCIDENT-RESPONSE-GUIDE-v25.9.md`
- `DISASTER-RECOVERY-GUIDE-v25.8.md`
- `OPERATIONS-RUNBOOK-v25.8.md`
