# Test Checklist — v25.0 Governance Workspace

**Priority:** P0 Security → P1 Functional → P2 Workspace → P3 UI  
**Mode:** TEST ONLY during QA

## Automated

```bash
node scripts/v25-workspace-test.mjs
node scripts/v24-intelligence-test.mjs
node scripts/v22-report-quality-test.mjs
```

## P0 — Security

| # | Test | Pass criteria |
|---|------|---------------|
| S1 | GET /api/workspace without auth | 401 |
| S2 | GET /api/workspace-export without auth | 401 |
| S3 | PATCH task for another user's ID | 404 or no cross-tenant access |
| S4 | /api/health | version 25.0 |

## P1 — Functional

| # | Test | Pass criteria |
|---|------|---------------|
| F1 | Complete assessment → sign in | Tasks auto-created |
| F2 | Update task status to completed | Persists on reload |
| F3 | Add comment with @mention | Stored on task |
| F4 | Two assessments | Re-assess tab shows delta |
| F5 | Export JSON | Valid workspace JSON |
| F6 | Export CSV/Excel/PDF/PPTX | Files download |

## P2 — Workspace

| # | Test | Pass criteria |
|---|------|---------------|
| W1 | Kanban columns | 4 columns with correct counts |
| W2 | Project health tab | Health score + overdue |
| W3 | Score history | Timeline lists assessments |
| W4 | Effectiveness | Rows for completed tasks |
| W5 | Management report | Weekly HTML opens |
| W6 | REST manifest | `/api/v1-workspace?manifest=1` returns integrations |

## P3 — UI

| # | Test | Pass criteria |
|---|------|---------------|
| U1 | Mobile kanban | Usable at 375px |
| U2 | Task detail panel | All fields editable |

## Verdict template

| Verdict | Result |
|---------|--------|
| Overall | |
| Security | |
| Functional | |
| Workspace | |
| Commercial | |

## Deliverables

- [ ] CHANGELOG-v25.0.md
- [ ] SECURITY-REPORT-v25.0.md
- [ ] WORKSPACE-REPORT-v25.0.md
- [ ] TEST-CHECKLIST-v25.0.md
- [ ] aigovernancehub-website-v25.0.zip
