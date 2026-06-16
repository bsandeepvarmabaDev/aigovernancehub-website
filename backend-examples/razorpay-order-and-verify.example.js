// AI Governance Hub v11 Revenue Engine example only.
// Deploy this on a backend/serverless platform. Do not place your Razorpay secret in GitHub Pages.
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export async function createOrder(req, res) {
  const { amount = 9900, currency = 'INR', receipt = `agh_${Date.now()}` } = req.body || {};
  const order = await razorpay.orders.create({ amount, currency, receipt, notes: { product: 'AI Governance Assessment Report' } });
  res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
}

export async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
  if (expected !== razorpay_signature) return res.status(400).json({ verified: false, message: 'Invalid Razorpay signature' });
  res.json({ verified: true, message: 'Payment verified. Generate and email report.' });
}
