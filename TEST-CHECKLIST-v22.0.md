# Test Checklist — v22.0 Enterprise Intelligence Report

**Rule:** Test only during QA cycles — use this checklist before deployment.

**Priority:** P0 Security → P1 Functional → P2 Intelligence → P3 UI

---

## P0 — Security (Highest Priority)

- [ ] Report generation occurs only server-side (verify-payment)
- [ ] No report content generated in browser JavaScript
- [ ] Session token HMAC validation on checkout/download
- [ ] Razorpay signature verification unchanged
- [ ] Download requires valid recovery/success token
- [ ] Format parameter gated by `availableFormats` server record
- [ ] Rate limits active on upload, verify, download, recover
- [ ] Audit log entries for REPORT_GENERATED and REPORT_DOWNLOADED
- [ ] No pricing secrets in frontend bundle
- [ ] XSS upload scan still blocks malicious CSV content

---

## P1 — Functional Correctness

### Upload → Assessment
- [ ] Sample Jira CSV uploads successfully
- [ ] Session stores `executiveAssessment` object
- [ ] Preview shows v22 locked features list
- [ ] Governance score in preview matches executive assessment

### Payment → Generation
- [ ] verify-payment generates HTML, TXT, PDF, DOCX, PPTX
- [ ] Report record includes `availableFormats: ["html","text","pdf","docx","pptx"]`
- [ ] Report record includes `governanceScore` and `reportVersion: "22.0"`
- [ ] Legacy sessions without executiveAssessment fall back to v21 formats

### Download
- [ ] HTML download works (dashboard + recover)
- [ ] PDF download returns valid PDF
- [ ] DOCX opens in Word
- [ ] PPTX opens in PowerPoint (13 slides)
- [ ] Text download works
- [ ] Invalid format rejected or defaulted safely

### Email
- [ ] Email subject includes governance score
- [ ] Email body includes executive summary + top recommendation
- [ ] Email lists available formats
- [ ] Dashboard link included

### Dashboard
- [ ] Latest governance score banner displays
- [ ] All format download buttons render
- [ ] Plan label shown (not hardcoded "Starter Report")

---

## P2 — Intelligence Quality

- [ ] Governance score has 5 dimensions with WHY text
- [ ] Department analysis matches project count in upload
- [ ] AI opportunity matrix populated when AI keywords present
- [ ] Business impact section lists assumptions explicitly
- [ ] No single invented dollar figure without range/assumption
- [ ] Maturity level matches composite score logic
- [ ] Executive insights change between 5-item vs 100-item uploads
- [ ] Recommendations include priority (P0/P1/P2)
- [ ] Framework mapping shows compliant/partial/missing
- [ ] Risk heatmap categorizes by band

### Automated
- [ ] `node scripts/v22-report-quality-test.mjs` — 18/18 PASS

---

## P3 — UI / Report Design

- [ ] HTML report: cover page, sections, progress bars
- [ ] HTML report: print-friendly (@media print)
- [ ] HTML report: heatmap color coding
- [ ] PPTX: readable on 16:9 projector
- [ ] Dashboard format buttons wrap on mobile
- [ ] Recover page shows multi-format buttons

---

## Verdict Template

| Area | Verdict |
|------|---------|
| Overall | |
| P0 Security | |
| P1 Functional | |
| P2 Intelligence | |
| P3 UI | |
| Commercial Readiness | |
