// AI Governance Hub API — magic link + report recovery (v25.23 Hobby bundle)
import { getEmailIndexSecret, isNonEmptyString, createRecoveryToken, getDownloadSigningSecret } from "./_lib/tokens.js";
import {
  assertStorageConfigured,
  listReportIdsForEmail,
  loadReportRecord,
  normalizeEmail,
} from "./_lib/storage.js";
import {
  createMagicLinkRecord,
  isValidEmail,
  normalizeAuthEmail,
} from "./_lib/auth.js";
import { sendMagicLinkEmail, isEmailConfigured } from "./_lib/email.js";
import { enforceRateLimit } from "./_lib/rate-limit.js";
import { AUDIT_EVENTS, logAudit } from "./_lib/audit.js";
import { applySecurityHeaders, sendError, sendJson } from "./_lib/security.js";
import { trackEvent } from "./_lib/analytics.js";
import { getCorrelationId, attachCorrelation, logEvent } from "./_lib/correlation.js";
import { REPORT_STATE } from "./_lib/payment-state.js";

function buildRecoveryMessage({ generationFailed, assessmentProcessing, reportsReady, emailSent }) {
  if (generationFailed && !reportsReady) {
    return "Payment verified. Report generation failed — sign in via the email link and retry from My Reports, or contact support@aigovernancehub.ai.";
  }
  if (assessmentProcessing && !reportsReady) {
    return emailSent
      ? "Payment received. Your executive assessment is processing — a secure sign-in link has been sent. Downloads appear when generation completes."
      : "Payment received. Your assessment is processing — downloads will appear in My Reports when ready.";
  }
  if (reportsReady) {
    return "Payment verified. A secure sign-in link has been sent. Check your inbox and spam folder.";
  }
  return "If purchased reports exist for this email, a secure sign-in link has been sent. Check your inbox and spam folder.";
}

function getSiteUrl() {
  return (
    (typeof process.env.SITE_URL === "string" && process.env.SITE_URL.trim()) ||
    "https://aigovernancehub.ai"
  ).replace(/\/$/, "");
}

function getKind(req) {
  const queryKind =
    typeof req.query?.kind === "string" ? req.query.kind.trim().toLowerCase() : "";
  if (queryKind === "recover" || queryKind === "magic") {
    return queryKind;
  }
  return "magic";
}

async function handleMagicLink(req, res, correlationId) {
  try {
    assertStorageConfigured();
  } catch {
    return sendError(res, 503, "Authentication is temporarily unavailable.");
  }

  const body = req.body || {};
  const email = normalizeAuthEmail(body.email);
  const redirect = typeof body.redirect === "string" ? body.redirect : "/dashboard.html";

  if (!isValidEmail(email)) {
    return sendError(res, 400, "A valid email address is required.");
  }

  const rateLimited = await enforceRateLimit(req, "auth-magic-link", email);
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  try {
    const { token } = await createMagicLinkRecord(email);
    const magicUrl = `${getSiteUrl()}/login.html?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`;
    const emailResult = await sendMagicLinkEmail(email, magicUrl);
    await trackEvent("magic_link_requested", req, { correlationId });
    logEvent("info", "magic_link_requested", { correlationId, emailHash: email.slice(0, 3) + "***" });

    const emailConfigured = isEmailConfigured();
    return sendJson(res, 200, {
      message: emailResult.sent
        ? "If an account exists for this email, a sign-in link has been sent."
        : "Sign-in by email is temporarily unavailable. Use Recover My Report on this device or contact support@aigovernancehub.ai.",
      emailConfigured: emailResult.sent,
      emailDeliveryAvailable: emailConfigured,
    });
  } catch {
    return sendError(res, 500, "Unable to process sign-in request.");
  }
}

