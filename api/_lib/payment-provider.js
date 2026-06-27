/**
 * Payment provider — Razorpay only (launch).
 * Server config; never exposed as a customer choice.
 */
import { trimEnv } from "./tokens.js";

export const PROVIDERS = {
  RAZORPAY: "razorpay",
};

export function getActivePaymentProvider() {
  return PROVIDERS.RAZORPAY;
}

export function listPaymentProviders() {
  return [PROVIDERS.RAZORPAY];
}

export function getConfiguredPaymentProvider() {
  return PROVIDERS.RAZORPAY;
}

export function resolvePaymentProvider(_req) {
  return PROVIDERS.RAZORPAY;
}

export function isRazorpayActive() {
  return true;
}

export function getCheckoutBrandLabel() {
  return "Razorpay";
}

export function getPaymentMethodsNote(currency) {
  if (currency === "INR") {
    return "Cards, UPI, NetBanking, and Wallets via Razorpay";
  }
  return "International cards via Razorpay where available on your merchant account";
}
