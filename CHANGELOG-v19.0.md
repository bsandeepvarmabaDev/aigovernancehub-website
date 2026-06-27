# Changelog — v19.0 Enterprise Guided Assessment Experience

**Release date:** 2026-06-27  
**Scope:** Transform upload flow into a guided enterprise assessment wizard with validation, compatibility checking, and plan detection.

## Summary

v19.0 replaces the bare file-upload UX with a six-step guided assessment: choose source → export instructions → upload → compatibility check → AI preview → unlock. Backend validation enforces required columns, security scanning, and automatic Starter/Professional/Business/Enterprise plan detection. Self-serve Razorpay checkout remains **₹199 (19900 paise)** for Starter tier only (≤50 work items).

## P0 — Security (unchanged + enhanced)

- Server-side file validation: type, encoding, security pattern scan
- No payment trust in frontend; create-order blocks non-Starter plans server-side
- Signed downloads, persistent storage, rate limiting, audit logging, fail closed
- Friendly error messages — no internal stack traces exposed

## P1 — Functional

### Backend
- `api/lib/assessment-config.js` — plan tiers, field definitions, source list
- `api/lib/report-engine.js` — `validateUploadStructure()`, `validateEncoding()`, `runSecurityScan()`, enhanced `buildPreview()`
- `api/upload-report.js` — accepts `source`, returns compatibility + plan + field report
- `api/create-order.js` — rejects Professional/Business/Enterprise uploads (403)
- `api/generate-preview.js` — returns enriched preview with plan metadata

### Frontend
- `assets/js/guided-assessment.js` — full wizard orchestration (replaces starter-checkout on pricing page)
- `pricing.html` — guided wizard UI, expanded FAQ, trust block, "Unlock Your Assessment" CTA
- `samples/` — Jira, Azure DevOps, template CSV, sample report HTML
- `styles.css` — wizard, source cards, compatibility, enterprise gate styles

## P2 — User Journey

| Step | Feature |
|------|---------|
| 1 | Choose source (Jira, Azure DevOps, Excel, CSV) + coming soon |
| 2 | Export instructions + video placeholder + sample downloads |
| 3 | Required/recommended/optional field explanations |
| 4 | Upload with immediate validation |
| 5 | Compatibility score + plan detection |
| 6 | AI preview (executive summary, frameworks, opportunities) + locked features |
| 7 | Enterprise gate (no Razorpay) or unlock with trust + benefits |

## P3 — UI

- Step indicator navigation
- Source selection cards
- Compatibility panel (green) and enterprise gate (amber)
- Locked feature list in preview

## Plan tiers

| Tier | Work items | Self-serve checkout |
|------|------------|---------------------|
| Starter | ≤50 | Yes (₹199) |
| Professional | 51–500 | No — contact sales |
| Business | 501–5,000 | No — contact sales |
| Enterprise | >5,000 OR >5 projects OR >50 MB | No — contact sales |

## Unchanged

- Razorpay amount: **19900 paise**
- HMAC payment verification
- v18 auth, dashboard, admin, analytics

## New files

| File | Purpose |
|------|---------|
| `api/lib/assessment-config.js` | Plans, fields, sources |
| `assets/js/guided-assessment.js` | Wizard client |
| `samples/sample-jira-export.csv` | Jira template |
| `samples/sample-azure-devops.csv` | Azure DevOps template |
| `samples/sample-governance-template.csv` | Blank template |
| `samples/sample-governance-report.html` | Sample output |

## Modified files

| File | Change |
|------|--------|
| `api/lib/report-engine.js` | Validation, compatibility, enriched preview |
| `api/upload-report.js` | Source + structure validation |
| `api/create-order.js` | Plan tier gate |
| `api/generate-preview.js` | Enriched preview |
| `api/health.js` | Version 19.0 |
| `pricing.html` | Guided wizard |
| `styles.css` | Wizard styles |
