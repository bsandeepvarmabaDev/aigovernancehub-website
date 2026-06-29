import nodemailer from "nodemailer";
import { trimEnv } from "./tokens.js";
import {
  premiumEmailLayout,
  insightCardHtml,
  paragraphHtml,
  escapeHtmlEmail,
} from "./email-templates.js";

function getSmtpConfig() {
  const host =
    trimEnv(process.env.ZOHO_SMTP_HOST) ||
    trimEnv(process.env.SMTP_HOST) ||
    "smtp.zoho.com";
  const port = Number(trimEnv(process.env.ZOHO_SMTP_PORT) || trimEnv(process.env.SMTP_PORT) || "465");
  const user = trimEnv(process.env.ZOHO_SMTP_USER) || trimEnv(process.env.SMTP_USER);
  const pass = trimEnv(process.env.ZOHO_SMTP_PASS) || trimEnv(process.env.SMTP_PASS);
  const from =
    trimEnv(process.env.ZOHO_SMTP_FROM) ||
    trimEnv(process.env.SMTP_FROM) ||
    user ||
    "support@aigovernancehub.ai";

  if (!user || !pass) {
    return null;
  }

  return { host, port, user, pass, from };
}

export function isEmailConfigured() {
  return getSmtpConfig() !== null;
}

