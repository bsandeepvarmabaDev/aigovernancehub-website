# Architecture — v21.0 Commercial SaaS

```mermaid
flowchart TB
  subgraph Client
    WEB[Static HTML/JS]
    WIZ[Guided Assessment Wizard]
  end

  subgraph API[Vercel Serverless]
    UPLOAD[upload-report]
    QUOTE[order-quote]
    ORDER[create-order]
    VERIFY[verify-payment]
    PRICE[pricing]
  end

  subgraph Commerce
    PRICING[lib/pricing.js]
    PLANS[lib/assessment-config.js]
  end

  subgraph External
    RZP[Razorpay]
    BLOB[(Blob/S3)]
  end

  WEB --> WIZ
  WIZ --> UPLOAD
  UPLOAD --> PLANS
  UPLOAD --> BLOB
  WIZ --> QUOTE
  QUOTE --> PRICING
  WIZ --> ORDER
  ORDER --> PRICING
  ORDER --> RZP
  ORDER --> BLOB
  WIZ --> VERIFY
  VERIFY --> BLOB
  WEB --> PRICE
  PRICE --> PRICING
```

## Plan detection flow

```
workItems + projectCount + fileSize
  → detectPlanTier()
  → planRecommendationReason()
  → selfServe? → order-quote → create-order : enterprise gate
```

## Pricing flow

```
planId + currency
  → getPlanBasePriceMinor()
  → + convenienceFee + tax - discount
  → totalMinor → Razorpay order amount
```

## Security boundary

- All amounts computed in `api/lib/pricing.js`
- Client displays quote from API only
- `orderConfirmed` required for create-order
- HMAC verification unchanged

## Version history

- v17.1: Persistent storage
- v18.0: Accounts, dashboard, admin
- v19.0: Guided assessment wizard
- v21.0: Multi-tier commercial SaaS pricing
