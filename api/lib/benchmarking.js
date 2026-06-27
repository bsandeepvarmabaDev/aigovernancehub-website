/**
 * AI Governance Hub v24.0 — Benchmarking foundation (architecture only)
 * No fabricated benchmark data. Opt-in anonymized aggregation for future releases.
 */
export const BENCHMARK_SCHEMA_VERSION = "1.0";

export const BENCHMARK_ARCHITECTURE = {
  version: BENCHMARK_SCHEMA_VERSION,
  status: "foundation_only",
  description:
    "Architecture prepared for future peer benchmarking using opt-in, anonymized customer aggregates only.",
  optInRequired: true,
  minimumSampleSize: 10,
  anonymization: {
    method: "k-anonymity",
    k: 10,
    fieldsRemoved: ["buyerEmail", "buyerName", "company", "orderId", "filename"],
    fieldsHashed: ["industry", "planTier", "country"],
  },
  permittedMetrics: [
    "governanceScore",
    "aiReadiness",
    "maturityScore",
    "criticalRiskCount",
    "highRiskCount",
    "recommendationCount",
    "aiCandidateRatio",
  ],
  comparisonDimensions: ["industry", "planTier", "companySizeBand", "region"],
  storageKeyPattern: "benchmarks/aggregates/{industry}/{quarter}.json",
  consentRecordPattern: "benchmarks/consent/{emailHash}.json",
  prohibited: [
    "Fabricated industry averages",
    "Client-side benchmark computation",
    "Identifiable peer naming",
    "Benchmark display without minimum sample size",
  ],
};

/**
 * Returns benchmark placeholder for UI — explicitly no peer data until opt-in cohort exists.
 */
export function getBenchmarkPlaceholder(industryId = "general") {
  return {
    available: false,
    reason: "Peer benchmarking requires opt-in participation from a minimum of 10 organizations in your industry.",
    industry: industryId,
    schemaVersion: BENCHMARK_SCHEMA_VERSION,
    optInUrl: "/trust-center.html#benchmarking",
    futureMetrics: BENCHMARK_ARCHITECTURE.permittedMetrics,
  };
}

/**
 * Validate aggregate record shape for future ingestion pipeline.
 */
export function validateBenchmarkAggregate(record) {
  if (!record || typeof record !== "object") return false;
  if (record.sampleSize < BENCHMARK_ARCHITECTURE.minimumSampleSize) return false;
  for (const key of BENCHMARK_ARCHITECTURE.permittedMetrics) {
    if (typeof record[key] !== "number" && record[key] != null) return false;
  }
  return true;
}
