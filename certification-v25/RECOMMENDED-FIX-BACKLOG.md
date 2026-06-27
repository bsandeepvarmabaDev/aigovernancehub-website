# Recommended Fix Backlog — v25.14 Certification

**Priority order for approved fixes only.** No work started.

## P0 — Deploy & verify (blockers)

| # | Item | Finding | Effort | Notes |
|---|------|---------|--------|-------|
| 1 | Deploy v25.14 to Vercel production | FIND-P0-001 | S | Confirm `vercel.json` API routes |
| 2 | Verify `/api/health` returns `25.14` | FIND-P0-001 | S | Post-deploy smoke |
| 3 | Staging Razorpay E2E (25/100/500/1000 items) | FIND-P0-002 | M | Test keys + blob + SMTP |
| 4 | Live payment bypass regression suite | FIND-P0-003 | M | Catalog P0-SEC cases |

## P1 — Functional completeness

| # | Item | Finding | Effort |
|---|------|---------|--------|
| 5 | Enterprise admin flow staging test | FIND-P1-002 | M |
| 6 | Email delivery verification (magic link, report ready, enterprise) | FIND-P1-001 | M |
| 7 | Update `full-round-test.mjs` tier matrix to v25.14 | FIND-P1-003 | S |
| 8 | Fix `security-fix-test.mjs` to set test secrets before purpose checks | FIND-P1-004 | S |

## P2 — Customer journey

| # | Item | Finding | Effort |
|---|------|---------|--------|
| 9 | Confirm production shows wizard UX (owner validation) | FIND-P2-001 | S |
| 10 | Fix mobile logo asset path if broken on Vercel | FIND-P2-003 | S |
| 11 | Optional: anchor/jump links for long pricing page | FIND-P2-002 | M |

## P3 — Look & feel / A11y

| # | Item | Finding | Effort |
|---|------|---------|--------|
| 12 | Reduce hero glow / improve headline contrast | FIND-P3-001, FIND-P5-001 | S |
| 13 | Manual keyboard/SR audit | FIND-P5-002 | M |

## P4 — Monetization copy

| # | Item | Finding | Effort |
|---|------|---------|--------|
| 14 | Change static card to “From ₹199” with tier note | FIND-P4-001 | S |

## P8 — Infrastructure

| # | Item | Finding | Effort |
|---|------|---------|--------|
| 15 | Publish CAA records | FIND-P8-001 | S |
| 16 | Publish MTA-STS policy | FIND-P8-002 | S |
| 17 | Document DMARC aggregate handling runbook | FIND-P8-003 | S |

## Post-fix deliverables (when approved)

- Re-run full certification on production
- Update OPEN-RISK-REGISTER statuses
- Package `aigovernancehub-website-v25.14-certified.zip` (only after fixes + re-test)

**Estimated total effort after P0 deploy:** 3–5 engineering days for full E2E + infra hardening.
