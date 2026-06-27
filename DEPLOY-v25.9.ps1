# DEPLOY — v25.9 (PowerShell)

```powershell
Set-Location "c:\Projects\ai-governance-hub\aigovernancehub-website"

node scripts/operations-test.mjs
node scripts/resilience-test.mjs
node scripts/production-audit-test.mjs
node scripts/enterprise-gate-test.mjs
node scripts/launch-hardening-test.mjs
node scripts/customer-journey-test.mjs
node scripts/payment-architecture-test.mjs

node scripts/package-v25.9.mjs

vercel
vercel --prod

Invoke-RestMethod "https://aigovernancehub.ai/api/health" | ConvertTo-Json
```

Optional: `ALERT_WEBHOOK_URL` for future Slack/Teams integration.
