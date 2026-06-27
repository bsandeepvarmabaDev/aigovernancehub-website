# TEST CHECKLIST — v25.18

**Date:** 2026-06-27  
**Mandatory regression after persona-driven changes**

---

## Automated

```powershell
Set-Location c:\Projects\ai-governance-hub\aigovernancehub-website
node scripts/run-all-tests.mjs
node scripts/full-round-test.mjs
```

**Baseline:** 7/15 suite failures expected locally (signing secrets unset). No new failures from v25.18 HTML/CSS changes.

---

## v25.18 Messaging Verification

- [ ] Homepage `#consulting-alternative` table renders
- [ ] Trust Center — Security review package section
- [ ] Trust Center — `#regulated-industries` anchor works from pricing upload panel
- [ ] Trust Center — Deployment scale section
- [ ] Trust Center — What we do not claim (no false SOC2)
- [ ] Enterprise procurement — 10 FAQ items expand
- [ ] Pricing upload panel — CISO review link
- [ ] Footer version probe shows 25.18 after deploy

---

## Persona Journey (Manual)

- [ ] **CEO** — 30s clarity + consulting table
- [ ] **CISO** — security review pack complete
- [ ] **Procurement** — FAQ answers PO/currency/SOC2
- [ ] **Healthcare** — PHI redaction warning visible
- [ ] **Startup CTO** — wizard to preview without blockers
- [ ] **Marketplace customer** — website vs app FAQ clear

---

## Security Regression (P0)

- [ ] No new inline scripts on hardened pages
- [ ] Payment verify unchanged
- [ ] Download signing unchanged
- [ ] Enterprise gate at 1000 unchanged

---

## Post-Deploy

```powershell
Invoke-RestMethod -Uri "https://aigovernancehub.ai/api/health"
Invoke-WebRequest -Uri "https://aigovernancehub.ai/pricing" -Method Head
Invoke-WebRequest -Uri "https://aigovernancehub.ai/enterprise-procurement" -Method Head
```

Expected: health version 25.18; pricing and procurement 200.
