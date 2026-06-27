# Accessibility Report — v25.14 Certification

**Date:** 2026-06-27  

## Automated (32/32 pass)

- Skip links on 12 key HTML pages
- `lang=en` on all checked pages
- `focus-visible` styles in CSS
- Wizard `aria-live` regions
- Admin form labels + live region
- External `site-nav.js` keyboard support
- Recover/success focus management hooks

## Manual gaps (not executed this round)

- Full keyboard-only 28-step journey
- Screen reader walkthrough (NVDA/VoiceOver)
- Color contrast audit on all hero gradients
- Reduced motion preference verification

## Findings

| ID | Issue |
|----|-------|
| FIND-P5-001 | Hero contrast (linked to FIND-P3-001) |
| FIND-P5-002 | Manual SR/keyboard journey not completed |

## Catalog

100 accessibility cases in `TEST-CASE-CATALOG.md` (P5-A11Y-*)

## Status

**Automated pass**; **manual WCAG sign-off pending**.
