# AI Governance Hub Website — Full Testing Report

**Series:** v25 Production (codebase **25.14**)  
**Certification round:** Testing-only — no fixes applied  
**Date:** 2026-06-27  
**Tester role:** First-time visitor, paying customer, enterprise buyer, security researcher, CISO, procurement, finance, support, admin, sales, returning customer  

---

## Executive summary

This certification round combined **automated harnesses (287 cases across 15 suites)**, **upload/security matrix (127 cases)**, **browser walkthrough on local static server**, and **production domain probes**. 

**Verdict:** The **v25.14 codebase is substantially production-ready in code and static UX**, with strong payment/upload gating patterns verified by automated tests. **Production certification cannot be completed** because `https://www.aigovernancehub.ai/api/health` returns **404** and live Razorpay/email/admin flows were not executable in this environment without staging credentials.

| Environment | Version (expected) | Version (observed) | Static UX | API | E2E payment |
|-------------|-------------------|--------------------|-----------|-----|-------------|
| Local static (`localhost:3456`) | 25.14 | N/A (no API) | ✅ v25.14 UX visible | ❌ Not served | ❌ Blocked |
| Production (`aigovernancehub.ai`) | 25.14 | **Unknown** | **Not verified** | **404 on /api/health** | ❌ Blocked |

**Automated totals:** 281/287 pass (run-all-tests), 113/127 pass (full-round-test — several failures are **stale harness expectations**, not confirmed product bugs). See findings below.

**Deliverables in this folder:**
- `TEST-CASE-CATALOG.md` — **1,150** documented cases
- Category reports (Security, Functional, Customer Journey, Look & Feel, Monetization, Accessibility, Performance, Operations, Legal/Trust)
- `OPEN-RISK-REGISTER.md`
- `RECOMMENDED-FIX-BACKLOG.md`
- `screenshots/` — browser captures from local environment

---

## Findings (ranked by priority)

### P0 — Security

| ID | Title | Severity | Area | Status |
|----|-------|----------|------|--------|
| FIND-P0-001 | Production `/api/health` returns 404 | **Critical** | Deployment | Open |
| FIND-P0-002 | Live payment/report gates not verified on production | **High** | Payment security | Open |
| FIND-P0-003 | Live API security matrix not executed against production | **High** | API security | Open |

#### FIND-P0-001 — Production health endpoint unavailable
- **Steps:** `GET https://www.aigovernancehub.ai/api/health`
- **Expected:** JSON `{ version: "25.14", status: "ok", ... }`
- **Actual:** HTTP **404 Not Found** (Vercel)
- **Risk:** Cannot confirm deployed version, readiness probes, or that API routes exist in production. Owner perception of “nothing changed” may be explained by **stale or missing deployment**.
- **Recommendation:** Deploy current v25.14 artifact; verify `/api/health`, `/api/pricing`, and wizard upload path on production before customer certification sign-off.
- **Screenshot:** N/A (HTTP only)

#### FIND-P0-002 — End-to-end payment verification not executed live
- **Steps:** Complete Razorpay test checkout → verify-payment → download-report on staging/production
- **Expected:** No report before verified payment; amount match; idempotent verify
- **Actual:** **Not executed** — requires `RAZORPAY_*`, blob storage, and deployed API
- **Risk:** Code review + 26 resilience tests pass locally, but **live misconfiguration** (webhook secret, amount drift) would bypass certification.
- **Recommendation:** Run staging smoke with Razorpay test keys; include webhook replay and duplicate verify cases.
- **Status:** Open (blocked on environment)

#### FIND-P0-003 — Production API attack surface untested live
- **Steps:** Run API security matrix (200 P0 cases in catalog) against deployed host
- **Expected:** Fail closed, no stack traces, rate limits, CORS/headers
- **Actual:** Blocked by FIND-P0-001
- **Risk:** Static/code tests cannot substitute for live CORS, WAF, and Vercel routing behavior.
- **Recommendation:** After deploy, run `STAGING_URL=... node scripts/full-round-test.mjs` and manual payment bypass attempts.

**P0 code-level positives (automated, local):**
- Enterprise gate at **>1000** work items (20/20 enterprise-gate tests pass)
- Payment signature-first verify, amount check, idempotency (production-audit + resilience)
- CSP script-src without `unsafe-inline` on key pages (17/17 csp-hardening)
- No Razorpay secrets in frontend JS (except benign `key_secret` string match false positive in starter-checkout comment — see FIND-P1-003)
- CSV formula injection sanitizer present

---

### P1 — Functional correctness

