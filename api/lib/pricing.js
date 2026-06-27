// Backend pricing — v25.3 (Razorpay launch, server-authoritative)
import { PLAN_CATALOG, getPlanById } from "./assessment-config.js";
import {
  resolvePaymentProvider,
  getCheckoutBrandLabel,
  getPaymentMethodsNote,
} from "./payment-provider.js";

const BASE_PRICES_INR_PAISE = {
  starter: 19900,
  professional: 59900,
  business: 99900,
  business_plus: 599900,
  enterprise: 999900,
};

const FX_FROM_INR = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AUD: 0.018,
  SGD: 0.016,
};

const CURRENCY_META = {
  INR: { symbol: "₹", code: "INR", decimals: 0, razorpay: true },
  USD: { symbol: "$", code: "USD", decimals: 2, razorpay: true },
  EUR: { symbol: "€", code: "EUR", decimals: 2, razorpay: true },
  GBP: { symbol: "£", code: "GBP", decimals: 2, razorpay: true },
  AUD: { symbol: "A$", code: "AUD", decimals: 2, razorpay: true },
  SGD: { symbol: "S$", code: "SGD", decimals: 2, razorpay: true },
};

const COUNTRY_CURRENCY = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  AU: "AUD",
  SG: "SGD",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  IE: "EUR",
  BE: "EUR",
  AT: "EUR",
};

function trimEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toMinor(amountMajor, currencyCode) {
  const meta = CURRENCY_META[currencyCode] || CURRENCY_META.INR;
  const factor = meta.decimals === 0 ? 1 : 100;
  return Math.round(Number(amountMajor) * factor);
}

function fromInrPaise(inrPaise, currencyCode) {
  const rate = FX_FROM_INR[currencyCode] || 1;
  const meta = CURRENCY_META[currencyCode] || CURRENCY_META.INR;
  if (currencyCode === "INR") {
    return inrPaise;
  }
  const majorInr = inrPaise / 100;
  const convertedMajor = majorInr * rate;
  return toMinor(convertedMajor, currencyCode);
}

export function formatMoney(minor, currencyCode) {
  const meta = CURRENCY_META[currencyCode] || CURRENCY_META.INR;
  const factor = currencyCode === "INR" ? 100 : meta.decimals === 0 ? 1 : 100;
  const major = minor / factor;
  if (currencyCode === "INR") {
    return `${meta.symbol}${Math.round(major).toLocaleString("en-IN")}`;
  }
  return `${meta.symbol}${major.toFixed(meta.decimals)}`;
}

export function detectCountry(req) {
  return (
    (typeof req.headers["x-vercel-ip-country"] === "string" && req.headers["x-vercel-ip-country"]) ||
    (typeof req.headers["cf-ipcountry"] === "string" && req.headers["cf-ipcountry"]) ||
    ""
  ).toUpperCase();
}

/** @deprecated use resolvePaymentProvider from payment-provider.js */
export function detectPaymentProvider(req) {
  return resolvePaymentProvider(req);
}

export function detectCurrency(req) {
  const queryCurrency =
    typeof req.query?.currency === "string" ? req.query.currency.toUpperCase() : "";
  if (queryCurrency && CURRENCY_META[queryCurrency]) {
    return queryCurrency;
  }
  const country = detectCountry(req);
  return COUNTRY_CURRENCY[country] || "INR";
}

export function getPlanBasePriceMinor(planId, currencyCode) {
  const inrPaise = BASE_PRICES_INR_PAISE[planId];
  if (!inrPaise) {
    return null;
  }
  return fromInrPaise(inrPaise, currencyCode);
}

