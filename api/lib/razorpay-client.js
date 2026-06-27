/**
 * Razorpay API helpers — single launch gateway (P0).
 */
import crypto from "crypto";
import { trimEnv, safeCompare } from "./tokens.js";

export function isRazorpayConfigured() {
  const keyId = trimEnv(process.env.RAZORPAY_KEY_ID);
  const keySecret = trimEnv(process.env.RAZORPAY_KEY_SECRET);
  return Boolean(keyId && keySecret && /^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId));
}

export function getRazorpayKeyId() {
  return trimEnv(process.env.RAZORPAY_KEY_ID);
}

export function getRazorpayKeySecret() {
  return trimEnv(process.env.RAZORPAY_KEY_SECRET);
}

export async function createRazorpayOrder({ amountMinor, currency, receipt, notes }) {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured.");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountMinor,
      currency,
      receipt,
      notes,
    }),
  });

  const rawBody = await response.text();
  let order = {};
  try {
    order = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    order = {};
  }

  if (!response.ok || !order.id || typeof order.amount !== "number" || !order.currency) {
    throw new Error("Unable to create Razorpay order.");
  }

  if (order.amount !== amountMinor) {
    throw new Error("Razorpay amount mismatch.");
  }

  return order;
}

export function verifyRazorpayPaymentSignature(orderId, paymentId, signature, keySecret) {
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeCompare(expected, signature);
}

export function getRazorpayWebhookSecret() {
  return trimEnv(process.env.RAZORPAY_WEBHOOK_SECRET) || getRazorpayKeySecret();
}

export function verifyRazorpayWebhookSignature(rawBody, signatureHeader) {
  const secret = getRazorpayWebhookSecret();
  if (!secret || !signatureHeader) {
    return false;
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompare(expected, signatureHeader);
}

export async function fetchRazorpayPayment(paymentId) {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured.");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const rawBody = await response.text();
  let payment = {};
  try {
    payment = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    payment = {};
  }

  if (!response.ok || !payment.id) {
    throw new Error("Unable to fetch Razorpay payment.");
  }

  return payment;
}
