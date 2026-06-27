# Legal & Trust Report — v25.14 Certification

**Date:** 2026-06-27  

## Static page review

| Page | Present | Notes |
|------|---------|-------|
| Privacy Policy | ✅ | Linked from nav/footer |
| Terms of Service | ✅ | |
| Refund Policy | ✅ | Linked from pricing |
| Security Policy | ✅ | security@ contact |
| Trust Center | ✅ | Enterprise copy aligned |
| FAQ | ✅ | No legal certification claim |
| Responsible disclosure | ✅ | security@ channel |

## Claims hygiene

- FAQ: “Reports do not constitute legal certification” — ✅
- Pricing disclaimer on framework mapping — ✅
- No public bug bounty wording found in static review — ✅

## Infrastructure (from prior security email triage)

| Control | Status | Finding |
|---------|--------|---------|
| CAA DNS | ❌ Not configured | FIND-P8-001 |
| MTA-STS | ❌ Not published | FIND-P8-002 |
| DMARC | Reports received | FIND-P8-003 — routine ops |

## Data retention

Pricing FAQ states 90-day recovery token retention — aligns with code references in resilience tests.

## Status

**Content pass** on static legal pages; **infrastructure hardening open**.
