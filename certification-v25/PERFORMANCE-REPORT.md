# Performance Report — v25.14 Certification

**Date:** 2026-06-27  

## Local smoke (performance-smoke-test.mjs — 6/6 pass)

| Operation | Budget | Observed |
|-----------|--------|----------|
| Parse 100 rows | 3000ms | 1ms |
| Parse 500 rows | 3000ms | 1ms |
| Parse 1000 rows | 8000ms | 1ms |
| Order quote 1000 | 500ms | 0ms |
| Sanitize bulk | 500ms | 1ms |
| 100k metadata sim | — | OK |

## Not measured this round

- Production homepage TTFB/LCP
- Throttled 3G wizard load
- Report generation wall time (requires API + payment)
- Download latency by format

## Finding

**FIND-P6-001** — Production performance not measured

## Status

Parser/quote performance **excellent locally**; end-to-end report generation **not benchmarked**.
