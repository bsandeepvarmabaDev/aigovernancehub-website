# DAY 1 LAUNCH SIMULATION — v25.19

**Date:** 2026-06-27  
**Method:** 8 persona operational walkthroughs

---

## Persona A — Buys Starter (≤50 items)

| Step | Outcome | Ops ready? |
|------|---------|------------|
| Upload sample Jira CSV | Validates | ✅ |
| Preview free | Shows score | ✅ |
| Pay ₹199 tier | Razorpay | ✅ |
| Success page | Polls if needed | ✅ v25.19 |
| Download PDF | Signed download | ✅ |
| Email | Optional SMTP | ⚠️ if unset |

**Result:** ✅ PASS (degraded if no email)

---

## Persona B — Buys Business (501–1000 items)

| Step | Outcome | Ops ready? |
|------|---------|------------|
| Large CSV upload | Server tier detection | ✅ |
| Order summary | Higher tier price | ✅ |
| Payment + report | Full executive pack | ✅ |
| Dashboard access | Magic link login | ✅ |

**Result:** ✅ PASS

---

## Persona C — Enterprise Request (>1000 items)

| Step | Outcome | Ops ready? |
|------|---------|------------|
| Upload triggers gate | Sales form | ✅ |
| Request ID issued | Email to sales | ✅ |
| Admin quote | enterprise_set_quote | ✅ |
| Payment link | create_enterprise_payment | ✅ |
| Pay + deliver | Same pipeline | ✅ |

**Result:** ✅ PASS — requires sales staffing

---

## Persona D — Payment Fails

| Step | Outcome | Ops ready? |
|------|---------|------------|
| Razorpay cancelled | No charge | ✅ |
| Partial charge | Recover flow | ✅ |
| Invalid signature | Rejected + alert | ✅ |

**Support script:** support.html troubleshooting  
**Result:** ✅ PASS

---

## Persona E — Closes Browser Before Download

| Step | Outcome | Ops ready? |
|------|---------|------------|
| Payment verified server-side | Report record exists | ✅ |
| Returns next day | recover-report.html | ✅ |
| Different device | Same email | ✅ |

**Result:** ✅ PASS

---

## Persona F — Downloads Next Week

| Step | Outcome | Ops ready? |
|------|---------|------------|
| My Reports login | Magic link | ✅ |
| Download again | Within 90 days | ✅ |
| Token refresh | New signed download | ✅ |

**Result:** ✅ PASS

---

## Persona G — Contacts Support

| Step | Outcome | Ops ready? |
|------|---------|------------|
| support.html matrix | Self-service first | ✅ v25.19 |
| Email with order ref | Admin search | ✅ |
| Resend / retry | Admin actions | ✅ |

**Result:** ✅ PASS — 1 business day SLA

---

## Persona H — Requests Refund

| Step | Outcome | Ops ready? |
|------|---------|------------|
| refund-policy.html | Clear process | ✅ |
| Finance Razorpay refund | Manual | ✅ |
| Admin mark_refunded | Download off | ✅ |

**Result:** ✅ PASS

---

## Aggregate Simulation

| Persona | Operational outcome |
|---------|---------------------|
| A Starter | ✅ |
| B Business | ✅ |
| C Enterprise | ✅ (sales staffed) |
| D Payment fail | ✅ |
| E Browser closed | ✅ |
| F Delayed download | ✅ |
| G Support | ✅ |
| H Refund | ✅ |

**Simulation verdict:** ✅ All personas recoverable with v25.19 + deploy + admin access

---

## Blockers for Real Day 1

1. Production not on v25.19  
2. ALERT_WEBHOOK_URL unset — ops blind to spikes  
3. SMTP unset — email path degraded (recover still works)  
4. No 24/7 support — documented SLA only
