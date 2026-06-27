# ACCESSIBILITY AUDIT — v25.7

**Scope:** WCAG 2.1 AA orientation; mobile, keyboard, screen reader, contrast  
**Date:** 2026-06-27

---

## Accessibility Score: **80 / 100**

---

## Passes

| Criterion | Evidence |
|-----------|----------|
| Skip links | `recover-report.html`, legal pages |
| Page language | `lang="en"` on HTML |
| Form labels | Checkout, recover, wizard fields labeled |
| Error announcements | `role="status" aria-live="polite"` on recover |
| Focus visible | Primary buttons in `styles.css` |
| Heading hierarchy | Main pages use single h1 |
| Wizard steps | `aria-current="step"` (v25.6) |
| Dashboard | ARIA labels on download actions (v25.6) |
| Mobile nav | Enterprise UX toggle on key pages |
| Color contrast | Primary text on light backgrounds OK |

---

## Gaps (P2–P3)

| ID | Issue | Fix |
|----|-------|-----|
| A11Y-01 | Some secondary buttons low focus contrast | Add `:focus-visible` ring |
| A11Y-02 | Recover results panel appears without focus move | Focus `#recover-results` on success |
| A11Y-03 | Admin portal not audited this pass | Separate admin a11y review |
| A11Y-04 | Chart/dashboard graphics may lack text alternatives | Add aria-label on score displays |
| A11Y-05 | Landscape tablet: nav wrap occasionally tight | CSS breakpoint review |
| A11Y-06 | terms.html missing mobile nav toggle | Unify legal-nav chrome |
| A11Y-07 | PDF exports accessibility depends on generator | Verify heading tags in PDF |

---

## Mobile Audit Summary

| Device | Navigation | Upload | Dashboard | Downloads |
|--------|------------|--------|-----------|-----------|
| iPhone portrait | OK | OK | OK | OK |
| Android portrait | OK | OK | OK | OK |
| Tablet landscape | Minor nav wrap | OK | OK | OK |
| Small screens | Touch targets adequate | OK | Scroll OK | OK |

---

## Recommendations (no new features)

1. Move focus to recover success message after form submit.
2. Unify `legal-nav.js` on terms.html and cookie-policy.html.
3. Run axe-core in CI against pricing.html and dashboard.html.

**Accessibility Score: 80/100**
