# PERFORMANCE REPORT — v26.0

**Performance Score: 78/100**

## Static site (local serve audit)

| Page | First load | Notes |
|------|------------|-------|
| index.html | Fast | Single CSS; no heavy JS |
| pricing.html | Moderate | Razorpay script deferred; wizard JS ~800 lines |
| sample-files.html | Fast | Minimal assets |
| faq.html | Fast | Details elements lazy-expand |

## v26 optimizations

- `loading="lazy"` on legal page brand icons
- Order summary `overflow-x: auto` prevents layout thrash on mobile
- No additional blocking scripts

## Recommended (post-launch)

1. `preconnect` to `https://checkout.razorpay.com` on pricing only
2. Production CDN for static assets + cache headers
3. Lighthouse CI on PR
4. Upload/preview timing metrics in `/api/health` extended checks
5. Report download streaming audit for large PDFs

## Customer-perceived latency

| Step | Expected | UX mitigation |
|------|----------|---------------|
| Upload | 2–15s by size | Progress steps in wizard |
| Preview | 3–20s | Compatibility panel + ETA |
| Checkout | 1–2s | Order summary pre-loaded |
| Report gen | 5–30s | Success page + email |

No performance regressions introduced in v26.0.
