# Changelog — v22.0 Enterprise Intelligence Report

**Release focus:** Transform generated reports from automated summaries into consulting-grade executive assessments. No new website pages. No checkout/payment/auth redesign.

## Added

### Executive Intelligence Engine (`api/lib/executive-intelligence.js`)
- 12-section consulting-grade assessment structure
- Governance score breakdown (5 dimensions × 20 pts) with documented WHY for each
- AI Opportunity Matrix (Highest ROI, Highest Risk, Quick Wins, Long-term)
- Business impact modeling with explicit assumptions (no invented financial guarantees)
- Department/project analysis with strengths, weaknesses, recommendations
- Framework mapping: ISO 42001, NIST AI RMF, Internal Governance, Responsible AI
- Risk heatmap (Critical / High / Medium / Low) with impact, likelihood, priority
- Executive roadmap (30 / 60 / 90 days)
- AI Governance Maturity model (Initial → Optimized) with rationale
- Contextual executive insights (rule-based, not templated filler)
- Structured recommendations with Why, Business Benefit, Priority, Impact

### Report Formats (`api/lib/report-html-v22.js`, `api/lib/report-export-v22.js`)
- **HTML** — consulting layout with progress bars, heatmap tables, print-friendly CSS
- **PDF** — server-side generation via PDFKit
- **DOCX** — Word executive report via `docx`
- **PPTX** — 13-slide executive deck via `pptxgenjs` (CIO/CEO/Board suitable)

### Delivery Pipeline
- Upload stores `executiveAssessment` in session (server-side only)
- Payment verification generates all five formats atomically
- Storage keys for PDF, DOCX, PPTX blobs
- Download API supports `html`, `text`, `pdf`, `docx`, `pptx` with format gating
- Email includes executive summary, governance score, top recommendation, format list
- Dashboard shows latest score, plan label, multi-format download buttons
- Recover flow supports all available formats

### Dependencies
- `docx`, `pdfkit`, `pptxgenjs`

### Testing
- `scripts/v22-report-quality-test.mjs` — 18 automated quality checks

## Changed
- `report-engine.js` — v22 preview locked features; delegates to executive generators when assessment present
- `upload-report.js` — builds executive assessment at upload time
- `verify-payment.js` — v22 multi-format generation
- `download-report.js` — v22 format support
- `dashboard.js` / `dashboard.html` — score banner + format downloads
- `recover-reports.js` / `recover-report.js` — format metadata
- `email.js` — executive summary email content
- `health.js` / `pricing.js` — version 22.0

## Security (unchanged principles, extended coverage)
- All report generation remains server-side
- HMAC session tokens, signed downloads, rate limiting, audit logs preserved
- No client-side report generation
- No secrets in frontend
- Business impact figures labeled as planning estimates with methodology

## Not in scope (by design)
- No new marketing pages
- No checkout redesign
- No payment flow changes
- No authentication changes
- No deployment (files only)
