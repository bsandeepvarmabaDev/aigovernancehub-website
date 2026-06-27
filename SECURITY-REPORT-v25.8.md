# SECURITY REPORT — v25.8

**Score: 87/100** (+2 from v25.7)

## Improvements

| Area | Change |
|------|--------|
| Secret isolation | Six purpose-specific signing secrets |
| Rate limits | Fail-closed (503) instead of fail-open |
| Webhook | HMAC-verified Razorpay reconciliation |
| Auth | Magic link uses `AUTH_TOKEN_SECRET` |
| Download | Blocked during generating/refunded states |

## Unchanged (v25.7 protections)

- Signature-first payment verification
- pendingCheckout + amount binding
- Email-verified recovery (no token leak)
- Admin fail-closed auth

## New env vars (security)

See `DEPLOY-v25.8.ps1` — rotate secrets independently per runbook.

## Rotation procedure

1. Set new purpose secret (e.g. `DOWNLOAD_TOKEN_SECRET`)
2. Keep `RAZORPAY_KEY_SECRET` as legacy fallback until tokens expire
3. Deploy; validation accepts both during overlap
4. Remove legacy fallback after TTL elapsed

## Remaining P1

- CSP unsafe-inline
- Admin shared API key (no MFA)
- Webhook raw-body on Vercel (verify in staging)
