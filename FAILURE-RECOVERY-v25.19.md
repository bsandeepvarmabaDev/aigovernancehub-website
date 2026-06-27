# FAILURE RECOVERY — v25.19

**Audience:** Support, Ops, Customer Success

---

## Failure Matrix

| Failure | Customer recovery | Ops recovery |
|---------|-------------------|--------------|
| Upload interrupted | Re-upload in wizard | Session expires ~24h |
| Payment interrupted | Recover My Report if charged | Admin search by email |
| Browser closed before download | Recover / My Reports | N/A — 90-day tokens |
| Internet lost during checkout | Retry checkout or recover | pendingPayments metric |
| Email delayed | Download on success/recover | resend_email |
| Report generation delayed | Success page polls (v25.19); My Reports | retry_generation |
| Recovery expired (>90 days) | Contact support — no guarantee | delete_expired if policy |
| Payment duplicated | Support with both refs | mark_refunded; v25.19 blocks diff paymentId replay |
| User changes device | Same checkout email | N/A |
| Report gen hard fail | Support with order ref | retry_generation; alert fired |
| Refund issued | Download disabled | mark_refunded |
| Enterprise link expired | Contact sales@ | create_enterprise_payment again |

---

## Customer Self-Service Paths (Priority Order)

1. **Success page** — if still open  
2. **recover-report.html** — checkout email  
3. **login.html** — My Reports  
4. **support@** — with payment reference  

---

## v25.19 Improvements

### Success page polling
- Polls `/api/verify-payment` every 5s (max ~2 min active poll display)
- Retries download on HTTP 409 up to 8 times  
- Clear message if generation exceeds wait

### Payment idempotency
- Same paymentId + orderId → safe replay  
- Different paymentId on paid order → **409 rejected**

### Alert webhook
- Report gen fail → `ALERT_WEBHOOK_URL` for ops response

---

## Ops Playbook: Report Stuck in GENERATING

1. Admin search order ID  
2. Check audit trail  
3. `retry_generation`  
4. If fail twice: check storage, session executiveAssessment present  
5. Customer comms: "Report being regenerated; use My Reports in 10 minutes"

---

## Ops Playbook: Payment Verified, No Report Record

1. Search Razorpay payment_id in admin  
2. Check verify-payment logs for correlationId  
3. If fulfill threw: customer got 202 response — support manually triggers retry_generation after creating stub if needed  
4. Escalate engineering if storage down

---

## Ops Playbook: SMTP Down

1. Health shows email `not_configured` or degraded  
2. Customers can still download via recover/login  
3. Fix SMTP env; batch resend_email for affected orders

---

## Data Retention on Failure

| Artifact | Retention |
|----------|-----------|
| Upload session (no checkout) | ~24 hours |
| Report + recovery | 90 days |
| Audit events | 365 days |
| Enterprise request | 365 days |

---

## Security on Recovery

- Magic links expire (15 min)  
- Download tokens HMAC-signed  
- Recovery requires checkout email verification  
- Rate limits on recover and download endpoints
