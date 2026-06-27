# OPERATIONS HANDBOOK — v25.14

*(Extends v25.13 operations baseline)*

## Health & Readiness

| Endpoint | Audience | Use |
|----------|----------|-----|
| `GET /api/health` | Public | Version **25.14**, minimal readiness |
| Admin `diagnostics` | Admin only | Env, storage, Razorpay, email probes |
| Admin `operations_dashboard` | Admin only | Queue metrics, failures, averages |

## Admin Portal (v25.14)

**URL:** `/admin.html` (noindex)

Capabilities:
- Operations dashboard refresh
- **Diagnostics** (new v25.14)
- Enterprise queue: quote, payment link, notes, deliver, close
- Search reports: resend, **retry generation**, enable/disable download, **mark refunded**, delete

All actions emit `ADMIN_ACTION` audit events.

## Structured Logging

Search Vercel logs by `correlationId`. Critical fields: `requestId`, `assessmentId`, hashed email, duration, outcome.

## Alerting

Set `ALERT_WEBHOOK_URL` for incident dispatch (`api/lib/alerting.js`).

## Daily Checklist

1. Health → version 25.14, status ready/degraded
2. Ops dashboard → no stuck pending payments > 1h
3. Failed report/email counters → investigate if > 0
4. Enterprise queue → unquoted requests > 2 business days

## Related

- `INCIDENT-RESPONSE-GUIDE-v25.13.md` (playbooks still valid)
- `DEPLOYMENT-CHECKLIST-v25.13.md` + v25.14 TEST-CHECKLIST
- `SECRET-ROTATION-GUIDE-v25.11.md`
