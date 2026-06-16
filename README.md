# AI Governance Hub Day 100 Release v1

## Files included
- index.html
- assessment.html
- thank-you.html
- payment-pending.html
- styles.css

## What changed
- Updated homepage and footer messaging to say AI Governance Hub is available on Atlassian Marketplace.
- Added Marketplace CTA using: https://marketplace.atlassian.com/apps/3237155442/ai-governance-hub?hosting=cloud&tab=overview
- Kept assessment funnel and added instant browser-generated PDF report flow.
- Added Razorpay hosted payment link for ₹99 report: https://razorpay.me/@balthisandeep?amount=CVDUr6Uxp2FOGZGwAHntNg%3D%3D
- Fixed assessment OG image URL from dashboard.png.png to dashboard.png.
- Removed currency selector from homepage pricing section and kept INR launch message.
- No Razorpay secret keys are stored in frontend.

## Commit message
feat(website): launch day 100 marketplace and instant report flow

## Commit description
Version: 2026.06.29-day100-marketplace-payment-v1

- Updated website messaging for Atlassian Marketplace approval
- Added Try Free on Atlassian Marketplace CTA
- Added ₹99 Razorpay hosted payment entry point
- Added instant browser-generated AI Governance PDF report flow
- Updated thank-you and payment-pending pages
- Fixed assessment OG image URL
- Preserved framework and SEO content
- Website only; no Forge app changes
- No Razorpay API secrets stored in frontend

## After upload
1. Replace the five files in the website repo.
2. Commit and push.
3. Test assessment.html: generate result, click Pay ₹99, then click Download PDF Report.
4. Test homepage Marketplace CTA.

## Future backend release
A proper backend should verify Razorpay payment via Orders API and Signature Verification before unlocking delivery. This release is a fast static-site Day 100 launch path.