function createTransport() {
  const config = getSmtpConfig();
  if (!config) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

function buildInvoiceText(meta) {
  const amount = meta.amountDisplay || meta.planLabel || "See order confirmation";
  return [
    "AI Governance Hub — Payment Invoice",
    "",
    `Buyer: ${meta.buyerName}`,
    `Email: ${meta.buyerEmail}`,
    meta.company ? `Company: ${meta.company}` : null,
    `Product: ${meta.planLabel || "AI Governance Executive Assessment"}`,
    `Amount: ${amount}`,
    `Order reference: ${meta.orderRef}`,
    `Payment reference: ${meta.paymentRef}`,
    `Date: ${meta.paidAt}`,
    "",
    "Support: support@aigovernancehub.ai",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendMagicLinkEmail(email, magicUrl) {
  const transport = createTransport();
  if (!transport) {
    return { sent: false, reason: "Email is not configured." };
  }
  const config = getSmtpConfig();
  const safeUrl = escapeHtmlEmail(magicUrl);
  const html = premiumEmailLayout({
    preheader: "Your secure sign-in link — expires in 15 minutes.",
    headline: "Sign in to My Reports",
    bodyHtml:
      paragraphHtml("Use the button below to access your executive assessments. This link is single-use and expires in <strong>15 minutes</strong> for your security.") +
      `<p style="margin:0;font-family:monospace;font-size:12px;word-break:break-all;color:#64748b">${safeUrl}</p>`,
    primaryCta: { label: "Sign in securely", href: magicUrl },
    secondaryCta: { label: "Recover without signing in", href: "https://aigovernancehub.ai/recover-report.html" },
    footerLines: [
      "Didn't request this? Ignore this email — no changes were made.",
      'Questions: <a href="mailto:support@aigovernancehub.ai" style="color:#2563eb">support@aigovernancehub.ai</a>',
    ],
  });
  try {
    await transport.sendMail({
      from: config.from,
      to: email,
      subject: "Sign in to AI Governance Hub — secure link inside",
      text: `Sign in to AI Governance Hub:\n\n${magicUrl}\n\nExpires in 15 minutes.\n\nRecover: https://aigovernancehub.ai/recover-report.html`,
      html,
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "Email failed." };
  }
}

export async function sendReportResendEmail(meta) {
  return sendPaymentEmails(meta);
}

export async function sendPaymentEmails(meta) {
  const transport = createTransport();
  if (!transport) {
    return { sent: false, reason: "Email is not configured." };
  }

  const config = getSmtpConfig();
  const planLabel = meta.planLabel || "AI Governance Executive Assessment";
  const score =
    meta.governanceScore != null ? `${meta.governanceScore}/100` : "See full report";
  const topRec = meta.topRecommendation || "Review your executive assessment for prioritized actions.";
  const formats = (meta.availableFormats || ["html", "text"]).join(", ").toUpperCase();
  const dashboardUrl = meta.dashboardUrl || meta.recoverUrl;

  const subject = `Your ${planLabel} is ready — Governance Score ${score}`;

  const text = [
    `Hi ${meta.buyerName},`,
    "",
    "Thank you for your purchase. Your executive assessment is ready to download.",
    "",
    "EXECUTIVE SUMMARY",
    `Governance Score: ${score}`,
    `Top Recommendation: ${topRec}`,
    "",
    "DOWNLOAD FORMATS",
    formats,
    "",
    `My Reports: ${dashboardUrl}`,
    `Recover: ${meta.recoverUrl}`,
    "",
    "Your reports remain available for 90 days. Re-run an assessment when your portfolio changes.",
    "",
    "Support: support@aigovernancehub.ai",
    "",
    buildInvoiceText(meta),
  ].join("\n");

  const html = premiumEmailLayout({
    preheader: `Governance Score ${score} — download PDF, Word, and PowerPoint now.`,
    headline: "Your executive assessment is ready",
    bodyHtml:
      paragraphHtml(`Hi ${escapeHtmlEmail(meta.buyerName)}, thank you for your purchase. Your <strong>${escapeHtmlEmail(planLabel)}</strong> has been generated from your portfolio export.`) +
      insightCardHtml("Executive snapshot", [
        { label: "Governance Score", value: score },
        { label: "Top recommendation", value: topRec },
        { label: "Formats", value: formats },
      ]) +
      paragraphHtml("Download board-ready PDF or PowerPoint for leadership. Share Word with compliance. Access everything again from My Reports for <strong>90 days</strong>."),
    primaryCta: { label: "Open My Reports", href: dashboardUrl },
    secondaryCta: { label: "Recover on another device", href: meta.recoverUrl },
    footerLines: [
      `Order: ${escapeHtmlEmail(meta.orderRef)} · Payment: ${escapeHtmlEmail(meta.paymentRef)}`,
      'Support: <a href="mailto:support@aigovernancehub.ai" style="color:#2563eb">support@aigovernancehub.ai</a>',
      "Re-assess when your AI portfolio changes — compare progress over time.",
    ],
  });

  const mailOptions = { from: config.from, to: meta.buyerEmail, subject, text, html };
  try {
    await transport.sendMail(mailOptions);
    return { sent: true };
  } catch (firstError) {
    // One immediate retry — covers transient SMTP connection resets
    try {
      const retryTransport = createTransport();
      if (retryTransport) await retryTransport.sendMail(mailOptions);
      return { sent: true };
    } catch (error) {
      console.error("Email delivery failed after retry", {
        message: error instanceof Error ? error.message : "unknown",
      });
      return {
        sent: false,
        reason: error instanceof Error ? error.message : "Email delivery failed.",
      };
    }
  }
}

export async function sendEnterpriseSalesNotification(meta) {
  const transport = createTransport();
  if (!transport) {
    return { sent: false, reason: "Email is not configured." };
  }

  const config = getSmtpConfig();
  const metrics = meta.metrics || {};
  const subject = `[Enterprise] Sales request ${meta.secureReference} — ${metrics.totalWorkItems?.toLocaleString() || "?"} work items`;

  const text = [
    "AI Governance Hub — Enterprise Sales Request",
    "",
    `Secure reference: ${meta.secureReference}`,
    `Request ID: ${meta.requestId}`,
    `Audit ID: ${meta.auditId || "—"}`,
    `Session ID: ${meta.sessionId}`,
    `Status: ${meta.status || "sales_review_pending"}`,
    `Country: ${meta.country || "—"}`,
    `Platform: ${meta.detectedPlatform || meta.source || "—"}`,
    `Filename: ${meta.filename || "—"}`,
    "",
    "WORK ITEM METRICS (server-authoritative)",
    `Total work items: ${metrics.totalWorkItems?.toLocaleString() ?? "—"}`,
    `Unique work items: ${metrics.uniqueWorkItems?.toLocaleString() ?? "—"}`,
    `Duplicate records: ${metrics.duplicateRecords?.toLocaleString() ?? "—"}`,
    `Projects: ${metrics.projectCount ?? "—"}`,
    "",
    meta.buyerName ? `Contact: ${meta.buyerName}` : "Contact: (pending — customer has not submitted details yet)",
    meta.buyerEmail ? `Email: ${meta.buyerEmail}` : "",
    meta.company ? `Company: ${meta.company}` : "",
    "",
    "Uploaded file is stored securely. Access via admin portal using session/upload reference — do NOT attach raw files to email.",
    `Secure file reference: ${meta.uploadStorageKey || meta.adminSessionRef}`,
    "",
    "Suggested next step: Review request in Admin Portal → set quote → generate Razorpay payment link.",
    "",
    `Site: ${meta.siteUrl || "https://aigovernancehub.ai"}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await transport.sendMail({
      from: config.from,
      to: "sales@aigovernancehub.ai",
      subject,
      text,
    });
    return { sent: true };
  } catch (error) {
    console.error("Enterprise sales notification failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { sent: false, reason: error instanceof Error ? error.message : "Email failed." };
  }
}

export async function sendEnterprisePaymentLinkEmail(meta) {
  const transport = createTransport();
  if (!transport) {
    return { sent: false, reason: "Email is not configured." };
  }

  const config = getSmtpConfig();
  const subject = `Your Enterprise Assessment payment link — ${meta.secureReference}`;

  const text = [
    `Hi ${meta.buyerName || "there"},`,
    "",
    "Your custom Enterprise Assessment payment link is ready.",
    "",
    `Reference: ${meta.secureReference}`,
    `Secure checkout: ${meta.checkoutUrl}`,
    "",
    "This link expires in 7 days. After payment is verified, your full executive report will be generated and delivered.",
    "",
    "Questions? Contact sales@aigovernancehub.ai",
  ].join("\n");

  const html = premiumEmailLayout({
    preheader: `Enterprise payment link for ${meta.secureReference}`,
    headline: "Your Enterprise Assessment payment link",
    bodyHtml:
      paragraphHtml(`Hi ${escapeHtmlEmail(meta.buyerName || "there")}, your custom Enterprise Assessment quote is ready for secure payment.`) +
      insightCardHtml("Order details", [
        { label: "Reference", value: meta.secureReference },
        { label: "Valid for", value: "7 days" },
      ]) +
      paragraphHtml("After payment is verified, your full executive report will be generated in HTML, PDF, Word, and PowerPoint."),
    primaryCta: { label: "Complete secure payment", href: meta.checkoutUrl },
    secondaryCta: { label: "Contact sales", href: "mailto:sales@aigovernancehub.ai" },
    footerLines: ['Questions: <a href="mailto:sales@aigovernancehub.ai" style="color:#2563eb">sales@aigovernancehub.ai</a>'],
  });

  try {
    await transport.sendMail({
      from: config.from,
      to: meta.buyerEmail,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "Email failed." };
  }
}
