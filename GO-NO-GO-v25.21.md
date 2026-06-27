# GO / NO-GO — v25.21 Final Certification

**Date:** 2026-06-27

---

## Decision

| Environment | Decision | Reason |
|-------------|----------|--------|
| **Repository v25.21** | ✅ **GO** (Release Candidate) | 15/15 test suites pass; security fixes applied; compliance aligned |
| **Production (aigovernancehub.ai)** | ❌ **NO-GO** | Deploy lag; `/api/health` returns 404; customers not on v25.x |

---

## Blocking items for production GO

1. Deploy `aigovernancehub-website-v25.21-final-certification.zip` to Vercel production
2. Verify `/api/health` returns `{ "version": "25.21", "securityPosture": {...} }`
3. Verify `/api/pricing` returns 200
4. Smoke: upload → pay (test mode) → download
5. Configure production env: all signing secrets, Razorpay, webhook secret, `ALERT_WEBHOOK_URL`

---

## Non-blocking (post-RC)

- CAA / MTA-STS / TLS-RPT DNS records
- Third-party penetration test
- Admin SSO
- SOC 2 if targeting regulated F500 without red()
- Fix `full-round-test.mjs` plan-tier expectations (test drift, not product bug)

---

## PowerShell deployment commands

```powershell
# From repository root
Set-Location c:\Projects\ai-governance-hub\aigovernancehub-website

# Package (if not already built)
node scripts/package-v25.21.mjs

# Link and deploy (requires Vercel CLI + login)
vercel link
vercel env pull .env.local
vercel --prod

# Post-deploy smoke
Invoke-RestMethod -Uri "https://aigovernancehub.ai/api/health" | ConvertTo-Json
Invoke-RestMethod -Uri "https://aigovernancehub.ai/api/pricing" | ConvertTo-Json

# Run local certification suite
node scripts/run-all-tests.mjs
```

---

## Git commit message (when requested)

```
v25.21: final security certification before release candidate

Harden upload pre-decode size limits, download filename sanitization,
COOP headers, and compliance copy; expose securityPosture on health;
15/15 automated suites pass.
```

---

## FINAL QUESTION revisited

**Would OpenAI / Microsoft / Atlassian / JPMorgan upload confidential exports today?**

- **On production as deployed:** **NO**
- **On v25.21 after deploy, with redacted exports + DPA:** **Conditional YES** for governance assessment — not for PHI or trade-secret-heavy raw exports without enterprise contract.

---

## Approval

| Stakeholder | RC | Prod |
|-------------|-----|------|
| Engineering | ✅ GO | ⏳ After deploy |
| Security | ✅ GO (repo) | ❌ NO-GO |
| Executive | ✅ RC proceed | ❌ NO-GO |
