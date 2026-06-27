# CHANGELOG — v25.5

## Enterprise Launch Review (v25 Production Series)

No new features, payment providers, pricing tiers, or report types.

### Enterprise trust & copy
- Homepage: CISO-oriented data handling, server-validated uploads, dynamic starter pricing via `pricing-i18n`
- Trust Center: full navigation, confidential upload handling, audit logging, payment integrity, procurement contacts
- Features: enterprise chrome, six capability pillars, clear assessment vs Marketplace paths
- Refund Policy: procurement-friendly structure, enterprise terms, response SLAs
- Support: removed internal Marketplace listing language; enterprise response commitments

### Customer journey
- Pricing hero and upload step: confidential data reassurance + Trust Center links
- Enterprise checkout: Secure Checkout CTA, deliverables and refund/support links
- Dashboard: clearer workspace intro for post-purchase users

### Performance
- Lazy-loaded dashboard hero image on homepage
- `preconnect` to Razorpay checkout on pricing page

### Version
- API health and dashboard: **25.5**

### Tests
- `scripts/customer-journey-test.mjs` updated for v25.5
- Prior security/gate suites unchanged
