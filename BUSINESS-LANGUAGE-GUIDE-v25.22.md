# BUSINESS LANGUAGE GUIDE — v25.22

**Purpose:** Single reference for customer-facing terminology. Backend models may keep legacy field names.

---

## Core product framing

| Concept | Customer-facing term |
|---------|---------------------|
| The product on this website | **Executive Assessment** / **Governance Assessment** |
| What customer uploads | **Project export** (CSV or Excel) |
| What we count first | **Work items** (or source-specific: Issues, Records, Rows) |
| Items flagged for AI/automation | **AI-related work items** |
| Short KPI label | **AI-related items** |
| Paid deliverable | **Executive Assessment** (HTML, PDF, Word, PowerPoint) |
| Customer portal | **Dashboard** / **My Reports** |
| Email recovery | **Report recovery** |

---

## Avoid in customer copy

| Do not use | Use instead |
|------------|-------------|
| AI candidate(s) | AI-related work item(s) |
| Assessment candidate | Work item |
| Candidate count | Work item count |
| Candidate upload | Upload work items |
| Candidate report | Executive Assessment |
| Candidate review | Governance review |

---

## Source-specific labels

Use `BusinessTerminology.getLabels(source)` in the browser or `getSourceItemLabels(source)` in API reports.

```javascript
// jira → { singular: "Issue", plural: "Issues", scanned: "Issues scanned" }
// csv  → { singular: "Record", plural: "Records", scanned: "Records scanned" }
```

---

## Website vs Marketplace

| Product | One-line description |
|---------|---------------------|
| **This website** | Assess exported work items before purchasing the Marketplace app |
| **Marketplace app** | Govern Jira projects continuously — reviews, approvals, audit evidence |

Never imply website checkout installs the Jira app.

---

## Pricing tiers (self-serve)

| Tier | Customer language |
|------|-------------------|
| Starter | Up to **50 work items** |
| Professional | Up to **500 work items** |
| Business | Up to **1,000 work items** (self-serve max) |
| Enterprise | **More than 1,000 work items** · **Custom Enterprise Assessment** |

---

## Report language

- Board-ready, professional, business-focused
- No internal engineering terms in executive summary
- Framework names are **mapping context**, not certification claims

---

## Version stamp

Reports and footer: **v25.22**
