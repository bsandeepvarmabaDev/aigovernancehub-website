# CHANGELOG

## 2026.06.14-security-hardening-v1

### Security
- Added HTML escaping helper for user-controlled form values.
- Applied escaping to `runWebsiteAssessment()` values before rendering output.
- Applied escaping to `createJiraTicket()` values before rendering output.
- Added email validation for assessment lead capture.
- Added Content Security Policy meta tag with `frame-ancestors 'none'`.

### Launch polish
- Added sales, support and security contact blocks.
- Updated commercial CTAs to use `sales@aigovernancehub.ai`.
- Removed internal P-section prefixes from public headings.
- Added locked premium results and launch pricing structure.
- Added customer outcomes, comparison table and enterprise readiness sections.

### Not changed
- Forge app code.
- Marketplace submission.
- Razorpay links are still pending until payment links are generated/approved.
