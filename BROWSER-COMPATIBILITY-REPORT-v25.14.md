# BROWSER COMPATIBILITY REPORT — v25.14

**Verdict:** **PASS** — external scripts use ES5-compatible patterns for broad support

## v25.14 Notes

- CSP change does not affect browser support — external defer scripts load identically
- Razorpay checkout: Chrome, Edge, Firefox, Safari (verify modal on iOS staging)

## Target Matrix

| Browser | Expected | Staging QA |
|---------|----------|------------|
| Chrome (latest) | PASS | Required |
| Edge (latest) | PASS | Required |
| Firefox (latest) | PASS | Recommended |
| Safari macOS | PASS | Required |
| Safari iOS | PASS* | *Razorpay modal |
| Android Chrome | PASS | Recommended |

## Mobile

- Responsive CSS unchanged
- Nav toggle works with touch + keyboard (site-nav.js)

## Not Tested Automatically

Playwright cross-browser E2E deferred to v25.15 (requires staging URL).

## Known Limitations

- IE11 not supported
- Safari private mode may limit sessionStorage for admin key
