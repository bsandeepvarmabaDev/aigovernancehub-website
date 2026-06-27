# Security Test Report — v25.14 Certification

**Scope:** Payment gates, upload validation, API hardening, auth, tokens, CSP, enterprise bypass attempts  
**Date:** 2026-06-27  

## Summary

| Layer | Automated | Live production | Verdict |
|-------|-----------|-----------------|---------|
| Code/static analysis | ✅ 281+ checks pass | N/A | Strong |
| Production API | N/A | ❌ 404 on health | **Not certified** |
| E2E payment bypass | Partial (code) | Not run | **Blocked** |

## Automated evidence

- **enterprise-gate-test:** 20/20 — >1000 items gated; tamper count/price rejected
- **launch-hardening:** 25/25 — self-serve ≤1000; enterprise blocked from Razorpay
- **production-audit:** 20/20 — signature-first verify, amount check, no stack traces in API patterns
- **resilience:** 26/26 — purpose-specific secrets, terminal payment states, webhook dedup
- **csp-hardening:** 17/17 — no script `unsafe-inline` on HTML pages
- **journey-security-round:** 26/26 — server quote, download gate, enterprise gate in wizard
- **full-round security scan:** malicious payloads blocked (script, javascript:, onerror, php, asp)

## Upload security matrix (automated subset)

| Category | Cases in catalog | Automated this round | Notes |
|----------|-----------------|----------------------|-------|
| Valid formats | 10 | ✅ samples + TSV + null fields | |
| Invalid/malicious | 28 | ✅ partial via full-round + security scan | Live audit log not verified |
| Size limits | 3 | ✅ >5MB rejected in validateFileMeta | 25MB not re-run |

## Payment security (code review + tests)

| Test | Expected | Result |
|------|----------|--------|
| create-order without session | Reject | Code enforces session token (static audit) |
| verify before signature | Reject | PA-verify-sig-first PASS |
| enterprise create-order | Block | LH-no-ent-checkout PASS |
| duplicate verify | Idempotent | R19 webhook dedup PASS |
| wrong Razorpay HMAC | Reject | PA-razorpay-reject PASS |

## Findings

See `FULL-TESTING-REPORT.md`:
- **FIND-P0-001** Production API unavailable
- **FIND-P0-002** Live payment E2E not executed
- **FIND-P0-003** Live API matrix blocked

## Recommended staging tests (post-deploy)

1. Direct POST `/api/create-order` with forged body (6 variants)
2. Replay Razorpay webhook with old signature
3. Download-report without token / wrong user token
4. Admin endpoints without `ADMIN_API_KEY`
5. recover-reports enumeration attempt

**Status:** Open until staging complete. No fixes applied.
