# CHANGELOG — v25.13 Production Readiness Sprint

**Release:** v25.13 | **Date:** 2026-06-27 | **Series:** v25 Production (target launch v25.25)

Consolidated sprint covering internal releases **v25.9 → v25.13**.

## v25.9 — Operations & Observability

- Public `/api/health` readiness (minimal exposure) + admin diagnostics via `operations_dashboard` / `diagnostics`
- Operational metrics rollup (`ops-metrics.js`), alert hooks (`alerting.js`)
- Structured logging: `correlationId`, `requestId`, hashed customer identifiers, duration/outcome
- Admin portal operations dashboard (pending uploads, payments, reports, enterprise queue)
- Incident counters: storage, email, Razorpay, webhook, report, rate-limit, admin auth failures
- Docs: OPERATIONS-HANDBOOK, INCIDENT-RESPONSE-GUIDE, DEPLOYMENT-CHECKLIST (v25.9 baseline)

## v25.10 — Staging Deployment Validation

- `scripts/staging-env-check.mjs` — required env var validation
- `scripts/staging-validation-test.mjs` — route presence + optional `STAGING_URL` live smoke
- STAGING-E2E checklist embedded in STAGING-VALIDATION-REPORT-v25.13.md

## v25.11 — Security Fix Pass

- Rate limits fail closed (no bypass when secrets missing) — v25.8 baseline retained
- HMAC secret separation per token purpose — v25.8 baseline retained
- **`_PREVIOUS` secret support** for zero-downtime rotation (`getSigningSecretsForPurpose`)
- CSV/formula injection mitigation (`sanitizeSpreadsheetCell` in report-engine)
- Admin action audit coverage (`auditAdmin` on all destructive/admin actions)
- CSP: `unsafe-inline` retained on static HTML (documented — no build-time nonce pipeline)

## v25.12 — Performance, Scalability & Browser Compatibility

- `scripts/performance-smoke-test.mjs` — parse/quote/sanitize timings (100/500/1000 tasks)
- Performance, browser, and mobile readiness documented in dedicated reports

## v25.13 — Customer Journey & Release Candidate Prep

- Commercial clarity: **Website vs Atlassian Marketplace** product boundary on pricing page
- Version bump to **25.13** across health, dashboard, admin APIs
- Full test runner (`run-all-tests.mjs`) + production readiness ZIP packaging

## Version strings

- `api/health.js`, `api/dashboard.js`, `api/admin-analytics.js`, `api/admin-actions.js` → **25.13**

## Commit message

```
v25.13 production readiness sprint — operations, staging validation, security, performance, and customer journey
```
