import crypto from "crypto";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    return res.status(503).json({ error: "Payment verification is not configured." });
  }

  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    name,
    email,
    jiraSite,
  } = req.body || {};

  if (!isNonEmptyString(orderId) || !isNonEmptyString(paymentId) || !isNonEmptyString(signature)) {
    return res.status(400).json({ error: "Invalid payment verification request." });
  }

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(jiraSite)) {
    return res.status(400).json({ error: "Missing required onboarding details." });
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (!safeCompare(expectedSignature, signature)) {
    return res.status(400).json({ error: "Payment verification failed." });
  }

  return res.status(200).json({
    success: true,
    message: "Payment verified. Starter onboarding request received.",
  });
}
