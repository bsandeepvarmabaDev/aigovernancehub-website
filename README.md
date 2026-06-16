# AI Governance Hub — Instant PDF Report Flow v1

Version: 2026.06.29-instant-report-v1

## Files included
- index.html
- assessment.html
- thank-you.html
- payment-pending.html
- styles.css

## What changed
- Added Razorpay ₹99 payment link to the assessment report flow.
- Added browser-based instant report generation from assessment answers.
- Added Save / Print as PDF report experience.
- Updated thank-you page to support instant report generation.
- Updated payment-pending page for Razorpay payment flow.
- Fixed assessment OG image URL from dashboard.png.png to dashboard.png.
- Kept Professional and Enterprise flows as contact-sales/manual review.

## Important limitation
This is a static GitHub Pages implementation. It does not verify Razorpay payment automatically. Payment verification requires Razorpay Orders API + webhook/backend integration. This release is designed to give a customer an immediate report experience after payment without storing API keys in frontend code.

## Commit message
feat(payment): add instant PDF report flow for ₹99 assessment

## Commit description
Version: 2026.06.29-instant-report-v1

- Added Razorpay ₹99 payment link for assessment report
- Added instant browser-generated PDF report flow
- Stored assessment details locally in browser for report generation
- Added report generation action after assessment summary
- Updated thank-you and payment-pending pages
- Fixed assessment OG image URL
- Website only; no Forge app changes
- No Razorpay API keys stored in frontend

## Deploy
Replace these files in your website repo, then run:

git add index.html assessment.html thank-you.html payment-pending.html styles.css
git commit -m "feat(payment): add instant PDF report flow for ₹99 assessment"
git push origin main

## Test
1. Open assessment.html
2. Enter test assessment details
3. Generate High-Level Summary
4. Click Pay ₹99 Securely and confirm Razorpay page opens
5. Return to assessment page
6. Click Generate Instant PDF Report
7. Browser print dialog should open; choose Save as PDF
