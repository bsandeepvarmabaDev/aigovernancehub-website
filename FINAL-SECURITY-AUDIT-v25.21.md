# FINAL SECURITY AUDIT — v25.21

**Auditor perspective:** Fortune 500 CISO, OWASP reviewer, external penetration tester  
**Scope:** Full application — auth, payments, uploads, downloads, admin, enterprise, APIs  
**Date:** 2026-06-27

---

## Executive summary

The **repository at v25.21** demonstrates mature server-side security for a self-serve SaaS assessment product: purpose-specific HMAC tokens, timing-safe comparisons, payment signature verification before fulfillment, fail-closed rate limiting, CSV formula sanitization, and audit logging on sensitive actions.

**Production deployment remains the primary gap** — live site does not match this codebase (health/pricing 404). Security controls in code are not protecting real customers until deployed.

---

## Attack surface reviewed

| Surface | Verdict | Notes |
|---------|---------|-------|
| Authentication (magic link) | **Pass** | Session cookies; `requireAuth` on dashboard; generic recover responses |
| Authorization / IDOR | **Pass** | Dashboard filters by `buyerEmail`; download tokens bind order + payment |
| Sessions | **Pass** | Signed session tokens; expiry; separate auth secret |
| Upload | **Pass (fixed)** | 5 MB limit, extension allowlist, structure validation, rate limit; **v25.21** base64 pre-decode cap |
| Download | **Pass (fixed)** | HMAC tokens, payment state gate, expiry, refund/disable flags; **v25.21** filename sanitization |
| Payment (Razorpay) | **Pass** | Signature-first verify; amount check; duplicate payment_id rejection (409); idempotent replay |
| Webhook | **Pass** | Signature verify; event deduplication |
| Admin portal | **Conditional** | API key auth + audit; **risk:** key stored in browser `sessionStorage` |
| Enterprise gate | **Pass** | >1000 items blocked from self-serve; sales workflow |
| CSRF | **Mitigated** | JSON APIs + SameSite cookies on auth; no state-changing GET |
| XSS | **Mitigated** | CSP without `unsafe-inline` on pages; API `default-src 'none'` |
| SQL injection | **N/A** | JSON blob storage, no SQL |
| SSRF | **Low risk** | Outbound fetch limited to Razorpay API, email provider |
| Path traversal | **Pass** | Storage keys derived from order IDs; no user path input |
| CSV injection | **Pass** | `sanitizeSpreadsheetCell` on export paths |
| Rate limit bypass | **Pass** | Fail-closed without secret |
| JWT tampering | **N/A** | HMAC tokens, not JWT |
| Payment replay | **Pass** | Signature + duplicate detection |
| Email enumeration | **Pass** | Uniform recover response |

---

## Findings

### Fixed in v25.21

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| SEC-001 | Medium | Base64 upload could allocate large buffer before size check | Pre-decode character limit in `upload-report.js` |
| SEC-002 | Low | `Content-Disposition` filename used raw orderId | Alphanumeric sanitization in `download-report.js` |
| SEC-003 | Low | Missing COOP on API/static | Added in `security.js` + `vercel.json` |
| COMP-001 | Medium | Homepage implied SOC2/HIPAA/GDPR certification | Wording corrected on `index.html` |

### Accepted / documented (not code-fixed)

| ID | Severity | Finding | Rationale |
|----|----------|---------|-----------|
| SEC-004 | Medium | Admin API key in `sessionStorage` | Operational control: rotate keys, IP allowlist at edge, short-lived keys |
| SEC-005 | Low | No WAF rules in repo | Vercel/platform layer — document in infrastructure |
| SEC-006 | Info | Zip upload (.xlsx) not zip-bomb scanned | 5 MB cap limits blast radius; enterprise should use redacted exports |
| SEC-007 | Info | No automated SAST/DAST in CI | Recommend post-RC pipeline |

### Not exploitable (reviewed)

- Client-side price tampering — rejected server-side (`rejectClientPricingTamper`)
- Download without payment — blocked by token + `isDownloadReady`
- Cross-order download — paymentId must match token
- Webhook without secret — rejected when secret configured

---

## Penetration test scenarios attempted (logical)

1. **Replay payment verify** — Idempotent for same payment; new payment_id on verified order → 409  
2. **Tamper session token** — Rejected (HMAC)  
3. **Access another user's dashboard** — Requires auth cookie for that email  
4. **Download with expired token** — Rejected  
5. **Upload executable** — Extension rejected  
6. **Upload 50 MB base64** — Rejected at v25.21 pre-decode  
7. **Recover email enumeration** — Same response for unknown email  
8. **Admin action without key** — 401 + audit alert  

---

## Launch Security Score: **78 / 100**

Deductions: production not deployed (-12), admin key in browser (-5), no third-party pen test (-5).

---

## Recommendation

**Repository:** Approve for Release Candidate after deploy to staging and smoke validation.  
**Production:** NO GO until v25.21 is deployed and `/api/health` returns `25.21`.
