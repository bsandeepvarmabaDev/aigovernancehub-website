# TEST CHECKLIST — v25.20

---

## P0 Security

- [ ] Email templates escape user-supplied names/URLs
- [ ] Magic link expiry unchanged (15 min)
- [ ] No new inline scripts on hardened pages
- [ ] Payment/download flows unchanged

---

## P1 Customer Delight

- [ ] Success page shows px-worth-it panel
- [ ] Success page share note (no referral codes)
- [ ] Dashboard retention grid visible
- [ ] Pricing checkout confidence strip
- [ ] Support premium hero

---

## P6 Email

- [ ] Purchase email renders premium layout (staging SMTP test)
- [ ] Magic link email has CTA button
- [ ] Enterprise payment email premium layout

---

## P5 Reports

- [ ] New reports show v25.20 footer copy

---

## Automated

```powershell
Set-Location c:\Projects\ai-governance-hub\aigovernancehub-website
node scripts/run-all-tests.mjs
```

---

## Post-Deploy

```powershell
Invoke-RestMethod -Uri "https://aigovernancehub.ai/api/health"
# version 25.20
```
