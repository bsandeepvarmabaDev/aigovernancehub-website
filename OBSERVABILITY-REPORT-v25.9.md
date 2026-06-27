# OBSERVABILITY REPORT — v25.9

**Observability Score: 87/100**

## Logging standard

Every instrumented API request emits:

```json
{
  "level": "info",
  "message": "api_request",
  "correlationId": "...",
  "requestId": "...",
  "assessmentId": "session-uuid or null",
  "enterpriseRequestId": "uuid or null",
  "customerHash": "16-char hash or null",
  "route": "/api/verify-payment",
  "outcome": "success|error|degraded",
  "durationMs": 1234,
  "statusCode": 200,
  "category": "api|payment|health|storage",
  "timestamp": "ISO-8601"
}
```

## Response headers

- `X-Correlation-Id`
- `X-Request-Id`

## Metrics storage

- Daily rollup: `ops/rollup/{YYYY-MM-DD}.json`
- Recent issues: `ops/recent-issues.json` (last 50)

## Performance baselines (measure in staging)

| Operation | Target p50 | Target p95 |
|-----------|------------|------------|
| Health check | <200ms | <500ms |
| Upload (1k rows) | <3s | <8s |
| Payment verify | <5s | <15s |
| Report generation | <10s | <25s |
| Dashboard load | <1s | <3s |

## Alert events (hooks only)

| Event | Alert type |
|-------|------------|
| Payment verify failure | payment_verify_failed |
| Report gen failure | report_generation_failed |
| SMTP failure | smtp_failure |
| Admin auth failure | admin_auth_failed |
| Rate limit spike | rate_limit_exceeded |
| Storage probe fail | storage_failure (via readiness) |

Integration: set `ALERT_WEBHOOK_URL` and extend `emitAlert()` in future release.

## Audit coverage

All critical lifecycle events logged — see `api/lib/audit.js` AUDIT_EVENTS.

## Gaps (P2)

- No OpenTelemetry exporter yet
- No centralized log drain config in repo
- Percentiles computed from daily rollup only (not true p95)
