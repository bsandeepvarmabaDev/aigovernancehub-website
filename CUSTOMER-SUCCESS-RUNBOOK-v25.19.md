# CUSTOMER SUCCESS RUNBOOK — v25.19

**Audience:** Customer Success, Support (Tier 1)  
**Scope:** Post-purchase journey — no product changes

---

## Journey Map

```
Purchase → Success → Download → Dashboard → Recovery → Reassess → Enterprise Upgrade
```

---

## Stage 1: Purchase

**Customer thinks:** "Did I pay the right amount?"  
**We show:** Order summary before Razorpay; server-calculated tier  
**If confused:** Point to pricing `#commercial-clarity`  
**CS action:** None unless support ticket

---

## Stage 2: Success Page

**Customer thinks:** "Is my report ready?"  
**We show:** Payment verified; polls if generating (v25.19)  
**If browser closed:** Recover My Report / My Reports — 90 days  
**CS script:** "Your payment is verified. Use Recover My Report with your checkout email from any device."

---

## Stage 3: Download

**Customer thinks:** "Which format for my audience?"  
**Guidance:**
- **Board/CIO:** PDF or PPTX  
- **Legal/compliance:** DOCX  
- **Operational:** HTML or text  

**If 409 generating:** Wait 2–5 min; retry; admin `retry_generation` if >30 min

---

## Stage 4: Dashboard

**Customer thinks:** "Where are all my reports?"  
**Path:** login.html → magic link → dashboard  
**If magic link expired:** Request new link (15 min TTL)

---

## Stage 5: Recovery

**Paths:**
1. recover-report.html (email magic link)  
2. login.html (My Reports)  
3. Success page confirmation token (same session)

**Expired (>90 days):** Cannot guarantee recovery — escalate to ops

---

## Stage 6: Reassessment

**Customer thinks:** "Portfolio changed — need new baseline"  
**Action:** pricing.html#assessment-wizard — new purchase  
**Note:** Each assessment is a separate order

---

## Stage 7: Enterprise Upgrade

**Trigger:** >1,000 work items or procurement requirements  
**Path:** Enterprise gate in wizard → sales@ → admin quote → payment link  
**CS handoff:** Provide Request ID to sales; track in admin enterprise queue

---

## Always Tell the Customer

1. Checkout email is the recovery key  
2. Reports available 90 days  
3. Email is optional — not the only delivery channel  
4. Support: support@ — 1 business day  
5. Enterprise: sales@ — 1–2 business days

---

## Escalation to Ops

| Signal | Escalate when |
|--------|---------------|
| Payment verified, no report >30 min | Admin retry_generation |
| Email failed + customer insists | Admin resend_email |
| Duplicate charge | Finance + admin audit trail |
| Refund approved | Admin mark_refunded |
