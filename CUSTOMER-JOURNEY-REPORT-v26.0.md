# CUSTOMER JOURNEY REPORT — v26.0

## Journey map (first-time customer)

| Step | What happens | Why | Next action | v26 status |
|------|--------------|-----|-------------|------------|
| Landing | Value prop, trust strip, Start Assessment | Orient buyer | Click Start Assessment | ✅ Clear CTAs |
| Features | Capability overview | Build confidence | → Pricing | ⚠️ Minimal chrome (follow-up) |
| Pricing | Plan context + wizard | Self-serve entry | Choose source | ✅ Wizard primary |
| Sample files | Templates + column defs | Reduce upload errors | Download sample | ✅ New page |
| Upload | File + industry | Server validation | Wait for analysis | ✅ Progress + errors |
| Validation | Compatibility score | Prove readiness | Fix or continue | ✅ Metrics shown |
| Preview | Free snapshot | Prove value | Confirm order | ✅ Locked premium clear |
| Order summary | Plan, items, tax, total | Informed consent | Check confirm box | ✅ Refund/support |
| Secure Checkout | Razorpay modal | Pay | Complete payment | ✅ Server amount match |
| Verification | HMAC verify | Anti-fraud | Report generation | ✅ Backend only |
| Reports | HTML/PDF/DOCX/PPTX | Deliverable | Download | ✅ Multi-format |
| Dashboard | History + downloads | Ongoing value | Run another | ✅ Metadata cards |
| Enterprise | Assessment request | Large portfolio | Submit details | ✅ Warm UX |
| Support | Email recovery | Help | support@ / sales@ | ✅ Linked |

## Screenshots (annotated)

| File | Page | Annotation |
|------|------|------------|
| `docs/screenshots/v26/01-pricing-wizard.png` | Pricing wizard | Step list shows Secure Checkout; source cards; sample downloads |
| `docs/screenshots/v26/02-sample-files.png` | Sample guide | Per-platform columns, validation expectations, example report link |
| `docs/screenshots/v26/03-faq.png` | FAQ | Trust navigation; enterprise threshold copy corrected |

*Payment success, enterprise gate with live upload, and dashboard require authenticated/staging E2E — documented in TEST-CHECKLIST-v26.0.md.*

## Friction removed in v26

- Dead-end “Coming soon” assessment page → redirect
- Dead-end sample-report → example report
- Conflicting “50 items = Enterprise” FAQ → aligned to 1,000 gate + tier plans
- Technical upload errors → plain language with fix steps
- Enterprise “Required/blocked” tone → “Enterprise Assessment” with SLA

## Remaining friction (post-launch)

- Index hero still shows static ₹199 (server quote may differ by plan/currency)
- No embedded export walkthrough videos
- Features page lacks full site chrome
