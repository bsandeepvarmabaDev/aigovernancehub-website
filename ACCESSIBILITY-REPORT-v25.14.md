# ACCESSIBILITY REPORT — v25.14

**Verdict:** **PASS static audit** — manual screen-reader QA recommended on staging

## Automated Suite

```powershell
node scripts/accessibility-test.mjs
```

**32/32 checks pass**

## v25.14 Improvements

| Area | Change |
|------|--------|
| Skip links | Added payment-pending, thank-you; admin already has skip link |
| Keyboard nav | Escape closes mobile menu; focus to first link |
| Focus management | Recover report + payment success move focus to headings |
| Admin | Form labels, aria-live status region |
| Focus-visible | Defined in styles.css for buttons, links, inputs |

## Existing Strengths

- Wizard: `aria-current`, `aria-live`, `aria-busy`
- Legal pages: skip links, semantic headings
- No `window.alert` in wizard

## Manual QA Matrix (staging)

- [ ] VoiceOver (Safari macOS): pricing wizard full flow
- [ ] NVDA (Firefox): recover report form
- [ ] Keyboard-only: upload → quote → checkout cancel
- [ ] 200% zoom: order summary readable
- [ ] Color contrast: secondary buttons on pricing

## Remaining (v25.15+)

- Modal focus trap for Razorpay overlay (third-party)
- axe-core CI against staging URL
- Chart/score text alternatives in sample report
