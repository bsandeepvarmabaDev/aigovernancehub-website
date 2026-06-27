# PERFORMANCE & SCALABILITY REPORT — v25.13

**Verdict:** **PASS smoke thresholds** (local Node; production may vary with Vercel cold starts)

## Automated Smoke Tests

```powershell
node scripts/performance-smoke-test.mjs
```

| Scenario | Budget | Notes |
|----------|--------|-------|
| Parse 100 tasks | 3000ms | CSV upload path |
| Parse 500 tasks | 3000ms | |
| Parse 1000 tasks | 8000ms | Self-serve max |
| Order quote 1000 | 500ms | Server-side pricing |
| Sanitize 10k cells | 500ms | Formula injection path |

## Large File Scenarios

| Size | Path | Status |
|------|------|--------|
| 100 tasks | Self-serve | Supported |
| 500 tasks | Self-serve | Supported |
| 1000 tasks | Self-serve max | Supported |
| 1001 tasks | Enterprise gate | No checkout |
| 5000 tasks | Enterprise | Sales workflow |
| 100k metadata | Enterprise | Metadata-only sim OK |

## Concurrency

- Rate limits protect duplicate create-order / verify-payment
- Idempotent verify + webhook handles concurrent payment confirmation
- Blob storage handles concurrent downloads (token-gated)

## Recommendations (v25.14+)

- Edge cache for `/api/pricing` and static assets
- Streaming parse for >1000 row enterprise uploads (admin path)
- Report generation queue with backoff metrics in ops dashboard

## No Changes That Weaken Security

Performance improvements limited to parse/quote smoke validation — no client-side pricing trust introduced.
