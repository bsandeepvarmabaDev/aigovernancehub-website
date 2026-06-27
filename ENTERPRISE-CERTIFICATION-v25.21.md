# ENTERPRISE CERTIFICATION — v25.21

**Audience:** Enterprise procurement, regulated industries, CIO/CISO  
**Date:** 2026-06-27

---

## Data handling lifecycle

| Phase | Implementation | Messaging accuracy |
|-------|----------------|-------------------|
| **Before upload** | 5 MB limit, CSV/TSV/XLSX allowlist, enterprise gate >1000 items | ✅ Matches FAQ and Trust Center |
| **During upload** | Base64 POST, rate limited, session token issued | ✅ v25.21 pre-decode size cap |
| **Processing** | Server-side parse + metrics; no client-side scoring for billing | ✅ |
| **Storage** | Blob/JSON backend (env-configured); content hash tracked | ✅ |
| **Report generation** | Async with status; download blocked until READY | ✅ v25.19 fix |
| **Downloads** | HMAC token, payment verified, optional email bind on recovery | ✅ |
| **Retention** | Reports ~90 days; sessions ~24h pending | ✅ `retention.js` |
| **Deletion** | Admin `delete_expired`; retention job support | ✅ |
| **Recovery** | Magic link + email match; no token in API response body | ✅ |

---

## Enterprise gate (>1000 work items)

- Self-serve checkout blocked; sales review workflow.
- Enterprise payment link separate from starter flow.
- Procurement page explicitly states no SOC 2 report unless contracted.

---

## Fortune 500 readiness matrix

| Requirement | Status |
|-------------|--------|
| Redacted export guidance | ✅ Trust Center |
| No PHI upload warning | ✅ Trust Center healthcare section |
| Security questionnaire contact | ✅ security@aigovernancehub.ai |
| DPA/BAA on request | ✅ Stated; not self-serve |
| SSO for admin | ❌ Not implemented |
| SOC 2 Type II report | ❌ Not claimed |
| Dedicated tenant / VPC | ❌ Shared SaaS model |
| Data residency choice | ❌ Not offered |

---

## FINAL QUESTION

> Would OpenAI, Microsoft, Atlassian, or JPMorgan trust this application enough to upload **confidential governance exports**?

### Answer: **CONDITIONAL NO → path to CONDITIONAL YES**

| Scenario | Verdict |
|----------|---------|
| Full production Jira/Azure export with secrets, PII, unreleased roadmap | **NO** — no SOC 2, shared infrastructure, admin key in browser |
| **Redacted** export (no PHI/PII/secrets), under **signed DPA**, after **v25.21 deployed** to production | **CONDITIONAL YES** for governance **assessment** use case |
| Enterprise >1000 items with sales contract | **CONDITIONAL YES** with MSA + security review |

### What materially increases trust (already in v25.21 scope)

- Honest Trust Center (no fake badges)
- Payment signature-first + duplicate payment rejection
- Signed downloads + audit trail
- Enterprise gate for large datasets
- Compliance wording fix on homepage

### What procurement would still require (post-RC, not this sprint)

- Third-party penetration test report
- SOC 2 or ISO 27001 if claiming regulated workloads
- Admin SSO + hardware key / IP allowlist
- Customer-managed encryption keys (optional)

---

## Enterprise Trust Score: **65 / 100**

Honest positioning; solid technical controls for SMB/mid-market; not yet Fortune 500 confidential-data tier without contract + redaction policy.
