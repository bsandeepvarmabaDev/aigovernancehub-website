// AI Governance Hub API — verify-payment v16.5.2
import crypto from "crypto";

const TOKEN_TTL_MS = 15 * 60 * 1000;

function trimEnv(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeCompare(expected, actual) {
  if (typeof expected !== "string" || typeof actual !== "string") {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function createConfirmationToken(orderId, paymentId, keySecret) {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${orderId}|${paymentId}|${expiresAt}`;
  const signature = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");
  return Buffer.from(`${payload}|${signature}`).toString("base64url");
}

function validateConfirmationToken(token, keySecret) {
  if (!isNonEmptyString(token)) {
    return false;
  }

  let decoded = "";

  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const parts = decoded.split("|");
  if (parts.length !== 4) {
    return false;
  }

  const [orderId, paymentId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (!orderId || !paymentId || !Number.isFinite(expiresAt) || !signature) {
    return false;
  }

  if (Date.now() > expiresAt) {
    return false;
  }

  const payload = `${orderId}|${paymentId}|${expiresAt}`;
  const expectedSignature = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");

  return safeCompare(expectedSignature, signature);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const keySecret = trimEnv(process.env.RAZORPAY_KEY_SECRET);

  if (!keySecret) {
    return res.status(503).json({ error: "Payment verification is not configured." });
  }

  const body = req.body || {};

  if (isNonEmptyString(body.confirmationToken)) {
    const isValid = validateConfirmationToken(body.confirmationToken, keySecret);

    if (!isValid) {
      return res.status(400).json({ valid: false, error: "Confirmation token is invalid or expired." });
    }

    return res.status(200).json({
      valid: true,
      message: "Payment verified. AI Governance Starter Report request received.",
    });
  }

  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  const name = body.name;
  const email = body.email;

  if (!isNonEmptyString(orderId) || !isNonEmptyString(paymentId) || !isNonEmptyString(signature)) {
    return res.status(400).json({ error: "Invalid payment verification request." });
  }

  if (!isNonEmptyString(name) || !isNonEmptyString(email)) {
    return res.status(400).json({ error: "Missing required contact details." });
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (!safeCompare(expectedSignature, signature)) {
    return res.status(400).json({ error: "Payment verification failed." });
  }

  const confirmationToken = createConfirmationToken(orderId, paymentId, keySecret);

  return res.status(200).json({
    success: true,
    confirmationToken,
    message: "Payment verified. AI Governance Starter Report request received.",
  });
}
