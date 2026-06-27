# TEST CHECKLIST — v25.13

## Automated Suites (all required)

```powershell
cd c:\Projects\ai-governance-hub\aigovernancehub-website
node scripts/run-all-tests.mjs
```

| Suite | Script |
|-------|--------|
| Enterprise gate | `enterprise-gate-test.mjs` |
| Launch hardening | `launch-hardening-test.mjs` |
| Customer journey | `customer-journey-test.mjs` |
| Payment architecture | `payment-architecture-test.mjs` |
| Production audit | `production-audit-test.mjs` |
| Resilience | `resilience-test.mjs` |
| Workspace | `v25-workspace-test.mjs` |
| Report quality | `v22-report-quality-test.mjs` |
| Operations | `operations-test.mjs` |
| Staging validation | `staging-validation-test.mjs` |
| Security fix | `security-fix-test.mjs` |
| Performance smoke | `performance-smoke-test.mjs` |

## Staging Manual E2E

### Environment
- [ ] `node scripts/staging-env-check.mjs` passes on staging

### API Smoke
- [ ] GET `/api/health` → 25.13
- [ ] GET `/api/pricing`
- [ ] POST `/api/upload-report` (sample CSV)
- [ ] POST `/api/order-quote`
- [ ] POST `/api/create-order` (test mode)
- [ ] POST `/api/verify-payment`
- [ ] GET `/api/download-report` (blocked then allowed)
- [ ] POST `/api/recover-reports`
- [ ] GET `/api/dashboard` (authenticated)
- [ ] POST `/api/razorpay-webhook` (signature test)

### Razorpay Test Mode
- [ ] Order create
- [ ] Payment success
- [ ] Invalid signature rejected
- [ ] Duplicate verify idempotent
- [ ] Webhook replay idempotent
- [ ] Cancelled / failed states

### Enterprise Gate
- [ ] 1000 items → self-serve
- [ ] 1001 items → enterprise only
- [ ] No Razorpay order for enterprise gate
- [ ] Enterprise request + sales email

### Report Flow
- [ ] HTML, PDF, DOCX, PPTX generated
- [ ] Download blocked before payment
- [ ] Download after verified payment

## Package Verification

```powershell
node scripts/package-v25.13.mjs
Test-Path aigovernancehub-website-v25.13-production-readiness.zip
```

## Accepted Risks

Document any failing test with owner and target version in RELEASE-CANDIDATE-PREP-v25.13.md.
