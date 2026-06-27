# PRODUCTION INFRASTRUCTURE — v25.21

**Scope:** DNS, TLS, headers, CSP, caching — **factual only, nothing faked**  
**Date:** 2026-06-27

---

## Implemented in repository

### `vercel.json` (static assets)

| Header | Value |
|--------|-------|
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| X-XSS-Protection | 0 (v25.21 — modern best practice) |
| Cross-Origin-Opener-Policy | same-origin (v25.21) |

### API (`api/lib/security.js`)

- Content-Security-Policy: `default-src 'none'; frame-ancestors 'none'`
- Cross-Origin-Opener-Policy: same-origin (v25.21)
- X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy

### Page CSP (HTML)

- `script-src` without `unsafe-inline` (verified by csp-hardening-test — 17/17 pass)
- External nav/success scripts for CSP compliance

### TLS

- Provided by Vercel edge (HTTPS enforced via HSTS)

### Compression

- Vercel default Brotli/gzip for static assets

---

## NOT in repository (DNS / mail — configure separately)

| Control | Status | Action required |
|---------|--------|-----------------|
| **CAA** DNS records | ❌ Not in repo | Add CAA restricting CA to Let's Encrypt / Vercel CA |
| **MTA-STS** | ❌ Not in repo | Publish `_mta-sts` + policy file if using custom SMTP |
| **TLS-RPT** | ❌ Not in repo | Add `_smtp._tls` reporting if required by security program |
| **DMARC** | ❌ Not verified in repo | Configure for `@aigovernancehub.ai` mail |
| **WAF** | ❌ Not codified | Vercel Firewall / Cloudflare if required |

These are **infrastructure tasks**, not application code. Do not claim implementation until DNS records exist.

---

## Production deployment status

| Check | Expected | Observed (pre-deploy) |
|-------|----------|----------------------|
| `/api/health` | 200 + version 25.21 | **404** on production |
| `/api/pricing` | 200 | **404** on production |
| Security headers on live | Match vercel.json | **Unverified** — stale deploy |

---

## Cache headers

- Dashboard API: `private, max-age=30`
- Downloads: `no-store`
- Health: no aggressive public cache (appropriate)

---

## Infrastructure Readiness Score: **58 / 100**

Headers in code are strong; DNS mail security and live deploy are incomplete.

---

## Pre-launch checklist (infra)

```powershell
# Deploy v25.21 (see GO-NO-GO)
vercel --prod

# Verify headers
curl -I https://aigovernancehub.ai/
curl -I https://aigovernancehub.ai/api/health

# DNS (manual, outside repo)
# - CAA records for aigovernancehub.ai
# - DMARC: _dmarc.aigovernancehub.ai
# - MTA-STS if custom mail domain
```
