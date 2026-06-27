# CHANGELOG — v26.0

## Zero Friction Customer Experience & Launch Certification

**Focus:** Remove friction, improve trust, clarify journey — no new features, pricing tiers, payment providers, or report types.

### Customer journey (P1)
- Assessment wizard: semantic step list with `aria-current`, step renamed to **Secure Checkout**
- Per-source export instructions with validation expectations and filtered sample downloads
- Order summary: deliverables list, refund policy link, support email
- `sample-files.html` — column definitions, mandatory/optional fields, validation expectations per source
- `assessment.html` and `sample-report.html` redirect to live flows (no dead ends)
- FAQ/pricing copy aligned: self-service up to 1,000 items; Enterprise Assessment above that

### Enterprise experience (P1/P2)
- Warmer enterprise framing: **Enterprise Assessment** (not “Contact Sales” rejection tone)
- Expected response time (1–2 business days), Request ID status polling retained
- Benefits and next steps clarified

### Error messages (P2)
- Human-friendly upload validation in `report-engine.js`
- Expanded `ERROR_MAP` in `enterprise-ux.js` (unsupported format, empty file, enterprise gate)
- Removed `window.alert` fallback in guided assessment

### Trust & legal (P2)
- FAQ page: skip link, header, footer, trust links
- Index footer: FAQ, Refund Policy, Trust Center
- `legal-nav.js` + responsive legal-hero mobile menu

### Accessibility (P2)
- Dashboard workspace tabs: ARIA tablist/tab/tabpanel, arrow-key navigation
- Wizard steps: `aria-current="step"`

### Performance & mobile (P3/P4)
- Lazy loading on legal page brand icons
- Order summary horizontal scroll on narrow viewports
- Pricing compare table scroll hint on mobile

### Version
- API health and dashboard API: **26.0**

### Tests
- `scripts/customer-journey-test.mjs` (9 checks)
- Prior v25.3 security/gate tests unchanged and passing

### Deliverables
- `aigovernancehub-website-v26.0.zip`
- Certification reports (see LAUNCH-CERTIFICATION-REPORT-v26.0.md)
