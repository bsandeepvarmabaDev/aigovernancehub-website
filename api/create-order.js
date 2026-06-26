const STARTER_AMOUNT_PAISE = 49900;
const CURRENCY = "INR";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(503).json({ error: "Payment service is not configured." });
  }

  const receipt = `starter_${Date.now()}`;
  const orderPayload = {
    amount: STARTER_AMOUNT_PAISE,
    currency: CURRENCY,
    receipt,
    notes: {
      product: "Starter Launch Edition",
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

    if (!response.ok) {
      return res.status(502).json({ error: "Unable to create payment order." });
    }

    const order = await response.json();

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch {
    return res.status(500).json({ error: "Unable to create payment order." });
  }
}
