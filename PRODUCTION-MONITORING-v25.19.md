# PRODUCTION MONITORING — v25.19

**Audience:** SRE, Operations, Security

---

## Health Endpoint

**GET** `/api/health`

| Field | Meaning |
|-------|---------|
| `status` | ok · degraded · unavailable |
| `readiness` | ready · degraded · not_ready |
| `launchReady` | true when storage + payments + config complete AND email up |
| `services.storage` | up · down · degraded |
| `services.payments` | up · down · not_configured |
| `services.email` | up · not_configured |
| `version` | 25.19 |

**503** when critical services down — use for load balancer / uptime checks

---

## Admin Operations Dashboard

**POST** `/api/admin-actions` `{ "action": "operations_dashboard" }`

Metrics (7-day rollup):

| Metric | Meaning |
|--------|---------|
| pendingUploads | upload_received − validation_complete |
| pendingPayments | payment_started − payment_verified |
| failedPayments | payment_verify_failed count |
| failedReportGenerations | report_generation_failed |
| failedEmails | report_email_failed |
| rateLimitViolations | rate_limit_exceeded |
| recentIssues | Last 20 operational issues |
| errorsByCategory | Error taxonomy |

---

## Alerting (v25.19)

Set environment variable:

```
ALERT_WEBHOOK_URL=https://hooks.slack.com/... (or Teams/PagerDuty)
```

Alert types emitted:

- `payment_verify_failed`
- `report_generation_failed`
- `admin_auth_failed`
- `storage_failure`
- `smtp_failure`
- `webhook_processing_failed`
- `rate_limit_exceeded`

Payload includes: `alertType`, `at`, `service`, `correlationId`, `orderId`, etc.

---

## What We Can Detect Today

| Failure | Detection |
|---------|-----------|
| Payment verify fail | Counter + alert + audit |
| Upload fail | validation errors in logs |
| Report gen fail | Counter + alert + admin ops |
| Email fail | report_email_failed counter |
| Webhook fail | webhook_processing_failed |
| Admin auth fail | Counter + alert |
| Recovery fail | Support tickets + rate limits |
| Storage down | Health 503 + storage probe fail |

---

## What Requires External Monitoring

- Vercel function errors (Vercel dashboard)  
- Razorpay webhook delivery (Razorpay dashboard)  
- SMTP bounce rates (email provider)  
- Uptime synthetic checks (Pingdom, Better Uptime, etc.)

---

## Recommended Production Setup

1. Uptime monitor on `/api/health` every 1 min  
2. Alert if `launchReady: false` for >5 min  
3. Configure `ALERT_WEBHOOK_URL` to ops Slack channel  
4. Daily admin ops dashboard review  
5. Weekly review of `failedReportGenerations` and `failedPayments`

---

## Performance Expectations (P6)

| Load | Expectation |
|------|-------------|
| 100 concurrent uploads | Rate limited per IP/email; serverless scales |
| 500 concurrent payments | Razorpay handles checkout; verify-payment rate limited |
| 1000 concurrent reports | Cold start risk — monitor generation failures |
| Large exports (5 MB cap) | Single-file processing; enterprise for larger |

**Bottleneck:** Report generation CPU/time on serverless — watch `report_generation_failed` spike

---

## Log Correlation

All API routes attach:
- `correlationId` (response header + JSON)  
- `requestId`  

Support tickets should include correlationId from customer browser network tab when available.
