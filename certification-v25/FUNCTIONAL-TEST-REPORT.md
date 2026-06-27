# Functional Test Report — v25.14 Certification

**Date:** 2026-06-27  

## Self-service journey (25 / 100 / 500 / 1000 items)

| Step | Local static UI | API/automated | Live E2E |
|------|-----------------|---------------|----------|
| 1 Homepage | ✅ | ✅ CJ tests | ❌ prod |
| 2 Pricing navigation | ✅ | ✅ | ❌ prod |
| 3 Assessment/upload | ✅ wizard | ✅ upload parser | ❌ |
| 4 Sample download | ✅ links | ✅ sample files | ❌ |
| 5 Upload valid file | UI only | ✅ matrix | ❌ |
| 6 Validation progress | UI hooks | ✅ | ❌ |
| 7 Compatibility results | UI | ✅ | ❌ |
| 8 Preview | UI | ✅ preview locked | ❌ |
| 9 Detected plan | copy | ✅ tier detection* | ❌ |
| 10 Order summary | copy | ✅ quote tests | ❌ |
| 11 Confirm checkout | UI | static | ❌ |
| 12 Razorpay checkout | N/A | N/A | ❌ blocked |
| 13–22 Payment/report/email | N/A | partial code | ❌ blocked |
| 23–28 Login/dashboard/repeat | UI links | static tests | ❌ |

\*Tier detection: enterprise-gate uses **1000** threshold; full-round harness has stale expectations for business_plus bands.

## Enterprise journey (1001+)

| Check | Automated | Live |
|-------|-----------|------|
| No Razorpay checkout | ✅ G2, LH-ent-1001 | ❌ |
| Enterprise message UI | ✅ browser snapshot | ❌ prod |
| Request form fields | ✅ snapshot | ❌ |
| Admin queue | ✅ files present | ❌ |
| Bypass create-order | ✅ static tamper tests | ❌ |

## Automated suite results

```
run-all-tests: 281/287 PASS (6 env secret failures)
full-round-test: 113/127 PASS
```

## Findings

- **FIND-P1-001** Full E2E not completed
- **FIND-P1-002** Enterprise admin flow not live-tested
- **FIND-P1-003** Stale harness expectations

## Status

Functional certification **partial pass** on codebase; **fail** on production E2E.
