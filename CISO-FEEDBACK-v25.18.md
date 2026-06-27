# CISO FEEDBACK — v25.18

**Personas:** CISO, Security Architect, VP Engineering (security lens)  
**Focus:** Upload approval, documentation, objections

---

## Would Security Team Approve?

**Conditional yes** for redacted/sanitized pilot after questionnaire review.  
**No** for full production Jira export with secrets/PII until DPA and data flow reviewed.

---

## Documentation Expected vs Available

| Document | Expected | Available |
|----------|----------|-----------|
| Security Policy | ✅ | security-policy.html |
| Privacy / retention | ✅ | privacy.html (90d/24h) |
| Trust Center | ✅ | Enhanced v25.18 |
| Responsible disclosure | ✅ | security-policy.html |
| SOC 2 Type II | Often required | ❌ Not claimed |
| ISO 27001 cert | Often requested | ❌ Not claimed |
| Pen test executive summary | Often requested | ❌ Not published |
| Architecture diagram | Expected | ⚠️ Technical docs only |
| Sub-processor list | Expected | ✅ v25.18 (Razorpay, hosting, Forge) |
| DPA template | Expected | Via security@ (not self-serve PDF) |

---

## Remaining Security Objections

1. No SOC 2 report — largest enterprise blocker  
2. Encryption at rest details not in customer-facing diagram  
3. Data residency region not pinned (US/EU/IN)  
4. No bug bounty program documented  
5. Website CSP uses `unsafe-inline` styles (stylesheets) — acceptable but noted  
6. 5 MB limit — users may split exports inconsistently  
7. Support staff access to uploads — “authorized support only” needs access policy doc  

---

## v25.18 Improvements

- **Security review package** — index of all available docs  
- **What we do not claim** — prevents false comfort  
- **Sub-processors** — Razorpay, hosting, Forge  
- **Scale limits** — website vs tenant isolation  
- **Regulated industries** — redaction before upload  

---

## CISO Decision

**BUY AFTER QUESTIONS** — security@ questionnaire + redacted pilot  
**Trust score:** 7/10  
**Security approval probability:** 65% on first submission with v25.18 pack; 85% after DPA negotiation for enterprise tier

---

## Security Team Checklist (Post-Deploy)

- [ ] Verify `/api/health` returns 25.18  
- [ ] Confirm HSTS headers on production  
- [ ] Test signed download tampering rejected  
- [ ] Confirm upload session expiry ~24h  
- [ ] Verify enterprise gate blocks checkout >1000 items
