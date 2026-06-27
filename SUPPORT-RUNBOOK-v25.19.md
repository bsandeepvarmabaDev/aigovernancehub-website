# SUPPORT RUNBOOK — v25.19

**Audience:** Support engineers  
**SLA:** 1 business day general; security prioritized

---

## Required Info from Customer

- Checkout email  
- Razorpay payment ID or order reference  
- Enterprise Request ID (if applicable)  
- Screenshot of error (if any)  
- Approximate time of purchase (UTC)

---

## Scenario Playbooks

### Payment failed / not verified

1. Ask if funds deducted (Razorpay reference)  
2. Direct to [recover-report.html](recover-report.html)  
3. Admin: search email → check `paymentStatus`, `reportStatus`  
4. If paid in Razorpay but not verified: check audit trail; escalate dev if signature OK but not fulfilled  
5. If checkout expired: customer re-uploads (session ~24h)

### Upload failed

1. Verify file <5 MB, CSV/XLSX  
2. [sample-files.html](sample-files.html) — required columns  
3. Admin: search session ID if provided  

### Report failed / not downloading

1. Customer waits 5 min (v25.19 auto-poll on success page)  
2. My Reports / Recover  
3. Admin: `retry_generation`  
4. If `reportStatus: failed`: check ops metrics `report_generation_failed`  

### Email not received

1. Not blocking — downloads via recover/login  
2. Admin: `resend_email`  
3. Check health: email service `up` vs `not_configured`  

### Duplicate purchase

1. Collect both payment IDs  
2. Admin search both orders  
3. Finance: Razorpay refund for duplicate  
4. Admin: `mark_refunded` on duplicate order  

### Refund request

1. Verify [refund-policy.html](refund-policy.html) eligibility  
2. Finance processes Razorpay refund  
3. Admin: `mark_refunded` (disables download)  

### Enterprise quote

1. Confirm work item count  
2. sales@ owns quote  
3. Admin: enterprise queue → set quote → create payment link  
4. Send checkout URL to customer  

### Invoice request

1. Handoff to sales@ with procurement template  
2. See [enterprise-procurement.html](enterprise-procurement.html)  
3. Record PO in enterprise note (admin)

---

## Admin Portal Quick Reference

**URL:** `/admin.html` (noindex)  
**Auth:** `ADMIN_API_KEY` bearer token  

| Action | When |
|--------|------|
| Search | Find customer by email/order/payment/session |
| resend_email | Email delivery failed |
| retry_generation | Report stuck/failed |
| enable_download / disable_download | Refund/dispute |
| mark_refunded | Finance confirmed refund |
| enterprise_set_quote | Sales approved amount |
| create_enterprise_payment | Send payment link |

---

## Escalation

| To | When |
|----|------|
| security@ | Data breach suspicion, vuln report |
| sales@ | Enterprise scope, invoice, PO |
| Engineering | Repeated payment_verify_failed, storage down |

---

## Public Self-Service (send customers here first)

- support.html — troubleshooting matrix  
- recover-report.html  
- faq.html  
- trust-center.html
