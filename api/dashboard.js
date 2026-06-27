// AI Governance Hub API — customer dashboard v24.0
import { createRecoveryToken, getEmailIndexSecret } from "./_lib/tokens.js";
import { listReportIdsForEmail, loadReportRecord, maskOrderId, maskPaymentId } from "./_lib/storage.js";
import { requireAuth } from "./_lib/auth.js";
import { trackEvent } from "./_lib/analytics.js";
import { applySecurityHeaders, sendError, sendJson } from "./_lib/security.js";
import { getCorrelationId, attachCorrelation } from "./_lib/correlation.js";
import { buildCustomerStatusView, isDownloadReady } from "./_lib/payment-state.js";

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendError(res, 405, "Method not allowed.");
  }

  const session = await requireAuth(req);
  if (!session) {
    return sendError(res, 401, "Sign in required.");
  }

  const indexSecret = getEmailIndexSecret();
  if (!indexSecret) {
    return sendError(res, 503, "Dashboard is not configured.");
  }
  const orderIds = await listReportIdsForEmail(session.email, indexSecret);
  const reports = [];

  for (const orderId of orderIds) {
    const report = await loadReportRecord(orderId);
    if (!report || report.buyerEmail !== session.email) continue;
    const recoveryToken = createRecoveryToken(orderId, report.paymentId, session.email, indexSecret);
    const statusView = buildCustomerStatusView(report);
    reports.push({
      orderRef: maskOrderId(orderId),
      assessmentId: maskOrderId(orderId),
      purchasedAt: report.createdAt,
      uploadDate: report.uploadDate || report.createdAt,
      paymentStatus: report.paymentStatus,
      reportStatus: statusView.reportStatus,
      customerPaymentState: statusView.customerPaymentState,
      statusLabel: statusView.statusLabel,
      downloadReady: isDownloadReady(report),
      planTier: report.planTier || "starter",
      planLabel: report.planLabel || "Starter",
      workItemCount: report.workItemCount ?? report.preview?.totalRecords ?? null,
      detectedPlatform: report.detectedPlatform || report.intelligenceSnapshot?.source || null,
      paymentRef: report.paymentId ? maskPaymentId(report.paymentId) : null,
      reportVersion: report.reportVersion || "24.0",
      industry: report.industry || report.intelligenceSnapshot?.industry || "general",
      projectLabel: report.intelligenceSnapshot?.projectLabel || report.company || maskOrderId(orderId),
      governanceScore: report.governanceScore ?? report.preview?.governanceScore ?? null,
      aiReadiness: report.aiReadiness ?? report.preview?.aiReadiness ?? null,
      availableFormats: report.availableFormats || ["html", "text"],
      downloadCount: Number(report.downloadCount || 0),
      lastDownloadAt: report.lastDownloadAt,
      emailSent: Boolean(report.emailSent),
      expiresAt: report.expiresAt,
      downloadDisabled: Boolean(report.downloadDisabled),
      recoveryToken,
      invoiceAvailable: report.paymentStatus === "verified",
    });
  }

  reports.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));

  await trackEvent("dashboard_viewed", req, { correlationId });

  res.setHeader("Cache-Control", "private, max-age=30");

  return sendJson(res, 200, {
    email: session.email,
    version: "25.23",
    reports,
    intelligenceUrl: "/api/portfolio",
    actionTrackerUrl: "/api/action-tracker",
  });
}
