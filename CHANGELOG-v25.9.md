# CHANGELOG — v25.9 Production Operations & Observability

**Release:** v25.9 | **Date:** 2026-06-27 | **Type:** Ops/observability (no customer features)

## Health & Readiness
- `/api/health` expanded to production readiness probe (public-safe: status, readiness, service states only)
- Internal admin diagnostics via `getAdminReadiness()` (storage backend, config, queue, metrics)

## Operations Dashboard (admin only)
- `operations_dashboard` admin action
- Admin portal UI: pending/failed counts, averages, error categories, recent issues

## Observability
- Structured request logging: correlationId, requestId, assessmentId, durationMs, outcome
- Ops metrics rollup: counters, timings, errors by category (`api/lib/ops-metrics.js`)
- Alert hooks for future Slack/Teams/email (`api/lib/alerting.js`, env `ALERT_WEBHOOK_URL`)

## Audit consistency
- New events: upload_received, validation_complete, quote_created, payment_verify_failed, enterprise_request_created, admin_action, refund_status_updated
- Session-scoped audit via `logSessionAudit()`

## Instrumentation
- upload-report, order-quote, verify-payment, create-order, payment-fulfillment, rate-limit

## Version
- health, dashboard, admin-analytics → **25.9**

## Tests
- `scripts/operations-test.mjs` — 27 checks
- Full regression suite: 138 tests when all scripts run

## Commit message
```
v25.9 production operations — readiness endpoint, ops dashboard, structured logging
```
