# TEST CHECKLIST — v25.17

**Date:** 2026-06-27  
**Run on:** Staging after deploy (then production)

---

## P0 — Security (Regression)

- [ ] Auth magic links still expire (15 min)
- [ ] Download URLs still signed; tampered tokens rejected
- [ ] Admin routes still require admin auth
- [ ] CSP unchanged on payment pages
- [ ] No new `unsafe-inline` script on hardened pages

---

## P1 — First-Time User Journey

- [ ] Homepage hero shows value strip without scrolling
- [ ] Homepage CTA → pricing wizard
- [ ] Features → breadcrumb + “What to do next”
- [ ] Sample Files → sample download + wizard link
- [ ] Pricing wizard: Step 1 answers “what next”
- [ ] Preview → checkout flow unchanged
- [ ] Success page: downloads + customer success panel

---

## P2 — Product Maturity

- [ ] Breadcrumbs on features, sample-files, pricing, login
- [ ] Trust footer shows v25.17 on index, pricing, features
- [ ] `/api/health` returns 25.17 (footer probe green)

---

## P3 — Customer Success

- [ ] Success page lists formats + recovery + support + reassess
- [ ] Login page footer + recover link
- [ ] Dashboard welcome panel (v25.16) still functional

---

## P4 — Procurement

- [ ] `/enterprise-procurement` loads (200)
- [ ] All procurement claims match Trust Center / refund policy
- [ ] Sales mailto links work

---

## P5 — Product Identity

- [ ] No user-facing “Starter Report” on index/pricing/success/checkout
- [ ] Homepage differentiation visible above fold

---

## P6 — Report Experience

- [ ] Generate new report; cover shows “Board-Ready Deliverable”
- [ ] PDF/Word export opens without error

---

## P7 — Consistency

- [ ] Footer includes Procurement on index + pricing
- [ ] Nav terminology consistent across legal pages

---

## Automated

```powershell
Set-Location c:\Projects\ai-governance-hub\aigovernancehub-website
node scripts/run-all-tests.mjs
node scripts/full-round-test.mjs
```

Expected: same baseline as v25.16 (6 signing-env failures local OK)

---

## Persona Walkthrough

- [ ] **CEO** — homepage 10-second clarity
- [ ] **CIO** — sample report + executive summary
- [ ] **CISO** — Trust Center + security contact
- [ ] **Procurement** — enterprise-procurement page
- [ ] **Finance** — invoice line item wording
- [ ] **Customer Success** — success page playbook
- [ ] **Support** — recover-report flow
- [ ] **Enterprise customer** — enterprise gate → sales path
- [ ] **Startup customer** — ₹199 tier wizard complete
