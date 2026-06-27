# CHANGELOG — v25.19 Production Operations & Real Customer Readiness

**Release:** 2026-06-27  
**Focus:** Day-1 paying customer operations — security hardening, failure recovery, monitoring, support flows. No features, no pricing changes.

---

## Summary

v25.19 hardens payment idempotency, improves post-payment polling when reports are generating, wires optional ops alert webhooks, expands customer-facing troubleshooting, and documents operational runbooks for support, finance, and customer success teams.

---

## Modified Files

| File | Change |
|------|--------|
| `api/verify-payment.js` | Reject duplicate payment ID on verified order; idempotent replay for same payment (any report state) |
| `api/lib/alerting.js` | Optional `ALERT_WEBHOOK_URL` POST dispatch |
| `api/health.js` | `launchReady` flag; version 25.19 |
| `assets/js/starter-success.js` | Poll until report ready; retry downloads on 409 |
| `assets/js/enterprise-ux.js` | Report-generating error guidance |
| `support.html` | Operational troubleshooting matrix (9 scenarios) |
| `recover-report.html` | Failure recovery scenarios panel |
| `admin.html` | Ops monitoring env hints |
| `assets/js/site-trust-footer.js` | Version 25.19 |
| API version bumps | health, pricing, dashboard, admin-* → 25.19 |
| `scripts/package-v25.19.mjs` | **New** |

---

## Security (P0)

- Duplicate Razorpay payment ID on already-verified order → **409 rejected**
- Same payment ID replay → idempotent success (including GENERATING state)
- No weakening of download signing, enterprise gate, or admin auth

---

## Operations Deliverables (New)

- `OPERATIONS-READINESS-v25.19.md`
- `CUSTOMER-SUCCESS-RUNBOOK-v25.19.md`
- `SUPPORT-RUNBOOK-v25.19.md`
- `FINANCE-RUNBOOK-v25.19.md`
- `PRODUCTION-MONITORING-v25.19.md`
- `FAILURE-RECOVERY-v25.19.md`
- `DAY1-LAUNCH-SIMULATION-v25.19.md`

---

## Environment

Set `ALERT_WEBHOOK_URL` in production for Slack/Teams/PagerDuty-style ops alerts.
