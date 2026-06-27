# Open Risk Register — v25.14 Certification

**Last updated:** 2026-06-27  
**Status key:** Open | Accepted Risk | Mitigated  

| Risk ID | Related finding | Risk description | Likelihood | Impact | Owner action | Status |
|---------|-----------------|------------------|------------|--------|--------------|--------|
| RISK-001 | FIND-P0-001 | Production API routes not deployed or misrouted — customers cannot complete assessments | High | Critical | Deploy v25.14; verify Vercel routing | **Open** |
| RISK-002 | FIND-P0-002 | Payment/report gates unverified live — misconfigured webhook or amount drift could release reports | Medium | Critical | Staging Razorpay E2E | **Open** |
| RISK-003 | FIND-P2-001 | UX improvements exist in repo but not on production — brand/trust damage | High | High | Deploy + cache bust | **Open** |
| RISK-004 | FIND-P1-001 | Email/report delivery not E2E tested — paid customer may not receive report | Medium | High | SMTP staging test | **Open** |
| RISK-005 | FIND-P7-001 | Admin ops untested live — enterprise requests may stall | Medium | High | Admin staging certification | **Open** |
| RISK-006 | FIND-P8-001/002 | CAA/MTA-STS missing — certificate mis-issuance / email downgrade | Low | Medium | DNS hardening | **Open** |
| RISK-007 | FIND-P3-001 | Hero contrast — accessibility and trust | Medium | Low | UX tweak post-approval | **Open** |
| RISK-008 | FIND-P2-003 | Broken mobile logo — first impression | Medium | Medium | Verify asset path on deploy | **Open** |
| RISK-009 | FIND-P1-003 | Stale test harness — false confidence or missed regressions | Medium | Medium | Update full-round-test | **Open** |
| RISK-010 | FIND-P4-001 | Static ₹199 vs dynamic tier — checkout surprise | Low | Low | Add “from” to card | **Open** |

## Accepted risks (this round)

| Risk ID | Note |
|---------|------|
| RISK-011 | FIND-P1-004 — Local signing secret test failures are CI/env configuration, not production defect |

## Risk heatmap

```
Impact ↑
Critical | RISK-001, RISK-002
High     | RISK-003, RISK-004, RISK-005
Medium   | RISK-006, RISK-008, RISK-009
Low      | RISK-007, RISK-010
           Low ────────────────→ Likelihood
```

**No fixes implemented pending owner review.**
