# FINANCE RUNBOOK — v25.19

**Audience:** Finance, accounting  
**Payment provider:** Razorpay (self-serve website assessments)

---

## Revenue Flow

```
Customer purchase → Razorpay Secure Checkout → verify-payment (HMAC) → report release → invoice email (if configured)
```

---

## Self-Serve Purchase (Starter / Professional / Business)

| Step | System | Finance action |
|------|--------|----------------|
| Quote displayed | Server order-quote | None |
| Payment | Razorpay | Reconcile in Razorpay dashboard |
| Verification | verify-payment API | Automatic |
| Report release | After verified only | None |
| Invoice | api/invoice.js HTML | Customer receives with report if email configured |

**Reconciliation key:** Razorpay `order_id` + `payment_id` — indexed in storage

---

## Enterprise Purchase

| Step | Owner |
|------|-------|
| Enterprise gate | Customer submits → sales |
| Quote | Admin `enterprise_set_quote` |
| Payment link | Admin `create_enterprise_payment` |
| Payment | Razorpay enterprise checkout URL |
| Delivery | Same fulfillment pipeline |

**Finance:** Invoice/PO via sales@ — manual process; record PO in enterprise admin notes

---

## Refund Process

1. Customer emails support@ per refund policy  
2. Finance verifies eligibility  
3. Process refund in **Razorpay dashboard**  
4. Admin: `mark_refunded` on order (disables download)  
5. Audit trail: `REFUND_STATUS_UPDATED` event  

**Note:** No automatic Razorpay refund API in admin portal — intentional control

---

## Duplicate Payment

1. Support collects both payment IDs  
2. Finance refunds duplicate in Razorpay  
3. Admin marks refunded on duplicate order  
4. Customer retains access on valid order  

**Prevention v25.19:** Second paymentId on same order_id rejected at verify-payment

---

## Taxes

- Self-serve: INR via Razorpay; tax handling per Razorpay/entity configuration  
- Enterprise: scoped in sales quote (currency field in admin)  
- **No tax advice in product** — finance owns entity tax registration docs for procurement

---

## Audit

| Source | Retention |
|--------|-----------|
| Audit events per order | 365 days (configurable RETENTION_AUDIT_DAYS) |
| Admin actions | Logged with correlationId |
| Razorpay | Provider dashboard — source of truth for payments |

---

## Month-End Checklist

- [ ] Razorpay settlement vs verified orders in admin analytics  
- [ ] Refunded orders marked in admin  
- [ ] Enterprise open requests closed or invoiced  
- [ ] Failed payments (`failedPayments` in ops dashboard) reviewed

---

## Questions Finance Will Ask

| Question | Answer |
|----------|--------|
| Where is revenue recognized? | On verified payment + report delivery |
| Refund impact on revenue? | Manual; download disabled after mark_refunded |
| Enterprise PO? | sales@ — case-by-case |
| GST/tax docs? | Provide template to sales@ |
