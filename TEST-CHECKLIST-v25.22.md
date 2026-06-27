# TEST CHECKLIST — v25.22

**Date:** 2026-06-27

---

## Automated (required before release)

```powershell
Set-Location c:\Projects\ai-governance-hub\aigovernancehub-website
node scripts/run-all-tests.mjs
```

| Priority | Suites | Expected |
|----------|--------|----------|
| P0 Security | security-fix, production-audit, resilience, csp-hardening, journey-security-round | PASS |
| P1 Journey | customer-journey, business-language, business-excellence | PASS |
| P2 Commercial | payment-architecture, enterprise-gate, launch-hardening | PASS |
| P3 Ops | operations, staging-validation | PASS |
| P4 Performance | performance-smoke | PASS |
| P5 A11y | accessibility | PASS |

**Total: 17/17 suites**

---

## Manual — business excellence

- [ ] Homepage dual-product cards visible
- [ ] pricing#enterprise-buying answers 6 procurement questions
- [ ] Procurement page shows 6-step sales workflow
- [ ] Support "After you purchase" section complete
- [ ] Success page lists invoice + upgrade paths
- [ ] Dashboard customer success path visible when signed in
- [ ] No "AI candidate" on primary customer pages

---

## Manual — security (no regression)

- [ ] Upload &gt;5 MB rejected
- [ ] Payment verify rejects bad signature
- [ ] Download requires valid token
- [ ] Admin requires API key

---

## Manual — commercial

- [ ] Free preview before checkout
- [ ] No fake urgency elements
- [ ] Order total from server before Razorpay opens

---

## Sign-off

| Role | Automated | Manual |
|------|-----------|--------|
| Security | ✅ | ⏳ post-deploy |
| Customer Success | ✅ | ⏳ |
| Sales | ✅ | ⏳ |
| Executive | ✅ | ⏳ |
