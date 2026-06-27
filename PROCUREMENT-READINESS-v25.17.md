# PROCUREMENT READINESS — v25.17

**Date:** 2026-06-27  
**Scope:** P4 — Enterprise procurement; document only what exists

---

## New Page: `enterprise-procurement.html`

Clean URL: `/enterprise-procurement` (vercel rewrite)

### Documented Capabilities (Factual)

| Topic | What we state | Exists in product? |
|-------|---------------|-------------------|
| Pricing approach | From ₹199 self-serve; server-calculated tiers | ✅ |
| Enterprise threshold | 1,001+ work items → sales quote | ✅ (enterprise gate) |
| Self-service payment | Razorpay; no card storage | ✅ |
| Invoice & PO | Via sales@aigovernancehub.ai | ✅ (manual/sales process) |
| Deliverables | HTML, PDF, Word, PPT | ✅ |
| Retention | 90-day reports (Trust Center) | ✅ |
| Support SLAs | 1 business day general; 1–2 enterprise sales | ✅ (documented) |
| Refunds | refund-policy.html | ✅ |
| Security contact | security@aigovernancehub.ai | ✅ |
| AI training | Uploads not used for third-party model training | ✅ (privacy/trust) |
| Enterprise workflow | Upload → gate → quote → pay → deliver | ✅ |

### Not Claimed (Correct)

- SOC 2 Type II certification
- Automated PO portal
- Net-30 invoicing without sales contact

---

## Procurement Team Checklist

1. Download Trust Center + Security Policy PDFs (HTML print)
2. Review `enterprise-procurement.html`
3. Confirm scope (work item count) before quote
4. Route PO questions to sales@aigovernancehub.ai
5. Security questionnaire: security@aigovernancehub.ai

---

## Operations (P9)

| Team | Responsibility | Documentation |
|------|----------------|---------------|
| Support | Recover reports, download issues | support.html, recover-report.html |
| Sales | Enterprise quotes, PO, invoices | enterprise-procurement.html, pricing enterprise gate |
| Finance | Razorpay reconciliation, refunds | refund-policy.html, admin portal |
| Security | Incidents, disclosure | security-policy.html, trust-center.html |
| Admin | Refund/retry/enable download | admin portal (unchanged) |

---

## Verdict

**Procurement readiness (repository):** ✅ Factual enterprise procurement page exists.  
**Production:** ❌ Page not live until deploy.
