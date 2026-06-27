# Test Checklist — v23.0 Enterprise Launch Readiness

**Priority order:** P0 Security → P1 Functional → P2 UX → P3 Performance  
**Rule:** Run automated tests first; manual browser tests on local/staging before production.

---

## Automated

| # | Test | Command | Expected |
|---|------|---------|----------|
| A1 | v23 enterprise review | `node scripts/v23-enterprise-review.mjs` | All PASS |
| A2 | v22 report quality regression | `node scripts/v22-report-quality-test.mjs` | 18/18 PASS |
| A3 | P0 security validate (if present) | `node scripts/p0-security-validate.mjs` | PASS |

---

## P0 — Security

| # | Test | Steps | Pass criteria |
|---|------|-------|---------------|
| S1 | No secrets in browser | View source on pricing.html; search Network for API responses | No keys/tokens in JS |
| S2 | Download without token | POST `/api/download-report` `{}` | 401/403, no file |
| S3 | Invalid session upload | POST upload with forged sessionToken | Rejected |
| S4 | CSP | Recover/login pages | No inline script violations except allowed |
| S5 | Health version post-deploy | GET `/api/health` | `"version":"23.0"` |

---

## P1 — Functional

| # | Test | Steps | Pass criteria |
|---|------|-------|---------------|
| F1 | CSV upload wizard | Complete guided flow with sample CSV | Preview + compatibility pass |
| F2 | Payment verify | Complete test payment (Razorpay test mode) | Success page shows formats |
| F3 | Multi-format download | Download HTML, PDF, DOCX, PPTX, text | Valid files open |
| F4 | Recover by email | Enter checkout email on recover page | Reports listed |
| F5 | Magic link login | Request link; click within 15 min | Dashboard loads |
| F6 | Dashboard downloads | Signed-in user downloads each format | File received |
| F7 | Session expiry | Wait past session TTL; retry checkout | Clear re-upload message |
| F8 | `.xlsx` binary | Upload real Excel binary | Documented limitation or clear error |

---

## P2 — Enterprise UX

| # | Test | Steps | Pass criteria |
|---|------|-------|---------------|
| U1 | Upload progress | Upload file on pricing wizard | Steps + progress bar + ETA |
| U2 | Empty dashboard | New account, no purchases | Welcome + CTA, not "No reports" |
| U3 | Empty recover | Email with no purchases | Guidance + CTA |
| U4 | Error copy | Trigger validation error (bad CSV) | What/why/fix, no "Error:" prefix |
| U5 | Success next steps | Complete purchase | Multi-format buttons + recommended steps |
| U6 | Pending payment | Cancel Razorpay modal | Pending page with clear guidance |
| U7 | Terminology | Dashboard/recover/success | "Executive Assessment" not "Starter Report" |
| U8 | Skip link | Tab on dashboard | Skip to main content works |
| U9 | Toast vs alert | Wizard checkout error | Toast notification, not browser alert |

---

## P3 — Performance & SEO

| # | Test | Steps | Pass criteria |
|---|------|-------|---------------|
| P1 | Lazy images | DevTools → Network on login | Brand icon lazy |
| P2 | Pricing meta | View pricing.html source | Updated description, no stale ₹199 OG |
| P3 | Lighthouse pricing | Lighthouse mobile | Performance > 80 (target) |
| P4 | Reduced motion | OS: reduce motion on | Spinner animation disabled |

---

## Responsive

| Viewport | Pages to check |
|----------|----------------|
| 375px | pricing wizard, dashboard, recover |
| 768px | pricing wizard steps |
| 1280px | dashboard cards |
| 1920px | pricing hero alignment |

---

## Deliverables Verification

- [ ] `CHANGELOG-v23.0.md`
- [ ] `SECURITY-REPORT-v23.0.md`
- [ ] `ENTERPRISE-READINESS-REPORT-v23.0.md`
- [ ] `PERFORMANCE-REPORT-v23.0.md`
- [ ] `TEST-CHECKLIST-v23.0.md`
- [ ] `aigovernancehub-website-v23.0.zip`

---

## Overall Test Verdict Template

| Verdict | Result |
|---------|--------|
| **Overall** | |
| **Security** | |
| **Functional** | |
| **Enterprise Readiness** | |
| **Performance** | |
| **UI** | |

Fill after manual + automated run on target environment.
