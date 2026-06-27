# CHANGELOG — v25.21 Final Security, Compliance & Enterprise Certification

**Release type:** Engineering certification (no feature sprint)  
**Date:** 2026-06-27

## Summary

v25.21 is the final engineering certification pass before Release Candidate. Security and compliance hardening only — no new features, UI redesign, pricing changes, or business logic changes.

## Security fixes

| Area | Change |
|------|--------|
| `api/upload-report.js` | Reject oversized base64 payloads **before** decode (DoS / memory abuse mitigation) |
| `api/download-report.js` | Sanitize `Content-Disposition` filename (header injection hardening) |
| `api/lib/security.js` | Add `Cross-Origin-Opener-Policy: same-origin` on API responses |
| `vercel.json` | Add `X-XSS-Protection: 0`, `Cross-Origin-Opener-Policy: same-origin` on static assets |
| `api/lib/ops-readiness.js` | Expose factual `securityPosture` in public readiness (no secrets) |
| `api/health.js` | Surface `securityPosture`; version **25.21** |

## Compliance fixes

| Area | Change |
|------|--------|
| `index.html` | Removed implied SOC 2 / ISO 27001 / HIPAA / GDPR certification wording; replaced with factual framework mapping (EU AI Act, ISO 42001, NIST AI RMF) |

## Test infrastructure

| File | Change |
|------|--------|
| `scripts/security-fix-test.mjs` | CI-safe signing secret bootstrap for purpose-specific token tests |
| Version assertion scripts | Updated to expect **25.21** |

## Version bumps

**25.21** in: `api/health.js`, `api/pricing.js`, `api/dashboard.js`, `api/admin-actions.js`, `api/admin-analytics.js`, `assets/js/site-trust-footer.js`, `api/lib/report-html-v22.js`

## Certification deliverables

- `FINAL-SECURITY-AUDIT-v25.21.md`
- `OWASP-REVIEW-v25.21.md`
- `COMPLIANCE-REVIEW-v25.21.md`
- `ENTERPRISE-CERTIFICATION-v25.21.md`
- `OPERATIONS-SECURITY-v25.21.md`
- `PRODUCTION-INFRASTRUCTURE-v25.21.md`
- `LAUNCH-CERTIFICATION-v25.21.md`
- `GO-NO-GO-v25.21.md`
- `TEST-CHECKLIST-v25.21.md`

## Package

`aigovernancehub-website-v25.21-final-certification.zip`