| ID | Title | Severity | Area | Status |
|----|-------|----------|------|--------|
| FIND-P1-001 | Full self-service journey not E2E tested (25/100/500/1000) | **High** | Self-service | Open |
| FIND-P1-002 | Enterprise sales portal flow not live-tested | **High** | Enterprise | Open |
| FIND-P1-003 | full-round-test harness stale vs current plan tiers | **Medium** | Test debt | Open |
| FIND-P1-004 | security-fix-test fails locally without signing secrets | **Low** | Test env | Accepted Risk |

#### FIND-P1-001 — Self-service E2E blocked on local static server
- **Steps:** Upload → preview → checkout → pay → download HTML/PDF/DOCX/PPTX → email → dashboard
- **Expected:** All 28 journey steps complete for 25/100/500/1000 item files
- **Actual:** Browser verified **wizard UX and copy** on `localhost:3456`; **API upload/payment/report steps require `vercel dev` or deployed environment**
- **Risk:** Parser/upload logic covered by automated tests; **integration gaps** (blob, email SMTP) remain unproven in this session
- **Recommendation:** Staging certification run with test payment and email capture (Mailhog/Ethereal)

#### FIND-P1-002 — Enterprise journey not live-tested
- **Steps:** Upload 1001/5000/10000 items; submit enterprise form; admin quote/payment/report delivery
- **Expected:** No Razorpay; request persisted; admin actions work
- **Actual:** Gate logic passes automated tests; **admin portal and persistence not exercised live**
- **Recommendation:** Staging run with admin key; verify bypass attempts (create-order on enterprise session) fail

#### FIND-P1-003 — Stale full-round-test expectations
- **Steps:** Run `scripts/full-round-test.mjs`
- **Actual:** 13 failures — e.g. expects `business_plus` tiers at 5000 items, but current gate sends **>1000 to enterprise**; starter tier boundary tests expect 50 items but harness may use wrong project count
- **Risk:** **Test noise**, not necessarily product regression
- **Recommendation:** Update harness to v25.14 tier rules (do after owner approves)

---

### P2 — Customer journey

| ID | Title | Severity | Area | Status |
|----|-------|----------|------|--------|
| FIND-P2-001 | Production may not show v25.14 guided UX | **High** | Deployment/UX | Open |
| FIND-P2-002 | Pricing page combines wizard + long pricing content | **Medium** | Information architecture | Open |
| FIND-P2-003 | Local static: logo broken in narrow/mobile nav | **Medium** | First impression | Open |

#### FIND-P2-001 — Deploy gap explains owner “Starter flow unchanged” feedback
- **Steps:** Compare production site vs local `pricing.html` v25.14
- **Expected:** Progress bar, journey banner, drag-drop zone, score ring, homepage journey strip
- **Actual (local):** ✅ Visible — hero “From export to executive report — guided every step”, 6-step nav, drop zone, step guidance banner
- **Actual (production):** **Not verified** — health 404 suggests site not on current deploy
- **Screenshot:** `screenshots/02-local-pricing-wizard.png`

#### FIND-P2-002 — Wizard + pricing cards on one page
- **Observation:** First-time visitor sees strong wizard guidance at top, but must scroll past extensive pricing/comparison/FAQ to reach secondary CTAs
- **Risk:** Minor cognitive load; enterprise buyers may miss “Website vs Marketplace” panel if they stop after wizard
- **Recommendation:** Consider sticky step progress or anchor jump (future UX — not in this round)

#### FIND-P2-003 — Broken logo asset in mobile nav
- **Steps:** Open homepage at narrow width
- **Actual:** Logo image failed to load; alt text “AI Governance Hub” shown
- **Risk:** Trust reduction on mobile-first visitors
- **Screenshot:** `screenshots/01-local-homepage.png` (mobile nav state)
- **Note:** May be static-server path issue — verify on Vercel deploy

**P2 positives (local browser + automated):**
- Skip link, aria-current on wizard steps, Secure Checkout wording
- Marketplace vs website boundary copy present
- Enterprise warm messaging (“dedicated Enterprise Assessment”, sales email, expected response time in tests)
- Recover report + My Reports linked from pricing

---

### P3 — Look and feel

| ID | Title | Severity | Area | Status |
|----|-------|----------|------|--------|
| FIND-P3-001 | Hero white glow reduces headline readability | **Medium** | Visual polish | Open |
| FIND-P3-002 | Mobile nav occupies full viewport when open | **Low** | Mobile UX | Open |
| FIND-P3-003 | Premium bar vs Stripe/Linear — good but not best-in-class motion | **Low** | Enterprise polish | Accepted Risk |

