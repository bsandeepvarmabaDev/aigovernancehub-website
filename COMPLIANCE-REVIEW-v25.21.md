# COMPLIANCE REVIEW — v25.21

**Scope:** Privacy, Security, Refund, Terms, Support, Trust Center consistency  
**Date:** 2026-06-27

---

## Certification claims audit

| Claim | Where | Verdict |
|-------|-------|---------|
| SOC 2 Type II certified | Not claimed (Trust Center lists as **not** claimed) | ✅ Factual |
| ISO 27001 certified | Not claimed | ✅ Factual |
| HIPAA BAA via software alone | Explicitly disclaimed | ✅ Factual |
| GDPR "certified" | Not claimed | ✅ Factual |
| Framework mapping in reports | EU AI Act, ISO 42001, NIST AI RMF | ✅ Factual lens, not attestation |

### Fixed in v25.21

- **Homepage (`index.html`):** Removed "GDPR, HIPAA, SOC 2, ISO 27001 mapping context" — replaced with factual framework names that match Trust Center tone.

### Industry report lens (acceptable)

- `industry-models.js` references HIPAA/SOC 2 as **regulatory lens for healthcare/finance reports** — contextual guidance, not product certification. Aligns with Trust Center "do not upload PHI" guidance.

---

## Cross-page consistency

| Page | Privacy | Security | Refund | Retention | Enterprise |
|------|---------|----------|--------|-----------|------------|
| Privacy Policy | ✅ | — | — | 90-day reports stated | — |
| Security Policy | — | ✅ | — | — | Contact security@ |
| Refund Policy | — | — | ✅ | — | — |
| Terms | ✅ | ✅ | ✅ | ✅ | Enterprise path |
| Support | ✅ | Links | ✅ | ✅ | Escalation path |
| Trust Center | ✅ | ✅ | — | ✅ | Honest non-claims |
| Enterprise Procurement | — | Questionnaire path | — | — | SOC2 FAQ honest |

**No contradictions found** between legal pages and Trust Center after v25.21 homepage fix.

---

## Unsupported claims check

| Statement | Supported? |
|-----------|------------|
| "Encrypted in transit (TLS)" | ✅ Standard HTTPS |
| "Reports retained 90 days" | ✅ `retention.js` |
| "Audit logs 365 days" | ✅ Configurable retention |
| "We do not sell your data" | ✅ Stated in privacy policy |
| "SOC 2 certified" | ❌ Correctly NOT stated |

---

## Compliance Score: **82 / 100**

Deductions: no published DPA template in repo (-8), no formal privacy impact assessment document (-5), production not reflecting policies (-5).

---

## Recommendation

Marketing and legal copy is **honest and internally consistent** at v25.21. Do not add certification badges without contractual evidence.
