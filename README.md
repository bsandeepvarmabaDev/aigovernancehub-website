# AI Governance Hub Website

Version: 2026.06.26-marketplace-approval-v15

AI Governance Hub is an enterprise AI governance platform for Jira Cloud. This website supports Marketplace listing quality, product positioning, demo requests, free high-level assessment, introductory package requests, customer support, documentation, legal pages and security transparency.

## Marketplace approval updates

- Added dedicated `support.html` page for Marketplace support link.
- Added documentation center under `docs/` with setup, user, admin and security documentation.
- Added expanded Marketplace overview description in `marketplace-overview-description.txt`.
- Added distinctive AGH shield logo assets: `app-logo.svg` and `app-logo-512.png`.
- Preserved security-first static website constraints.

## Recommended Marketplace support URL

https://aigovernancehub.ai/support.html

## Security notes

- Do not store passwords in this static website.
- Do not store Razorpay secrets or API keys in frontend code.
- Do not store customer records in browser-only storage.
- Use hosted payment links or backend-verified payment flows when checkout is enabled.
