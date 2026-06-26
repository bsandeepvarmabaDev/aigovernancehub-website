// AI Governance Hub API — create-order v16.5.2
const STARTER_AMOUNT_PAISE = 19900;
const CURRENCY = "INR";

function trimEnv(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const keyId = trimEnv(process.env.RAZORPAY_KEY_ID);
  const keySecret = trimEnv(process.env.RAZORPAY_KEY_SECRET);

  if (!keyId || !keySecret) {
    return res.status(503).json({ error: "Payment service is not configured." });
  }

  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId)) {
    return res.status(503).json({ error: "Payment service is not configured." });
  }

  const receipt = `st_${Date.now()}`;
  const orderPayload = {
    amount: STARTER_AMOUNT_PAISE,
    currency: CURRENCY,
    receipt,
    notes: {
      product: "One AI Governance Starter Report",
    },
  };

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const rawBody = await response.text();
    let order = {};

    try {
      order = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      order = {};
    }

    if (!response.ok) {
      console.error("Razorpay create-order failed", {
        status: response.status,
        receipt,
      });
      return res.status(502).json({ error: "Unable to create payment order." });
    }

    if (!order.id || typeof order.amount !== "number" || !order.currency) {
      console.error("Razorpay create-order returned invalid payload", { receipt });
      return res.status(502).json({ error: "Unable to create payment order." });
    }

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error) {
    console.error("Razorpay create-order request error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return res.status(500).json({ error: "Unable to create payment order." });
  }
}
