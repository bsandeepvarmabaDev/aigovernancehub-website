/**
 * AI Governance Hub v25.0 — REST API foundation (future integrations)
 */
export const REST_API_V1 = {
  version: "1.0",
  basePath: "/api/v1/workspace",
  authentication: {
    current: "session_cookie",
    cookieName: "agh_session",
    future: ["oauth2", "api_key", "service_account"],
  },
  rateLimit: "Shared platform rate limits apply per IP and endpoint.",
  integrations: {
    planned: [
      { id: "jira", label: "Atlassian Jira", sync: "tasks_bidirectional" },
      { id: "azure-devops", label: "Azure DevOps", sync: "work_items" },
      { id: "servicenow", label: "ServiceNow", sync: "change_requests" },
      { id: "github", label: "GitHub", sync: "issues" },
    ],
    status: "foundation_only",
  },
  resources: {
    workspace: {
      GET: "Full workspace state (tasks, kanban, health, history, effectiveness)",
      description: "Returns governance workspace for authenticated user.",
    },
    tasks: {
      GET: "List tasks",
      PATCH: "Update task fields",
      POST: "Add comment or attachment metadata",
    },
    export: {
      GET: "Export workspace data — format=csv|json|xlsx|pdf|pptx",
    },
    report: {
      GET: "Management report — period=weekly|monthly|quarterly&format=html|pdf",
    },
  },
  schemas: {
    task: {
      id: "string",
      title: "string",
      description: "string",
      priority: "Critical|High|Medium|Low",
      owner: "string",
      department: "string",
      dueDate: "ISO8601|null",
      status: "todo|in_progress|blocked|completed",
      evidence: "string",
      completionNotes: "string",
    },
  },
};

export function restApiManifest() {
  return {
    ...REST_API_V1,
    generatedAt: new Date().toISOString(),
    platformVersion: "25.0",
  };
}
