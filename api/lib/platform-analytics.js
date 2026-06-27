/**
 * AI Governance Hub v24.0 — Platform analytics (admin, server-side)
 */
import crypto from "crypto";
import { getAnalyticsSummary } from "./analytics.js";
import { getJson } from "./storage.js";
import { getKeySecret } from "./tokens.js";

const BASE_PRICES_INR_PAISE = {
  starter: 19900,
  professional: 59900,
  business: 99900,
  business_plus: 599900,
  enterprise: 999900,
};

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function analyticsDayKey(date = new Date()) {
  return `analytics/daily/${dayKey(date)}.json`;
}

function emailHash(email, keySecret) {
  return crypto.createHmac("sha256", keySecret).update(String(email).toLowerCase().trim()).digest("hex");
}

export async function getPlatformAnalytics(days = 7) {
  const summary = await getAnalyticsSummary(days);
  const keySecret = getKeySecret();

  const planCounts = {};
  const enterpriseLeads = [];
  const paymentEmailHashes = new Map();
  let revenueInrPaise = 0;

  for (let i = 0; i < days; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const events = (await getJson(analyticsDayKey(date))) || [];
    events.forEach((entry) => {
      const meta = entry.metadata || {};
      if (entry.event === "payment_verified") {
        const tier = meta.planTier || "starter";
        planCounts[tier] = (planCounts[tier] || 0) + 1;
        const paise = BASE_PRICES_INR_PAISE[tier];
        if (paise) revenueInrPaise += paise;
        if (meta.emailHash) {
          paymentEmailHashes.set(meta.emailHash, (paymentEmailHashes.get(meta.emailHash) || 0) + 1);
        }
      }
      if (entry.event === "checkout_started") {
        const tier = meta.planTier || "starter";
        if (tier === "enterprise" || tier === "enterprise_plus") {
          enterpriseLeads.push({ timestamp: entry.timestamp, country: entry.country, planTier: tier });
        }
      }
    });
  }

  const repeatCustomers = [...paymentEmailHashes.values()].filter((c) => c > 1).length;
  const conversionRate =
    summary.checkouts > 0 ? Math.round((summary.payments / summary.checkouts) * 1000) / 10 : 0;

  return {
    periodDays: days,
    funnel: {
      uploads: summary.uploads,
      previews: summary.previews,
      checkouts: summary.checkouts,
      payments: summary.payments,
      downloads: summary.downloads,
      recoveries: summary.recoveries,
      conversionRatePercent: conversionRate,
    },
    revenue: {
      estimatedInrPaise: revenueInrPaise,
      estimatedInr: Math.round(revenueInrPaise / 100),
      note: "Estimated from verified payments × list price; excludes refunds and currency FX.",
    },
    assessments: summary.payments,
    countries: summary.countries,
    plans: planCounts,
    enterpriseLeads: enterpriseLeads.slice(0, 50),
    repeatCustomers,
    referrers: summary.referrers,
  };
}

export function hashEmailForAnalytics(email, keySecret) {
  if (!keySecret || !email) return null;
  return emailHash(email, keySecret);
}
