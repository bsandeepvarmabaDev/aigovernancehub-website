# OPERATIONS HANDBOOK — v25.13

*(Consolidates v25.9 operations baseline)*

## Health Endpoints

| Endpoint | Audience | Content |
|----------|----------|---------|
| `GET /api/health` | Public | `status`, `version`, minimal `services` readiness |
| Admin `diagnostics` action | Admin only | Detailed probes, env readiness, storage |

## Operations Dashboard

Admin portal → **Operations** tab (via `operations_dashboard` action):

- Pending uploads / payments
- Failed payments, reports, emails
- Enterprise requests by status
- Average report generation & payment verification times
- Errors by category (ops-metrics daily rollup)

## Structured Logging

Every critical API request should log:

- `correlationId`, `requestId`
- `assessmentId` / `enterpriseRequestMappingId` when available
- Hashed customer identifier (email)
- `timestamp`, `duration`, `status`, `outcome`

Search Vercel logs by `correlationId`.

## Alert Hooks

Set `ALERT_WEBHOOK_URL` for incident dispatch (integration point in `alerting.js`).

## Key Environment Variables

See `DEPLOYMENT-CHECKLIST-v25.13.md` and run `node scripts/staging-env-check.mjs`.

## Daily Operator Checklist

1. `GET /api/health` — version 25.13, status ready/degraded
2. Admin operations dashboard — zero stuck pending payments > 1h
3. Review failed report/email counters
4. Enterprise queue — no requests unquoted > 2 business days

## Related Docs

- `INCIDENT-RESPONSE-GUIDE-v25.13.md`
- `DEPLOYMENT-CHECKLIST-v25.13.md`
- `SECRET-ROTATION-GUIDE-v25.11.md` (rotation procedure)
