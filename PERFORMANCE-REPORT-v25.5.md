# PERFORMANCE REPORT — v25.5

**Performance Score: 79/100**

## v25.5 measurable improvements

| Change | Impact |
|--------|--------|
| `loading="lazy"` on homepage dashboard image | Reduces LCP contention on first paint |
| `width`/`height` on hero image | Reduces CLS |
| `preconnect` to checkout.razorpay.com on pricing | Faster Razorpay modal on checkout step |
| Legal page `loading="lazy"` on icons | Minor first-load savings |

## Unchanged (already acceptable)

- Single CSS bundle `styles.css`
- Wizard JS deferred on pricing page
- No render-blocking third-party scripts on homepage

## Recommended (measurable, post-launch)

1. Lighthouse CI on PR — target LCP < 2.5s on pricing
2. CDN cache headers for static assets in production
3. Compress `images/dashboard.png` if > 200KB

No performance regressions in v25.5.
