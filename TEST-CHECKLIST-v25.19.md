# TEST CHECKLIST — v25.19

**Date:** 2026-06-27  
**Priority:** P0 Security → P2 Journey → Ops

---

## P0 — Security Regression

- [ ] verify-payment rejects different paymentId on verified order (409)
- [ ] verify-payment idempotent for same paymentId (GENERATING + READY)
- [ ] download-report rejects forged token
- [ ] download-report rejects expired token
- [ ] enterprise gate blocks self-serve >1000 items
- [ ] admin-actions requires ADMIN_API_KEY
- [ ] order amount tampering fails at verify-payment
- [ ] rate limits still active on verify/download/recover

---

## P1 — Operations

- [ ] `/api/health` returns version 25.19 and launchReady
- [ ] ALERT_WEBHOOK_URL receives POST on report_generation_failed (staging test)
- [ ] Admin operations_dashboard shows failedPayments counter
- [ ] Admin search → resend_email works
- [ ] Admin search → retry_generation works
- [ ] Admin search → mark_refunded disables download

---

## P2 — Customer Journey / Failure Recovery

- [ ] Success page polls when reportStatus=generating
- [ ] Download retries on 409
- [ ] recover-report.html shows failure scenarios
- [ ] support.html troubleshooting matrix complete
- [ ] Browser-close recovery via recover email works

---

## P10 — Launch Simulation

- [ ] Persona A Starter E2E
- [ ] Persona B Business tier pricing correct
- [ ] Persona C Enterprise gate → admin quote
- [ ] Persona D payment cancel path
- [ ] Persona E recover after close
- [ ] Persona F My Reports re-download
- [ ] Persona G support escalation path
- [ ] Persona H refund admin mark

---

## Automated

```powershell
Set-Location c:\Projects\ai-governance-hub\aigovernancehub-website
node scripts/run-all-tests.mjs
node scripts/full-round-test.mjs
```

---

## Post-Deploy

```powershell
Invoke-RestMethod -Uri "https://aigovernancehub.ai/api/health"
# Expect: version 25.19, launchReady true when fully configured
```
