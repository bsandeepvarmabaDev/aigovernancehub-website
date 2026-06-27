# TEST CHECKLIST — v25.14

## Automated (required — no skipped suites)

```powershell
cd C:\Projects\ai-governance-hub\aigovernancehub-website

$env:RAZORPAY_KEY_SECRET = "test-secret"
$env:SESSION_TOKEN_SECRET = "test-session-secret"
$env:RATE_LIMIT_SECRET = "test-rate-secret"

node scripts/run-all-tests.mjs
```

| Suite | Tests |
|-------|------:|
| enterprise-gate-test | 20 |
| launch-hardening-test | 25 |
| customer-journey-test | 16 |
| payment-architecture-test | 6 |
| production-audit-test | 20 |
| resilience-test | 26 |
| v25-workspace-test | 16 |
| v22-report-quality-test | 18 |
| operations-test | 29 |
| staging-validation-test | 17 |
| security-fix-test | 15 |
| performance-smoke-test | 6 |
| **csp-hardening-test** | 17 |
| **accessibility-test** | 32 |
| **Total** | **263** |

## CSP Verification

```powershell
node scripts/apply-csp-v25.14.mjs   # idempotent
node scripts/csp-hardening-test.mjs
```

## Environment

```powershell
node scripts/staging-env-check.mjs
```

## Manual Staging E2E

See `STAGING-E2E-CHECKLIST-v25.10.md` plus:

- [ ] CSP: no console CSP violations on pricing wizard
- [ ] starter-success.html verify + download flow
- [ ] Admin diagnostics + mark_refunded
- [ ] Keyboard nav on mobile menu

## Package

```powershell
node scripts/package-v25.14.mjs
Test-Path .\aigovernancehub-website-v25.14-production-buildout.zip
```

## Regression Rule

**No ignored failures.** Fix or document as accepted risk in PRODUCTION-READINESS-REPORT with owner and target version.
