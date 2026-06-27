# SECURITY REPORT — v25.14

**Verdict:** **PASS** — script CSP hardened; style inline documented

## v25.14 Improvements

| Control | Status |
|---------|--------|
| script-src without unsafe-inline | PASS — all customer HTML |
| External JS only (no inline blocks) | PASS |
| No onclick handlers for nav | PASS |
| API CORP + CSP | PASS |
| Edge headers (vercel.json) | PASS |
| Purpose-specific secrets + _PREVIOUS | PASS |
| Rate limits fail closed | PASS |
| Upload formula/CSV sanitization | PASS |
| Admin auth + audit | PASS |
| Payment signature-first | PASS |

## CSP Posture

| Directive | Value | Notes |
|-----------|-------|-------|
| script-src | `'self'` (+ Razorpay CDN on checkout pages) | No unsafe-inline |
| style-src | `'self' 'unsafe-inline'` | 2 pages use inline style attributes |
| frame-ancestors | `'none'` | Clickjacking protection |

## Cookie / Session

- `agh_session`: HttpOnly, SameSite=Lax, Secure in production, 30-day max-age
- Admin key: sessionStorage only (not a cookie) — cleared on tab close
- Magic-link auth tokens: purpose-specific HMAC, TTL enforced

## Dependency Review

Run before production deploy:

```powershell
cd aigovernancehub-website
npm audit --production
```

Address critical/high findings before v25.25 launch. No new dependencies added in v25.14.

## Remaining (v25.15+)

- style-src hash/nonce (remove last inline style attributes)
- Admin IP allowlist
- Automated pen test on staging
