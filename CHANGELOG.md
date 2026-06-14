# CHANGELOG

## 2026.06.16-enterprise-homepage-redesign-v1

### Enterprise launch polish
- Removed internal development/commercial status language from the announcement bar.
- Simplified top navigation to Platform, Assessment, Pricing, Security and Contact.
- Removed Batch 750 from the homepage and primary navigation.
- Cleaned trust strip to focus on customer-facing security and governance proof.
- Improved hero hierarchy and made the dashboard screenshot more prominent.
- Renamed pricing CTAs from “Unlock” to “Request” until live Razorpay checkout is available.
- Added metric disclaimer text for business-value claims.
- Cleared hidden modal placeholder text.

### Domain readiness
- Updated canonical, robots.txt and sitemap.xml references to https://aigovernancehub.ai.
- Kept all links relative where possible for safe GitHub Pages hosting and custom-domain cutover.

### Security preserved
- Preserved CSP meta policy with YouTube frame allowances.
- Preserved escapeHtml() protection for user-controlled fields.
- Preserved privacy acknowledgement requirement before assessment generation.
- No secrets, API keys, or Razorpay secret keys added to frontend.

### Not changed
- Forge app code.
- Marketplace submission.
- Razorpay API integration.
