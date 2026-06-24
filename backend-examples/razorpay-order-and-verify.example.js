// AI Governance Hub v16.0.1 Razorpay backend example.
// Deploy this on a backend/serverless platform. Never expose RAZORPAY_KEY_SECRET in GitHub Pages.

import Razorpay from "razorpay";
import crypto from "crypto";

const PLANS = {
  assessment: { amount: 9900, name: "AI Governance Assessment Report" },
  professional: { amount: 29900, name: "Professional Governance Review" },
  enterprise: { amount: 99900, name: "Enterprise Governance Review" }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export async function createOrder(req, res) {
  try {
    const { planId = "assessment", customer = {} } = req.body || {};
    const plan = PLANS[planId] || PLANS.assessment;

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: "INR",
      receipt: `agh_${planId}_${Date.now()}`,
      notes: {
        product: plan.name,
        planId,
        customerEmail: customer.email || "",
        company: customer.company || ""
      }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to create Razorpay order." });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Invalid Razorpay signature." });
    }

    // TODO: Store payment, customer, plan and entitlement in your database.
    // TODO: Trigger report delivery, licence activation, or subscription provisioning.

    res.json({ verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
  } catch (error) {
    res.status(500).json({ verified: false, error: "Payment verification failed." });
  }
}
