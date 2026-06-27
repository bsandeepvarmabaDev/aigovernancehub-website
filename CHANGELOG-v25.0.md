# Changelog — v25.0 AI Governance Workspace

**Release focus:** Transform from reporting platform into a continuous governance workspace. Checkout, payment, and authentication unchanged.

## Added

### Task model (`api/lib/workspace-core.js`)
- Recommendations become full tasks: title, description, priority, owner, department, due date, status, evidence, completion notes
- Kanban columns: To Do, In Progress, Blocked, Completed
- Timeline and calendar views
- Comments with @email mentions
- Attachment reference notes (metadata, server-side)
- Workspace activity log and audit trail entries

### Workspace persistence (`api/lib/workspace-storage.js`)
- Unified `workspace/{emailHash}.json` store
- Migrates v24 action tracker data automatically

### APIs
- `GET/PATCH/POST /api/workspace` — full workspace state + task updates + comments/attachments
- `GET /api/workspace-export?format=csv|xlsx|json|pdf|pptx|html`
- `GET /api/workspace-report?period=weekly|monthly|quarterly&format=html|pdf`
- `GET /api/v1-workspace` — REST v1 alias + `?manifest=1` integration schema

### Dashboard → Governance Workspace
- `dashboard.html` + `assets/js/governance-workspace.js`
- Tabs: Workspace, Project health, Re-assessment, Score history, Effectiveness, Reports, Export
- Kanban board with task detail panel (collaboration fields)
- Run new assessment CTA throughout

### Intelligence features (server-side)
- Project health score (completion, overdue, governance trend)
- Re-assessment comparison (previous vs current)
- Governance score history timeline
- Action effectiveness (expected vs actual improvement, variance)
- Management reports (weekly/monthly/quarterly)

### REST API foundation (`api/lib/rest-api-v1.js`)
- Documented resources and future integration targets: Jira, Azure DevOps, ServiceNow, GitHub

## Changed
- `api/lib/action-tracker.js` — delegates to workspace storage (v24 compatible)
- `api/health.js` / `api/pricing.js` — version 25.0
- `styles.css` — Kanban and workspace UI

## Security
- All workspace logic server-side
- Auth required for all workspace endpoints
- Rate limiting on mutations
- No file upload blobs (attachment notes only — reduces attack surface)
- HMAC, signed downloads, audit preserved

## Testing
- `scripts/v25-workspace-test.mjs`
