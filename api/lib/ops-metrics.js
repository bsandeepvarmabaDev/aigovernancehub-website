/**
 * Operational metrics rollup — v25.9 (admin diagnostics only).
 */
import { getJson, isStorageConfigured, putJson } from "./storage.js";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function rollupStorageKey(date = todayKey()) {
  return `ops/rollup/${date}.json`;
}

function issuesStorageKey() {
  return "ops/recent-issues.json";
}

function defaultRollup(date = todayKey()) {
  return {
    date,
    updatedAt: new Date().toISOString(),
    counters: {},
    timings: {},
    errorsByCategory: {},
  };
}

async function loadRollup(date = todayKey()) {
  return (await getJson(rollupStorageKey(date))) || defaultRollup(date);
}

async function mutateRollup(mutator) {
  if (!isStorageConfigured()) {
    return null;
  }
  try {
    const rollup = await loadRollup();
    mutator(rollup);
    rollup.updatedAt = new Date().toISOString();
    await putJson(rollupStorageKey(), rollup);
    return rollup;
  } catch {
    return null;
  }
}

export async function incrementOpsCounter(name, delta = 1) {
  if (!name || !Number.isFinite(delta)) return;
  await mutateRollup((rollup) => {
    rollup.counters[name] = Number(rollup.counters[name] || 0) + delta;
  });
}

export async function recordOpsTiming(name, durationMs) {
  if (!name || !Number.isFinite(durationMs) || durationMs < 0) return;
  await mutateRollup((rollup) => {
    if (!rollup.timings[name]) {
      rollup.timings[name] = { count: 0, totalMs: 0, maxMs: 0 };
    }
    const bucket = rollup.timings[name];
    bucket.count += 1;
    bucket.totalMs += durationMs;
    bucket.maxMs = Math.max(bucket.maxMs, durationMs);
  });
}

export async function recordOpsError(category) {
  if (!category) return;
  await mutateRollup((rollup) => {
    rollup.errorsByCategory[category] = Number(rollup.errorsByCategory[category] || 0) + 1;
  });
  await incrementOpsCounter("errors_total");
}

export async function recordOperationalIssue(type, meta = {}) {
  if (!isStorageConfigured()) {
    return;
  }
  const issue = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    at: new Date().toISOString(),
    ...meta,
  };
  const existing = (await getJson(issuesStorageKey())) || [];
  existing.unshift(issue);
  await putJson(issuesStorageKey(), existing.slice(0, 50));
  await recordOpsError(type);
}

export async function getOpsRollups(days = 7) {
  const bounded = Math.min(Math.max(days, 1), 30);
  const rollups = [];
  const now = new Date();
  for (let i = 0; i < bounded; i += 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    rollups.push(await loadRollup(date));
  }
  return rollups;
}

function aggregateRollups(rollups) {
  const counters = {};
  const timings = {};
  const errorsByCategory = {};

  for (const rollup of rollups) {
    for (const [key, value] of Object.entries(rollup.counters || {})) {
      counters[key] = Number(counters[key] || 0) + Number(value || 0);
    }
    for (const [key, bucket] of Object.entries(rollup.timings || {})) {
      if (!timings[key]) timings[key] = { count: 0, totalMs: 0, maxMs: 0 };
      timings[key].count += Number(bucket.count || 0);
      timings[key].totalMs += Number(bucket.totalMs || 0);
      timings[key].maxMs = Math.max(timings[key].maxMs, Number(bucket.maxMs || 0));
    }
    for (const [key, value] of Object.entries(rollup.errorsByCategory || {})) {
      errorsByCategory[key] = Number(errorsByCategory[key] || 0) + Number(value || 0);
    }
  }

  const averages = {};
  for (const [key, bucket] of Object.entries(timings)) {
    averages[key] =
      bucket.count > 0 ? Math.round(bucket.totalMs / bucket.count) : null;
  }

  return { counters, timings, averages, errorsByCategory };
}

export async function getOperationsMetrics(days = 7) {
  const rollups = await getOpsRollups(days);
  const aggregated = aggregateRollups(rollups);
  const recentIssues = (await getJson(issuesStorageKey())) || [];

  return {
    periodDays: days,
    ...aggregated,
    recentIssues: recentIssues.slice(0, 20),
    pendingUploads: Number(aggregated.counters.upload_received || 0) -
      Number(aggregated.counters.validation_complete || 0),
    pendingPayments: Number(aggregated.counters.payment_started || 0) -
      Number(aggregated.counters.payment_verified || 0),
    failedPayments: Number(aggregated.counters.payment_verify_failed || 0),
    failedReportGenerations: Number(aggregated.counters.report_generation_failed || 0),
    failedEmails: Number(aggregated.counters.report_email_failed || 0),
    rateLimitViolations: Number(aggregated.counters.rate_limit_exceeded || 0),
  };
}
