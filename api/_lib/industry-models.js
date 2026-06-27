/**
 * AI Governance Hub v24.0 — Industry models (rule-based, no fabricated benchmarks)
 */
export const INDUSTRY_IDS = [
  "general",
  "healthcare",
  "banking",
  "insurance",
  "retail",
  "manufacturing",
  "government",
  "technology",
];

export const INDUSTRY_PROFILES = {
  general: {
    id: "general",
    label: "General Enterprise",
    regulatoryLens: "Cross-industry AI governance and responsible use",
    primaryFrameworks: ["ISO 42001", "NIST AI RMF", "Internal Governance"],
    riskEmphasis: "Operational AI risk, data quality, and ownership gaps",
    opportunityEmphasis: "Productivity automation and decision-support AI",
  },
  healthcare: {
    id: "healthcare",
    label: "Healthcare",
    regulatoryLens: "HIPAA-aligned data handling, clinical safety, and PHI boundaries for AI",
    primaryFrameworks: ["HIPAA", "ISO 42001", "FDA SaMD (where applicable)", "NIST AI RMF"],
    riskEmphasis: "Patient safety, PHI exposure, clinical validation, and bias in care pathways",
    opportunityEmphasis: "Documentation automation, coding assistance, and operational workflow AI",
  },
  banking: {
    id: "banking",
    label: "Banking & Financial Services",
    regulatoryLens: "Model risk management (SR 11-7), fair lending, and third-party AI vendor oversight",
    primaryFrameworks: ["SR 11-7", "ISO 42001", "NIST AI RMF", "Basel operational risk"],
    riskEmphasis: "Credit/fraud models, explainability, conduct risk, and vendor concentration",
    opportunityEmphasis: "KYC automation, fraud detection augmentation, and service desk AI",
  },
  insurance: {
    id: "insurance",
    label: "Insurance",
    regulatoryLens: "Actuarial governance, claims fairness, and state insurance AI guidance",
    primaryFrameworks: ["NAIC Model Bulletin", "ISO 42001", "NIST AI RMF"],
    riskEmphasis: "Underwriting bias, claims automation errors, and regulatory filing accuracy",
    opportunityEmphasis: "Claims triage, policy summarization, and broker support automation",
  },
  retail: {
    id: "retail",
    label: "Retail & Consumer",
    regulatoryLens: "Consumer privacy, pricing transparency, and brand-safe generative AI",
    primaryFrameworks: ["GDPR/CCPA", "ISO 42001", "Responsible AI"],
    riskEmphasis: "Personalization overreach, IP in generated content, and supply chain data leaks",
    opportunityEmphasis: "Catalog enrichment, support bots, and demand forecasting assist",
  },
  manufacturing: {
    id: "manufacturing",
    label: "Manufacturing",
    regulatoryLens: "OT/IT convergence, safety systems, and quality traceability for AI",
    primaryFrameworks: ["ISO 42001", "IEC 62443", "NIST AI RMF"],
    riskEmphasis: "Safety-critical automation, predictive maintenance false positives, and IP leakage",
    opportunityEmphasis: "Predictive maintenance, quality inspection assist, and supply planning",
  },
  government: {
    id: "government",
    label: "Government & Public Sector",
    regulatoryLens: "Public accountability, procurement rules, and citizen data protection",
    primaryFrameworks: ["NIST AI RMF", "ISO 42001", "Responsible AI", "Internal policy"],
    riskEmphasis: "Transparency, equity, FOIA-ready documentation, and vendor lock-in",
    opportunityEmphasis: "Citizen service automation, document processing, and case routing",
  },
  technology: {
    id: "technology",
    label: "Technology",
    regulatoryLens: "Secure SDLC for AI features, IP management, and customer data boundaries",
    primaryFrameworks: ["ISO 42001", "NIST AI RMF", "SOC 2 controls", "Responsible AI"],
    riskEmphasis: "Prompt injection, customer data in training, and shipping unaudited copilots",
    opportunityEmphasis: "Developer productivity, support deflection, and internal knowledge AI",
  },
};

export function normalizeIndustry(value) {
  const id = String(value || "general")
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, "");
  const map = {
    health: "healthcare",
    healthtech: "healthcare",
    finance: "banking",
    fintech: "banking",
    publicsector: "government",
    tech: "technology",
    software: "technology",
  };
  const resolved = map[id] || id;
  return INDUSTRY_IDS.includes(resolved) ? resolved : "general";
}

/**
 * Apply industry context to executive assessment — copy and emphasis only, scores unchanged.
 */
export function applyIndustryModel(executive, industryId) {
  const profile = INDUSTRY_PROFILES[normalizeIndustry(industryId)] || INDUSTRY_PROFILES.general;
  const clone = { ...executive, industryProfile: profile };

  clone.assessmentOverview = {
    ...executive.assessmentOverview,
    industry: profile.label,
  };

  if (executive.executiveInsights?.length) {
    clone.executiveInsights = [
      `[${profile.label}] ${profile.regulatoryLens}`,
      ...executive.executiveInsights.slice(0, 5),
    ];
  }

  if (executive.recommendations?.length) {
    clone.recommendations = executive.recommendations.map((r) => ({
      ...r,
      why: r.why,
      industryNote: `${profile.riskEmphasis} — prioritize controls aligned with ${profile.primaryFrameworks[0]}.`,
    }));
  }

  clone.industryContext = {
    profile: profile.label,
    regulatoryLens: profile.regulatoryLens,
    primaryFrameworks: profile.primaryFrameworks,
    riskEmphasis: profile.riskEmphasis,
    opportunityEmphasis: profile.opportunityEmphasis,
    disclaimer:
      "Industry framing is advisory planning context derived from your upload — not legal or regulatory certification.",
  };

  return clone;
}

export function listIndustries() {
  return INDUSTRY_IDS.filter((id) => id !== "general").map((id) => ({
    id,
    label: INDUSTRY_PROFILES[id].label,
  }));
}
