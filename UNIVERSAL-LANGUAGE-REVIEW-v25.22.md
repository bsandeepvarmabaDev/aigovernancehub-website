# UNIVERSAL LANGUAGE REVIEW — v25.22

**Date:** 2026-06-27  
**Scope:** Full product — website, wizard, reports, emails, dashboard copy

---

## Executive summary

v25.22 replaces internal product jargon ("AI candidates") with universal business language ("AI-related work items") and reframes the homepage around **Upload → Analyze → Receive** in 15 seconds. Backend field names (`aiCandidates`, `aiCandidateCount`) are unchanged — only customer-facing display text changed.

---

## Persona review (could they understand without Jira?)

| Persona | Before v25.22 | After v25.22 |
|---------|---------------|--------------|
| **CEO** | Unclear what "candidates" meant | Clear: export → Executive Assessment |
| **CIO** | OK but Jira-heavy hero | Upload/analyze/receive framing |
| **PMO** | "Candidates" confused with hiring | Work items + governance score |
| **Internal Auditor** | Mixed terminology | Consistent inventory language |
| **Banking Executive** | Jargon barrier | Board-ready assessment language |
| **Government Officer** | Technical export focus | Project export, no tool expertise |
| **Healthcare Director** | Candidate = clinical risk | AI-related work items (not PHI) |
| **Manufacturing Head** | Unclear deliverable | Executive Assessment formats listed |
| **Startup Founder** | Assumed Jira | CSV/Excel path clear |
| **Non-technical Manager** | Failed on "candidates" | **Pass** — 15-second hero |

---

## Terminology mapping applied

| Legacy | Universal |
|--------|-----------|
| AI candidates | AI-related work items / AI-related items |
| AI candidate inventory | AI-related work item inventory |
| Candidate analysis | Governance assessment (in reports) |
| Candidate report | Executive Assessment |
| 50/500/1000 Candidates | 50/500/1000 Work Items (pricing already used work items) |
| Enterprise | More than 1,000 work items · Custom Enterprise Assessment |

---

## Dynamic source labels

| Source | Count label |
|--------|-------------|
| Jira | Issues |
| Azure DevOps | Work Items |
| GitHub | Issues |
| CSV | Records |
| Excel | Rows |
| Generic | Work Items |

Implemented in `assets/js/business-terminology.js` and `api/lib/business-labels.js`.

---

## FINAL QUESTION

> Can a Fortune 500 executive understand AI Governance Hub without knowing Jira?

### Answer: **YES** (after v25.22)

The homepage, pricing wizard, FAQ, and Executive Assessment reports now explain the product in business terms. Jira appears only as one export source among several, and the Marketplace app is clearly separated as ongoing Jira governance — not a prerequisite to understand the website assessment.

**Residual gap:** SEO pages (`eu-ai-act-jira.html`, etc.) remain Jira-targeted for discoverability — intentional, not primary journey.

---

## Score

**Universal Understanding Score: 88 / 100**

Deductions: framework landing pages still Jira-centric (-7), some footer copy still says "Jira Cloud" (-5).
