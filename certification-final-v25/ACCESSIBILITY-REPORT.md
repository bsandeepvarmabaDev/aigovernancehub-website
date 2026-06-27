# Accessibility Report — Final Certification

**Production score:** 42/100 | **Repository score:** 80/100

---

## Repository (automated 32/32 pass)

- Skip links on 12 key pages
- `lang=en` on all checked pages
- `focus-visible` styles
- Wizard ARIA live regions
- Admin labels + live region
- Keyboard nav via external site-nav.js
- Recover/success focus management

## Production

- Not manually audited (site functionally broken)
- Old v16.5.2 may lack v25 a11y improvements
- CSP unsafe-inline unrelated to a11y but indicates older build

---

## FIND-P5-001 — Hero contrast (repository)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Medium |
| **Area** | Color contrast |
| **Description** | Pricing wizard hero glow reduces text contrast |
| **Expected** | WCAG AA |
| **Recommendation** | Fix with UX polish sprint |
| **Screenshot** | `screenshots/local-v25-pricing-wizard.png` |
| **Status** | **Open** |

## FIND-P5-002 — Manual keyboard/SR audit not completed

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Medium |
| **Area** | Manual a11y |
| **Description** | Full 28-step keyboard journey not executed |
| **Recommendation** | Post-deploy audit with NVDA/VoiceOver |
| **Status** | **Open** |

**Accessibility: conditional pass on repo automation; NO GO sign-off until post-deploy manual audit.**
