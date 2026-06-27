# CUSTOMER JOURNEY REPORT — v25.13

**Verdict:** **PASS** — journey complete with commercial boundary clarity

## 1. First-Time Visitor

| Element | Status |
|---------|--------|
| Homepage clarity | PASS — value prop, company section |
| Supported uploads | PASS — sample-files.html, CSV/XLSX |
| Sample files | PASS |
| Pricing expectations | PASS — commercial-clarity panel |
| Trust | PASS — trust-center.html |
| Support | PASS — support links, emails |

## 2. Upload Journey

- Required fields explained in wizard
- Validation messages human-friendly (`couldn't be processed`)
- Enterprise routing at 1001+ items
- No client-side task count trust — server validates

## 3. Payment Journey

- Order summary before Razorpay
- Taxes/convenience fee server-calculated
- Refund policy linked
- Deliverables listed pre-pay
- Success/failure/cancelled paths via verify + webhook states

## 4. Report Journey

- Formats: HTML, PDF, DOCX, PPTX, text summary
- Email delivery post-generation
- Dashboard visibility
- recover-report.html for recovery

## 5. Enterprise Journey

- >1000 gate enforced
- Request ID + status page
- Expected response copy (1–2 business days)
- Sales email path
- Admin quote + enterprise checkout

## 6. Support Journey

- support@ / sales@ documented
- refund-policy.html, recover-report.html, faq.html

## 7. v25.13 Addition

- **Website vs Marketplace** boundary on pricing `#commercial-clarity`

## Automated Tests

```powershell
node scripts/customer-journey-test.mjs
```
