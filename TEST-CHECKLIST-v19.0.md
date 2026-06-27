# Test Checklist — v19.0 Enterprise Guided Assessment

**Date:** 2026-06-27  
**Rule:** Test only after implementation — no code changes during testing.

## P0 — Security

- [ ] Missing required columns rejected server-side (400)
- [ ] Security scan rejects malicious CSV content
- [ ] create-order returns 403 for >50 work items (Professional+)
- [ ] create-order returns 403 when called directly for enterprise session
- [ ] No Razorpay secrets in frontend
- [ ] HMAC verification still required for download
- [ ] Rate limits still active on upload/create-order

## P1 — Functional

### Wizard flow
- [ ] Step 1: Source selection enables export step
- [ ] Step 2: Instructions change per source (Jira vs Azure DevOps)
- [ ] Step 2: Sample downloads work
- [ ] Step 3: Upload blocked without source selected
- [ ] Valid sample Jira CSV → compatibility score shown
- [ ] Valid file ≤50 items → preview + checkout enabled
- [ ] File >50 items → enterprise/pro gate, no checkout button
- [ ] Missing columns → friendly error with column names
- [ ] Duplicate columns → friendly error
- [ ] Empty file → friendly error

### Preview
- [ ] AI candidates, governance score, risk summary displayed
- [ ] Executive summary visible
- [ ] Framework mapping visible
- [ ] Top opportunities visible
- [ ] Locked features listed (recommendations, PDF, heatmaps)

### Payment
- [ ] Button reads "Unlock Your Assessment" (not "Buy ₹199")
- [ ] Starter checkout opens Razorpay at 19900 paise
- [ ] Payment → verify → download still works end-to-end

## P2 — User Journey

- [ ] User never needs to guess export format
- [ ] Required fields explain WHY
- [ ] Enterprise users see Contact Sales / Request Demo
- [ ] FAQ answers all 10 specified questions
- [ ] Trust block visible before payment

## P3 — UI

- [ ] Wizard step indicator updates
- [ ] Source cards show selected state
- [ ] Compatibility panel styled correctly
- [ ] Enterprise gate visible for large uploads
- [ ] Keyboard focus on source buttons and upload

## Verdict template

| Area | Verdict |
|------|---------|
| Overall | |
| P0 Security | |
| P1 Functional | |
| P2 User Journey | |
| P3 UI | |
