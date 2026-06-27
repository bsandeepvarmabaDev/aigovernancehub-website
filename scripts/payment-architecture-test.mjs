#!/usr/bin/env node
/**
 * Payment architecture P0 — Razorpay launch tests
 */
import {
  resolvePaymentProvider,
  getConfiguredPaymentProvider,
  getCheckoutBrandLabel,
  getPaymentMethodsNote,
  PROVIDERS,
} from "../api/lib/payment-provider.js";
import { buildOrderQuote } from "../api/lib/pricing.js";
import { isRazorpayConfigured } from "../api/lib/razorpay-client.js";

const results = [];
function pass(id, msg) { results.push({ id, ok: true, msg }); }
function fail(id, msg) { results.push({ id, ok: false, msg }); }

if (getConfiguredPaymentProvider() === PROVIDERS.RAZORPAY) {
  pass("P1-launch-provider", "Default provider is Razorpay");
} else fail("P1-launch-provider", getConfiguredPaymentProvider());

const usReq = { headers: { "x-vercel-ip-country": "US" } };
if (resolvePaymentProvider(usReq) === PROVIDERS.RAZORPAY) {
  pass("P2-intl-razorpay", "International still uses Razorpay at launch");
} else fail("P2-intl-razorpay", resolvePaymentProvider(usReq));

if (getCheckoutBrandLabel() === "Razorpay") pass("P3-brand", "Single customer-facing brand");
else fail("P3-brand", getCheckoutBrandLabel());

const quote = buildOrderQuote("starter", "USD");
if (quote.checkoutBrand === "Razorpay" && !quote.paymentProvider) {
  pass("P4-quote-no-provider-leak", "Quote does not expose provider switch");
} else fail("P4-quote-no-provider-leak", JSON.stringify({ brand: quote.checkoutBrand, provider: quote.paymentProvider }));

if (getPaymentMethodsNote("USD").includes("Razorpay")) {
  pass("P5-intl-note", "International note references Razorpay");
} else fail("P5-intl-note", getPaymentMethodsNote("USD"));

if (typeof isRazorpayConfigured === "function") pass("P6-razorpay-client", "Razorpay client present");
else fail("P6-razorpay-client", "missing");

const failed = results.filter((r) => !r.ok);
console.log("\nPayment Architecture P0 Tests\n");
results.forEach((r) => console.log((r.ok ? "PASS" : "FAIL") + " " + r.id + " — " + r.msg));
console.log("\n" + results.filter((r) => r.ok).length + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
