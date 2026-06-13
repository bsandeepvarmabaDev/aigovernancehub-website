# AI Governance Hub Website

Version: 2026.06.14-security-hardening-v1

## Purpose
Security hardening and launch polish for the public AI Governance Hub website.

## Included files
- index.html
- styles.css
- privacy.html
- terms.html
- security-policy.html
- original_versions/

## Key updates
- Fixed DOM XSS risk in the AI Governance Assessment output by escaping user-supplied values.
- Fixed HTML injection risk in the Jira ticket preview by escaping user-supplied values.
- Added basic CSP meta tag suitable for the current static GitHub Pages site.
- Added sales/support/security contact blocks.
- Updated pricing to ₹99 / ₹299 / ₹999 introductory launch packages.
- Added locked premium insight sections.
- Removed customer-visible P0/P1/P11 style internal labels from headings.
- Added customer outcomes, comparison table and enterprise readiness sections.

## Deployment note
Upload these files to the GitHub Pages repository root. Keep the existing images/ folder unchanged.
