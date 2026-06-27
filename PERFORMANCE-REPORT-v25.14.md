# PERFORMANCE REPORT — v25.14

**Verdict:** **PASS smoke** — no regressions from CSP refactor

## Measured (automated)

| Scenario | Budget | v25.14 |
|----------|--------|--------|
| Parse 100 tasks | 3000ms | PASS |
| Parse 500 tasks | 3000ms | PASS |
| Parse 1000 tasks | 8000ms | PASS |
| Order quote | 500ms | PASS |
| Sanitize 10k cells | 500ms | PASS |

## v25.14 Changes Impact

- External JS (`site-nav.js`, `starter-success.js`): negligible — cached by browser, defer loaded
- No change to server-side parse/quote/report paths
- No client-side pricing trust introduced

## Not Measured (requires staging/production)

- Vercel cold start latency
- Concurrent payment verify under load
- Report PDF generation at scale

## Recommendations (v25.15+)

- Edge cache `/api/pricing` with short TTL
- Profile report generation on 1000-row uploads in staging
- Real User Monitoring after beta
