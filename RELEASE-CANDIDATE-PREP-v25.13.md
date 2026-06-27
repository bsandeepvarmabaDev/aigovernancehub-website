# RELEASE CANDIDATE PREP — v25.13

**Target launch series:** v25.25 | **This RC:** v25.13 internal

## RC Criteria

| Criterion | v25.13 Status |
|-----------|---------------|
| All test suites pass | Run `run-all-tests.mjs` |
| Security P0 closed | PASS (see SECURITY-REPORT) |
| Payment integrity | PASS |
| Staging scripts ready | PASS |
| Ops docs complete | PASS |
| Customer journey clear | PASS |
| ZIP artifact | `aigovernancehub-website-v25.13-production-readiness.zip` |

## Pre-RC Checklist

1. [ ] Deploy to **staging** only
2. [ ] Run staging-env-check on staging env
3. [ ] Manual Razorpay test payment on staging
4. [ ] Admin ops dashboard review
5. [ ] Cross-browser smoke (Chrome + one alternate)
6. [ ] Mobile pricing page check

## NOT in Scope for v25.13

- Production deploy
- Live Razorpay keys on production
- New customer-facing features

## Path to v25.25 Launch

| Version | Focus |
|---------|-------|
| v25.14 | CSP nonce pipeline, Playwright E2E |
| v25.15 | Edge caching, report queue metrics |
| v25.16 | Load test staging, concurrency hardening |
| v25.17 | Legal/compliance copy review |
| v25.18 | Beta user onboarding |
| v25.19 | Production deploy rehearsal |
| v25.20 | Monitoring/alerting wired to ALERT_WEBHOOK_URL |
| v25.21 | Pen test remediation |
| v25.22 | Performance tuning from prod metrics |
| v25.23 | RC2 — full regression |
| v25.24 | Launch freeze |
| v25.25 | **Production launch** |

## Rollback

- Vercel instant rollback to prior deployment
- Keep `_PREVIOUS` secrets during any token rotation near launch
