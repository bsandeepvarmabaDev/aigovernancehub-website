// AI Governance Hub API — invoice download v18.0
import { getKeySecret, validateRecoveryToken } from "./lib/tokens.js";
import { loadReportRecord, maskOrderId, maskPaymentId } from "./lib/storage.js";
import { requireAuth } from "./lib/auth.js";
import { applySecurityHeaders, sendError } from "./lib/security.js";
import { getCorrelationId, attachCorrelation } from "./lib/correlation.js";

function buildInvoiceHtml(report) {
  const orderRef = maskOrderId(report.orderId);
  const paymentRef = maskPaymentId(report.paymentId);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Invoice ${orderRef}</title>
<style>body{font-family:Inter,sans-serif;max-width:640px;margin:40px auto;color:#0f172a}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #dbe5f0;text-align:left}</style>
</head><body>
<h1>AI Governance Hub — Invoice</h1>
<p><strong>Order reference:</strong> ${orderRef}</p>
<p><strong>Payment reference:</strong> ${paymentRef}</p>
<p><strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
<p><strong>Customer:</strong> ${report.buyerName || ""} (${report.buyerEmail || ""})</p>
<table><tr><th>Description</th><th>Amount</th></tr>
<tr><td>Executive AI Governance Assessment</td><td>₹199.00 INR</td></tr></table>
<p>Processed by Razorpay. AI Governance Hub does not store card or UPI details.</p>
<p>This is a digital goods receipt, not tax advice.</p>
</body></html>`;
}

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  const session = await requireAuth(req);
  if (!session) {
    return sendError(res, 401, "Sign in required.");
  }

  const keySecret = getKeySecret();
  if (!keySecret) {
    return sendError(res, 503, "Invoice service is not configured.");
  }

  const body = req.body || {};
  const recoveryToken = typeof body.recoveryToken === "string" ? body.recoveryToken : "";
  const tokenData = validateRecoveryToken(recoveryToken, keySecret, session.email);
  if (!tokenData) {
    return sendError(res, 403, "Invalid invoice request.");
  }

  const report = await loadReportRecord(tokenData.orderId);
  if (!report || report.paymentStatus !== "verified" || report.buyerEmail !== session.email) {
    return sendError(res, 404, "Invoice not found.");
  }

  const html = buildInvoiceHtml({ ...report, orderId: tokenData.orderId });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${maskOrderId(tokenData.orderId)}.html"`);
  return res.status(200).send(html);
}
