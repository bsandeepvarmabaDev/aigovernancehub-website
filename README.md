# AI Governance Hub Website

Version: 2026.06.26-conversion-optimization-v10

AI Governance Hub is an enterprise AI governance platform for Jira Cloud. This static website supports product positioning, demo requests, free assessment, introductory package requests, legal pages and security transparency.

## Security notes

- Do not store passwords in this static website.
- Do not store Razorpay secrets or API keys in frontend code.
- Do not store customer records in browser-only storage.
- Use hosted payment links or backend-verified payment flows when checkout is enabled.

## Release summary

- Revenue and trust launch polish inspired by enterprise SaaS patterns.
- Public placeholder name changed to a shorter neutral example.
- Added Trust Center summary section.
- Added governance workflow section.
- Improved pricing and CTA language.
- Unified legal/support page navigation and footer.
- Preserved security-first static website constraints.


## 2026.06.25 Enterprise Launch Candidate v9

Final launch-candidate package for the public website before Marketplace approval go-live.

Key updates:
- Removed personal-name placeholders from the assessment form.
- Strengthened enterprise-safe examples and buyer-facing copy.
- Kept trust center, governance workflow, pricing, assessment, demo, security and legal page consistency.

Deployment note:
- Upload these files to the website repository without deleting any existing `images/` folder assets used by the homepage dashboard preview.


## 2026.06.26 Conversion Optimization v10

- Shortened homepage by replacing the full assessment form with a conversion-focused assessment preview.
- Added dedicated assessment.html page for the full free high-level assessment.
- Added paid detailed report positioning after the free preview.
- Standardized placeholder format using “For e.g.” enterprise examples.
- Preserved static-site security rules: no secrets, no payment keys, no password storage.
