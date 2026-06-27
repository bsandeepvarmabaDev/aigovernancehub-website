# ENTERPRISE GATE REPORT — v25.3

## Overview

Enterprise gate blocks self-service checkout when **server-detected work items exceed 1,000**. Customers are routed to a sales workflow; admins manage quotes and custom Razorpay payment links.

## Gate logic

```
Upload → parse & countWorkItems()
  ├─ totalWorkItems ≤ 1000 → self-service (plan detect → quote → Secure Checkout)
  └─ totalWorkItems > 1000 → enterprise gate (no Razorpay order)
```

## Enterprise request lifecycle

| Status | Label |
|--------|-------|
| `sales_review_pending` | Assessment received — sales review pending |
| `contact_received` | Contact received — sales review in progress |
| `quote_set` | Quote prepared — payment link pending |
| `payment_link_ready` | Secure payment link sent |
| `payment_received` | Payment verified — report generating |
| `report_delivered` | Report delivered |
| `closed` | Request closed |

## Customer experience

When gated, the wizard shows Enterprise Assessment Required, upload metrics, request ID, status, and sales@aigovernancehub.ai. No self-service checkout.

## Admin operations

Path: `/admin.html` — quote, payment link, notes, mark delivered, close. All actions audited.

## APIs

- `POST /api/enterprise-sales-request`
- `POST /api/enterprise-request-status`
- `GET /api/admin-enterprise-requests`
- `POST /api/admin-actions` (enterprise_* actions)
