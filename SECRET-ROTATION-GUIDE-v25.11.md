# SECRET ROTATION GUIDE — v25.11

*(Applicable through v25.13+)*

## Purpose-Specific Secrets

| Purpose | Env Var | Previous Var |
|---------|---------|--------------|
| Session | `SESSION_TOKEN_SECRET` | `SESSION_TOKEN_SECRET_PREVIOUS` |
| Download | `DOWNLOAD_TOKEN_SECRET` | `DOWNLOAD_TOKEN_SECRET_PREVIOUS` |
| Enterprise | `ENTERPRISE_TOKEN_SECRET` | `ENTERPRISE_TOKEN_SECRET_PREVIOUS` |
| Auth | `AUTH_TOKEN_SECRET` | `AUTH_TOKEN_SECRET_PREVIOUS` |
| Rate limit | `RATE_LIMIT_SECRET` | `RATE_LIMIT_SECRET_PREVIOUS` |
| Analytics hash | `ANALYTICS_HASH_SECRET` | `ANALYTICS_HASH_SECRET_PREVIOUS` |

## Zero-Downtime Rotation Procedure

1. **Set previous** — Copy current value to `{NAME}_PREVIOUS` in Vercel env
2. **Set new primary** — Update `{NAME}` to new random 32+ byte secret
3. **Deploy** — Both secrets validate during overlap window
4. **Wait** — Max token TTL (session 2h, recovery 90d — rotate recovery during low traffic)
5. **Remove previous** — Clear `{NAME}_PREVIOUS` after all tokens expired
6. **Verify** — Run `node scripts/security-fix-test.mjs`

## Razorpay Secrets

| Secret | Rotation |
|--------|----------|
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard → update env → redeploy |
| `RAZORPAY_WEBHOOK_SECRET` | Update in Razorpay webhook config + env simultaneously |

**Note:** App tokens should NOT fall back to Razorpay secret in production — set all purpose secrets explicitly.

## Admin API Key

1. Generate new key
2. Update Vercel env `ADMIN_API_KEY`
3. Redeploy
4. Update local admin portal session

No `_PREVIOUS` support — rotation is immediate; old key invalid after deploy.

## Emergency Compromise

1. Rotate affected secret immediately
2. Invalidate active sessions if session secret compromised
3. Review audit logs for admin actions
4. Check Razorpay dashboard for anomalous orders
