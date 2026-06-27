# Test Checklist — v24.0 Enterprise Intelligence Platform

**Priority:** P0 Security → P1 Functional → P2 Intelligence → P3 Performance  
**Mode:** TEST ONLY during QA pass

---

## Automated

| # | Command | Expected |
|---|---------|----------|
| A1 | `node scripts/v24-intelligence-test.mjs` | All PASS |
| A2 | `node scripts/v22-report-quality-test.mjs` | 18/18 PASS |
| A3 | `node scripts/v23-enterprise-review.mjs` | PASS (UX regression) |

---

## P0 — Security

| # | Test | Pass criteria |
|---|------|---------------|
| S1 | Portfolio without auth | 401 |
| S2 | Action PATCH without auth | 401 |
| S3 | Portfolio for user A cannot see user B data | Isolated |
| S4 | Benchmark API/UI | No peer averages displayed |
| S5 | `/api/health` | `"version":"24.0"` |

---

## P1 — Functional

| # | Test | Pass criteria |
|---|------|---------------|
| F1 | Upload with industry=healthcare | Session stores industry |
| F2 | Complete payment | Report has intelligenceSnapshot |
| F3 | Dashboard portfolio tab | KPIs populate |
| F4 | Two assessments same email | Trend shows improving/declining |
| F5 | Action tracker | Recommendations seeded; PATCH updates |
| F6 | CSV export | Valid CSV with headers |
| F7 | PPTX download | 18-slide board deck opens |
| F8 | Legacy report (no snapshot) | Dashboard still loads with fallback |

---

## P2 — Enterprise Intelligence

| # | Test | Pass criteria |
|---|------|---------------|
| I1 | Project comparison table | All assessments listed |
| I2 | Department rankings | Merged across reports |
| I3 | Portfolio heatmap | Critical/high/medium/low counts |
| I4 | Customer value tab | Time saved + completion rate |
| I5 | Industry framing in report | Healthcare regulatory lens in HTML/PPTX |
| I6 | Admin analytics | Platform block with revenue/plans |

---

## P3 — Performance

| # | Test | Pass criteria |
|---|------|---------------|
| P1 | Second portfolio load within 60s | Faster or cache hit |
| P2 | Dashboard lazy images | Network shows lazy |
| P3 | Mobile dashboard tabs | Usable at 375px |

---

## Verdict template

| Verdict | Result |
|---------|--------|
| Overall | |
| Security | |
| Functional | |
| Enterprise Intelligence | |
| Performance | |

---

## Deliverables

- [ ] `CHANGELOG-v24.0.md`
- [ ] `SECURITY-REPORT-v24.0.md`
- [ ] `ENTERPRISE-INTELLIGENCE-REPORT-v24.0.md`
- [ ] `PERFORMANCE-REPORT-v24.0.md`
- [ ] `TEST-CHECKLIST-v24.0.md`
- [ ] `aigovernancehub-website-v24.0.zip`