async function handleRecoverReports(req, res, correlationId) {
  try {
    assertStorageConfigured();
  } catch {
    return sendError(res, 503, "Recovery service is temporarily unavailable.");
  }

  const indexSecret = getEmailIndexSecret();
  if (!indexSecret) {
    return sendError(res, 503, "Recovery service is not configured.");
  }

  const body = req.body || {};
  const email = normalizeEmail(body.email);

  if (!isNonEmptyString(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, 400, "A valid email address is required.");
  }

  const rateLimited = await enforceRateLimit(req, "recover-reports", email);
  if (rateLimited) {
    return sendError(res, rateLimited.status, rateLimited.error);
  }

  const orderIds = await listReportIdsForEmail(email, indexSecret);
  let activeReportCount = 0;
  let readyReportCount = 0;
  let processingReportCount = 0;
  let failedReportCount = 0;
  let latestReadyReport = null;

  for (const orderId of orderIds) {
    const report = await loadReportRecord(orderId);
    if (!report || report.paymentStatus !== "verified" || normalizeEmail(report.buyerEmail) !== email) {
      continue;
    }

    const expiresAt = report.expiresAt ? Date.parse(report.expiresAt) : null;
    if (expiresAt && Date.now() > expiresAt) {
      continue;
    }

    activeReportCount += 1;
    if (report.reportStatus === REPORT_STATE.READY) {
      readyReportCount += 1;
      if (!latestReadyReport || new Date(report.createdAt) > new Date(latestReadyReport.createdAt)) {
        latestReadyReport = { orderId, ...report };
      }
    } else if (report.reportStatus === REPORT_STATE.FAILED) {
      failedReportCount += 1;
    } else {
      processingReportCount += 1;
    }
    await logAudit(orderId, AUDIT_EVENTS.REPORT_RECOVERED, {
      email,
      channel: "email_verification",
      correlationId,
      reportStatus: report.reportStatus,
    });
  }

  const paymentReceived = activeReportCount > 0;
  const assessmentProcessing = processingReportCount > 0;
  const reportsReady = readyReportCount > 0;
  const generationFailed = failedReportCount > 0;

  const emailConfigured = isEmailConfigured();
  // Route straight to the actual download page (with a 90-day recovery token
  // baked into the URL) when a ready report exists, instead of always sending
  // people to bare dashboard.html. Dashboard.html only works if its own
  // separate cookie-based auth session is valid AND its client JS tab
  // navigation works — an extra fragile hop when the customer just wants
  // their files. The magic-link click itself still only has a 15-minute
  // window, but the destination URL it lands on is then good for 90 days.
  const redirectPath = latestReadyReport
    ? `/starter-success.html?confirmation=${encodeURIComponent(
        createRecoveryToken(
          latestReadyReport.orderId,
          latestReadyReport.paymentId,
          email,
          getDownloadSigningSecret()
        )
      )}`
    : "/dashboard.html";
  if (paymentReceived && emailConfigured) {
    try {
      const { token } = await createMagicLinkRecord(email);
      const magicUrl = `${getSiteUrl()}/login.html?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirectPath)}`;
      const emailResult = await sendMagicLinkEmail(email, magicUrl);
      if (!emailResult.sent) {
        return sendJson(res, 200, {
          message:
            generationFailed && !reportsReady
              ? "Payment verified. Report generation failed — use Recover My Report to retry or contact support@aigovernancehub.ai. Email delivery is temporarily unavailable."
              : buildRecoveryMessage({
                  generationFailed,
                  assessmentProcessing,
                  reportsReady,
                  emailSent: false,
                }) + (assessmentProcessing && !reportsReady ? " Email delivery is temporarily unavailable; contact support@aigovernancehub.ai if needed." : " Email delivery is temporarily unavailable."),
          emailConfigured: false,
          emailDeliveryAvailable: false,
          requiresEmailVerification: true,
          reportsFound: true,
          paymentReceived: true,
          assessmentProcessing,
          generationFailed,
          readyReportCount,
          processingReportCount,
          failedReportCount,
        });
      }
      return sendJson(res, 200, {
        message: buildRecoveryMessage({
          generationFailed,
          assessmentProcessing,
          reportsReady,
          emailSent: true,
        }),
        emailConfigured: true,
        emailDeliveryAvailable: true,
        requiresEmailVerification: true,
        reportsFound: true,
        paymentReceived: true,
        assessmentProcessing,
        generationFailed,
        readyReportCount,
        processingReportCount,
        failedReportCount,
      });
    } catch {
      return sendJson(res, 200, {
        message:
          generationFailed && !reportsReady
            ? "Payment verified. Report generation failed — use My Reports to retry or contact support@aigovernancehub.ai."
            : assessmentProcessing && !reportsReady
              ? "Payment received. Your assessment is processing — use My Reports shortly or contact support@aigovernancehub.ai."
              : "We found reports for this email, but the recovery email could not be sent. Use the download buttons on your payment success page, or contact support@aigovernancehub.ai with your checkout email.",
        emailConfigured: false,
        emailDeliveryAvailable: false,
        requiresEmailVerification: true,
        reportsFound: true,
        paymentReceived,
        assessmentProcessing,
        generationFailed,
        readyReportCount,
        processingReportCount,
        failedReportCount,
      });
    }
  }

  await trackEvent("recovery_used", req, {
    correlationId,
    reportCount: activeReportCount,
    processingReportCount,
  });

  let message = buildRecoveryMessage({
    generationFailed,
    assessmentProcessing,
    reportsReady,
    emailSent: emailConfigured,
  });
  if (paymentReceived && generationFailed && !reportsReady) {
    message =
      "Payment verified. Report generation failed — sign in via the email link to retry from My Reports, or contact support@aigovernancehub.ai.";
  } else if (paymentReceived && assessmentProcessing && !reportsReady && !generationFailed) {
    message =
      "Payment received. Your executive assessment is processing — sign in via the email link when generation completes, or return to your payment success page.";
  } else if (paymentReceived && reportsReady) {
    message =
      "Payment verified. If purchased reports exist for this email, a secure sign-in link has been sent. Check your inbox and spam folder.";
  } else if (!emailConfigured) {
    message =
      activeReportCount > 0
        ? generationFailed
          ? "Payment verified. Report generation failed. Email delivery is not configured — use Recover My Report or contact support@aigovernancehub.ai."
          : paymentReceived && assessmentProcessing
            ? "Payment received. Your assessment is processing. Email delivery is not configured — use your payment success page or contact support@aigovernancehub.ai."
            : "We found reports for this email, but email delivery is not configured. Use the download buttons on your payment success page, or contact support@aigovernancehub.ai with your checkout email."
        : "If purchased reports exist for this email, recovery email is temporarily unavailable. Contact support@aigovernancehub.ai with your checkout email.";
  }

  return sendJson(res, 200, {
    message,
    emailConfigured,
    emailDeliveryAvailable: emailConfigured,
    requiresEmailVerification: true,
    reportsFound: activeReportCount > 0,
    paymentReceived,
    assessmentProcessing,
    generationFailed,
    readyReportCount,
    processingReportCount,
    failedReportCount,
  });
}

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  attachCorrelation(res, correlationId);
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  const kind = getKind(req);
  if (kind === "recover") {
    return handleRecoverReports(req, res, correlationId);
  }
  return handleMagicLink(req, res, correlationId);
}