export function buildOrderQuote(planId, currencyCode, options = {}) {
  const plan = getPlanById(planId);
  if (!plan.selfServe) {
    return {
      plan: { id: plan.id, label: plan.label, selfServe: false },
      checkoutAvailable: false,
      message: "Contact sales@aigovernancehub.ai for enterprise pricing.",
    };
  }

  const currency = CURRENCY_META[currencyCode] ? currencyCode : "INR";
  const baseMinor = getPlanBasePriceMinor(plan.id, currency);
  if (baseMinor == null) {
    return { checkoutAvailable: false, message: "Pricing unavailable for this plan." };
  }

  const convenienceFeeMinor = Number(trimEnv("CONVENIENCE_FEE_PAISE", "0")) || 0;
  const taxRate = Number(trimEnv("TAX_RATE", "0.18"));
  const discountMinor = Number(options.discountMinor || 0);
  const taxable = baseMinor + convenienceFeeMinor - discountMinor;
  const taxMinor = Math.max(0, Math.round(taxable * taxRate));
  const totalMinor = taxable + taxMinor;

  return {
    checkoutAvailable: true,
    checkoutBrand: getCheckoutBrandLabel(),
    plan: {
      id: plan.id,
      label: plan.label,
      summary: plan.summary,
      features: plan.features,
      selfServe: true,
    },
    currency,
    currencySymbol: CURRENCY_META[currency].symbol,
    baseMinor,
    baseDisplay: formatMoney(baseMinor, currency),
    convenienceFeeMinor,
    convenienceFeeDisplay: formatMoney(convenienceFeeMinor, currency),
    taxMinor,
    taxDisplay: formatMoney(taxMinor, currency),
    taxLabel: currency === "INR" ? trimEnv("TAX_LABEL", "GST (18%)") : trimEnv("TAX_LABEL", "Applicable taxes"),
    discountMinor,
    discountDisplay: formatMoney(discountMinor, currency),
    totalMinor,
    totalDisplay: formatMoney(totalMinor, currency),
    razorpayAmount: totalMinor,
    razorpayCurrency: currency,
    paymentMethodsNote: getPaymentMethodsNote(currency),
    reportDeliverables: [
      "Interactive HTML report",
      "PDF executive report",
      "Word (DOCX) report",
      "PowerPoint presentation",
      "Text summary",
    ],
    refundPolicyNote:
      "Your full report is generated immediately after verified payment. Refunds are handled case-by-case within 7 days for platform errors — see our Refund Policy.",
    refundPolicyUrl: "/refund-policy.html",
    supportEmail: "support@aigovernancehub.ai",
  };
}

export function getCommercialCatalog(currencyCode) {
  const currency = CURRENCY_META[currencyCode] ? currencyCode : "INR";
  return PLAN_CATALOG.map((plan) => {
    const baseMinor = getPlanBasePriceMinor(plan.id, currency);
    return {
      id: plan.id,
      label: plan.label,
      summary: plan.summary,
      features: plan.features,
      selfServe: plan.selfServe,
      limits: { maxItems: plan.maxItems, maxProjects: plan.maxProjects },
      priceDisplay: baseMinor != null ? formatMoney(baseMinor, currency) : "Contact Sales",
      priceMinor: baseMinor,
      currency,
    };
  });
}

export function getAllCurrencies() {
  return Object.keys(CURRENCY_META).map((code) => ({
    code,
    symbol: CURRENCY_META[code].symbol,
    razorpay: CURRENCY_META[code].razorpay,
  }));
}

export function getLegacyStarterPricing(req) {
  const currency = detectCurrency(req);
  const quote = buildOrderQuote("starter", currency);
  return {
    product: "AI Governance Assessment",
    currency: quote.currency,
    symbol: quote.currencySymbol,
    amountMinor: quote.baseMinor,
    amountDisplay: quote.baseDisplay,
    checkoutAvailable: quote.checkoutAvailable,
    checkoutBrand: quote.checkoutBrand,
    checkoutCurrency: quote.razorpayCurrency,
    checkoutAmountMinor: quote.totalMinor,
    checkoutAmountDisplay: quote.totalDisplay,
    note: quote.paymentMethodsNote,
  };
}