#### FIND-P3-001 — Hero contrast on pricing wizard
- **Screenshot:** `screenshots/02-local-pricing-wizard.png`
- **Actual:** Strong radial glow obscures sub-headline contrast
- **Recommendation:** Reduce glow opacity or darken text shadow for WCAG contrast

**P3 positives:** Dark navy nav, gradient CTA, assessment wizard badge, step pills, trust lists — materially improved vs pre-v25.14 starter flow in repo history.

---

### P4 — Monetization

| ID | Title | Severity | Area | Status |
|----|-------|----------|------|--------|
| FIND-P4-001 | Static “₹199” card coexists with server-determined plan | **Low** | Pricing clarity | Open |
| FIND-P4-002 | Live checkout amount match not verified | **High** | Payment | Open |

#### FIND-P4-001 — “From” pricing partially addressed
- **Actual:** Hero says plan calculated server-side; pricing card still shows flat “₹199” for Self-Serve Starter Assessment
- **Expected:** Clear “from ₹199” where upload may upgrade tier
- **Risk:** Minor surprise if Professional/Business tier selected after upload
- **Mitigation already present:** Order summary step before Secure Checkout (copy verified in snapshot)

---

### P5 — Accessibility

| ID | Title | Severity | Area | Status |
|----|-------|----------|------|--------|
| FIND-P5-001 | Hero contrast (see FIND-P3-001) | **Medium** | Color contrast | Open |
| FIND-P5-002 | Full keyboard/SR journey not manually audited | **Medium** | A11y | Open |

**Automated:** 32/32 accessibility-test.mjs pass (skip links, lang, focus-visible CSS, live regions, keyboard nav script).

---

### P6 — Performance

| ID | Title | Severity | Area | Status |
|----|-------|----------|------|--------|
| FIND-P6-001 | Live TTFB/LCP not measured on production | **Medium** | Performance | Open |

**Automated smoke (local):** parse 1000 rows **1ms**, quote **0ms**, sanitize bulk **1ms**, 100k metadata sim OK — all within budgets.

---

### P7 — Operations / Admin

| ID | Title | Severity | Area | Status |
|----|-------|----------|------|--------|
| FIND-P7-001 | Admin portal not live-tested | **High** | Operations | Open |

**Automated:** 29/29 operations-test pass (audit events, diagnostics hooks, admin UI actions in source).

---

### P8 — Legal / Trust

| ID | Title | Severity | Area | Status |
|----|-------|----------|------|--------|
| FIND-P8-001 | CAA DNS records not configured | **Medium** | Infrastructure | Open |
| FIND-P8-002 | MTA-STS not published | **Medium** | Email security | Open |
| FIND-P8-003 | DMARC aggregate reports — operational process | **Low** | Email ops | Open |

**Content review (static):** Privacy, Terms, Refund, Security, Trust Center pages exist; FAQ states reports are not legal certification; framework mapping disclaimers on pricing.

---

## Test execution summary

| Suite | Result |
|-------|--------|
| run-all-tests (15 suites) | **281/287 pass** (6 fail: signing secrets not set locally) |
| full-round-test | **113/127 pass** (13 stale/ env failures) |
| Browser local walkthrough | Homepage + Pricing wizard UX verified |
| Production probe | **Failed** — /api/health 404 |
| Test catalog generated | **1,150 cases** |

---

## Certification decision

| Criterion | Status |
|-----------|--------|
| P0 Security (code) | ✅ Strong automated evidence |
| P0 Security (production) | ❌ **Blocked** |
| P1 Functional E2E | ⚠️ Partial — automated only |
| P2 Customer journey (local UX) | ✅ v25.14 improvements visible |
| P2 Customer journey (production) | ❌ Not verified |
| P3 Look & feel | ⚠️ Good locally; minor polish items |
| P4 Monetization | ⚠️ Copy OK; live checkout unverified |
| Sign-off ready | **No — deploy + staging E2E required** |

---

## Next steps (requires owner approval before fixes)

1. **Deploy v25.14** to production; confirm `/api/health` → `25.14`
2. **Staging E2E** — Razorpay test payment, all download formats, email, dashboard, enterprise admin flow
3. **Update stale test harness** (`full-round-test.mjs` tier matrix)
4. **Address FIND-P3-001/P5-001** hero contrast after UX review
5. **Infrastructure hardening** — CAA, MTA-STS (FIND-P8-001/002)

**No code changes were made in this certification round.**
