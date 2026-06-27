// Commercial plan catalog — v21.0 (single source of truth for tiers + limits)
export const PLAN_CATALOG = [
  {
    id: "starter",
    label: "Starter",
    maxItems: 50,
    maxProjects: 1,
    selfServe: true,
    summary: "Up to 50 work items · 1 project",
    features: [
      "Executive summary",
      "Governance score",
      "AI-related work items summary",
      "PDF-ready report",
      "Email delivery",
      "Report recovery",
    ],
  },
  {
    id: "professional",
    label: "Professional",
    maxItems: 500,
    maxProjects: 3,
    selfServe: true,
    summary: "Up to 500 work items · 3 projects",
    features: [
      "Everything in Starter",
      "Department analysis",
      "Risk matrix",
      "Framework mapping",
      "Priority processing",
    ],
  },
  {
    id: "business",
    label: "Business",
    maxItems: 1000,
    maxProjects: 10,
    selfServe: true,
    summary: "Up to 1,000 work items · portfolio analysis",
    features: [
      "Everything in Professional",
      "Portfolio analysis",
      "Advanced recommendations",
      "Team dashboard access",
    ],
  },
  {
    id: "business_plus",
    label: "Business Plus",
    maxItems: 20000,
    maxProjects: 25,
    selfServe: true,
    summary: "Large multi-project assessments",
    features: [
      "Everything in Business",
      "Multiple departments",
      "Extended retention",
      "Advanced analytics",
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    maxItems: 100000,
    maxProjects: 100,
    selfServe: false,
    summary: "Very large organizational assessments",
    features: [
      "Dedicated processing",
      "Portfolio reporting",
      "Priority support",
      "SLA options",
    ],
  },
  {
    id: "enterprise_plus",
    label: "Enterprise Plus",
    maxItems: Infinity,
    maxProjects: Infinity,
    selfServe: false,
    summary: "Custom enterprise requirements",
    features: ["SSO", "API access", "Dedicated support", "Custom SLA", "Custom quote"],
  },
];

export const ENTERPRISE_GATE_WORK_ITEMS = 1000;
export const ENTERPRISE_MAX_BYTES = 50 * 1024 * 1024;
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const ENTERPRISE_PARSE_MAX_ITEMS = 100000;

export const REQUIRED_FIELDS = [
  {
    id: "issueKey",
    label: "Issue Key",
    aliases: ["issue key", "key", "id", "work item id", "work item", "ticket id"],
    why: "Uniquely identifies each work item in your assessment.",
  },
  {
    id: "summary",
    label: "Summary",
    aliases: ["summary", "title", "name"],
    why: "Used to identify AI opportunities across your portfolio.",
  },
  {
    id: "description",
    label: "Description",
    aliases: ["description", "details", "body"],
    why: "Provides business context for AI and automation signals.",
  },
  {
    id: "issueType",
    label: "Issue Type",
    aliases: ["issue type", "type", "work item type", "item type"],
    why: "Classifies governance maturity and review workflows.",
  },
  {
    id: "status",
    label: "Status",
    aliases: ["status", "state", "workflow state"],
    why: "Shows lifecycle stage for prioritization and risk review.",
  },
  {
    id: "project",
    label: "Project",
    aliases: ["project", "project name", "project key", "team project", "area path"],
    why: "Creates project-level governance insights and rollups.",
  },
];

export const RECOMMENDED_FIELDS = [
  { id: "priority", label: "Priority", aliases: ["priority", "severity"], why: "Prioritizes high-impact AI-related work items." },
  { id: "labels", label: "Labels", aliases: ["labels", "label", "tags"], why: "Improves AI signal detection accuracy." },
  { id: "components", label: "Components", aliases: ["components", "component"], why: "Maps governance scope to system components." },
  { id: "assignee", label: "Assignee", aliases: ["assignee", "assigned to"], why: "Identifies accountable owners." },
  { id: "reporter", label: "Reporter", aliases: ["reporter", "created by", "author"], why: "Tracks initiative origin for audit trails." },
];

export const OPTIONAL_FIELDS = [
  { id: "storyPoints", label: "Story Points", aliases: ["story points", "points", "effort"] },
  { id: "sprint", label: "Sprint", aliases: ["sprint", "iteration"] },
  { id: "epic", label: "Epic", aliases: ["epic link", "epic", "parent"] },
  { id: "resolution", label: "Resolution", aliases: ["resolution", "resolved"] },
  { id: "customFields", label: "Custom Fields", aliases: ["custom field", "cf"] },
];

export const SUPPORTED_SOURCES = ["jira", "azure-devops", "excel", "csv"];
export const COMING_SOON_SOURCES = ["github", "servicenow", "monday", "asana", "clickup", "azure-boards", "gitlab"];

export function getPlanById(planId) {
  return PLAN_CATALOG.find((p) => p.id === planId) || PLAN_CATALOG[0];
}

export function detectPlanTier(workItemCount, projectCount, byteLength) {
  if (workItemCount > ENTERPRISE_GATE_WORK_ITEMS) {
    return getPlanById("enterprise");
  }
  if (projectCount > 30 || workItemCount > 50000) {
    return getPlanById("enterprise_plus");
  }
  if (projectCount > 10 || workItemCount > 20000 || byteLength > ENTERPRISE_MAX_BYTES) {
    return getPlanById("enterprise");
  }
  if (workItemCount > 1000 || projectCount > 10) {
    return getPlanById("business_plus");
  }
  if (workItemCount > 500 || projectCount > 3) {
    return getPlanById("business");
  }
  if (workItemCount > 50 || projectCount > 1) {
    return getPlanById("professional");
  }
  return getPlanById("starter");
}

export function planRecommendationReason(plan, workItemCount, projectCount, byteLength) {
  const reasons = [];
  if (workItemCount > 50 && plan.id !== "starter") {
    reasons.push(`Your upload contains ${workItemCount.toLocaleString()} work items, which exceeds the Starter limit of 50.`);
  }
  if (projectCount > 1 && plan.id !== "starter") {
    reasons.push(`Your data spans ${projectCount} projects — ${plan.label} supports your portfolio size.`);
  }
  if (plan.id === "enterprise" || plan.id === "enterprise_plus") {
    reasons.push("Enterprise assessments include dedicated processing, portfolio reporting, priority support, and SLA options.");
  }
  if (byteLength > UPLOAD_MAX_BYTES && plan.selfServe === false) {
    reasons.push("Large datasets require enterprise-grade processing and secure handling.");
  }
  if (!reasons.length) {
    reasons.push(`${plan.label} is the right fit for ${workItemCount} work items across ${projectCount} project(s).`);
  }
  return reasons.join(" ");
}

export function planBlockReason(plan, workItemCount, projectCount) {
  if (workItemCount > ENTERPRISE_GATE_WORK_ITEMS) {
    return `Your upload contains ${workItemCount.toLocaleString()} work items, which exceeds the self-service limit of ${ENTERPRISE_GATE_WORK_ITEMS.toLocaleString()}. Enterprise Assessment Required — our sales team will provide a custom quote and secure payment link.`;
  }
  if (plan.selfServe) {
    return "";
  }
  if (plan.id === "enterprise_plus") {
    return "Your assessment requires custom scoping, SSO, API integration, or dedicated support. Our sales team will provide a tailored quote.";
  }
  return `Your upload qualifies for ${plan.label}. Self-serve checkout is available for Starter through Business Plus. Contact sales@aigovernancehub.ai for enterprise processing.`;
}
