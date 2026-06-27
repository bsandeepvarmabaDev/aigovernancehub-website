/**
 * AI Governance Hub — Enterprise gate + sales workflow (P0 Razorpay launch).
 */
import crypto from "crypto";
import { getJson, putJson } from "./storage.js";
import { sendEnterpriseSalesNotification, sendEnterprisePaymentLinkEmail } from "./email.js";
import { createEnterprisePayToken } from "./tokens.js";
import {
  generateSecureReference,
  isEnterpriseGated,
  assertSelfServeAllowed,
  ENTERPRISE_STATUS,
  enterpriseStatusLabel,
} from "./enterprise-gate-rules.js";

export {
  generateSecureReference,
  isEnterpriseGated,
  assertSelfServeAllowed,
  ENTERPRISE_STATUS,
  enterpriseStatusLabel,
};

function salesRequestKey(requestId) {
  return `enterprise/sales-requests/${requestId}.json`;
}

function sessionIndexKey(sessionId) {
  return `enterprise/session-index/${sessionId}.json`;
}

function requestsIndexKey() {
  return "enterprise/requests-index.json";
}

async function appendRequestsIndex(entry) {
  const index = (await getJson(requestsIndexKey())) || { requests: [] };
  index.requests = index.requests.filter((r) => r.requestId !== entry.requestId);
  index.requests.unshift(entry);
  index.requests = index.requests.slice(0, 500);
  await putJson(requestsIndexKey(), index);
}

export async function appendEnterpriseAudit(record, action, details = {}, actor = "system") {
  if (!record.auditTrail) record.auditTrail = [];
  record.auditTrail.push({
    auditId: crypto.randomUUID(),
    action,
    actor,
    at: new Date().toISOString(),
    details,
  });
  return record;
}

export async function createEnterpriseSalesRequest(session, metrics, context = {}) {
  const requestId = crypto.randomUUID();
  const secureReference = generateSecureReference(requestId);
  const auditId = context.auditId || context.fileHash || crypto.randomUUID();

  const record = {
    requestId,
    secureReference,
    auditId,
    sessionId: session.sessionId,
    uploadStorageKey: session.uploadStorageKey,
    filename: session.filename,
    source: session.source,
    detectedPlatform: context.detectedPlatform || session.source,
    industry: session.industry || "general",
    country: context.country || null,
    workItemMetrics: metrics,
    rawTaskCount: metrics.totalWorkItems,
    uniqueTaskCount: metrics.uniqueWorkItems,
    duplicateTaskCount: metrics.duplicateRecords,
    projectCount: metrics.projectCount,
    suggestedPlan: context.suggestedPlan || "enterprise",
    fileHash: context.fileHash || null,
    planTier: "enterprise",
    status: ENTERPRISE_STATUS.SALES_REVIEW_PENDING,
    statusLabel: enterpriseStatusLabel(ENTERPRISE_STATUS.SALES_REVIEW_PENDING),
    buyerName: context.buyerName || null,
    buyerEmail: context.buyerEmail || null,
    company: context.company || null,
    quoteAmountMinor: null,
    quoteCurrency: null,
    discountMinor: 0,
    salesNotes: [],
    customOrderId: null,
    payToken: null,
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await appendEnterpriseAudit(record, "enterprise_request_created", {
    metrics,
    country: record.country,
    detectedPlatform: record.detectedPlatform,
  });

  await putJson(salesRequestKey(requestId), record);
  await putJson(sessionIndexKey(session.sessionId), { requestId, secureReference });

  await appendRequestsIndex({
    requestId,
    secureReference,
    status: record.status,
    createdAt: record.createdAt,
    buyerEmail: record.buyerEmail,
    company: record.company,
    country: record.country,
    totalWorkItems: metrics.totalWorkItems,
    projectCount: metrics.projectCount,
    detectedPlatform: record.detectedPlatform,
  });

  return record;
}

export async function listEnterpriseRequests(statusFilter = null) {
  const index = (await getJson(requestsIndexKey())) || { requests: [] };
  let items = index.requests || [];
  if (statusFilter) {
    items = items.filter((r) => r.status === statusFilter);
  }
  const detailed = [];
  for (const entry of items.slice(0, 100)) {
    const full = await getJson(salesRequestKey(entry.requestId));
    if (full) detailed.push(full);
  }
  return detailed;
}

export async function loadSalesRequestBySession(sessionId) {
  const index = await getJson(sessionIndexKey(sessionId));
  if (!index?.requestId) return null;
  return getJson(salesRequestKey(index.requestId));
}

export async function loadSalesRequest(requestId) {
  return getJson(salesRequestKey(requestId));
}

export async function saveSalesRequest(record) {
  record.updatedAt = new Date().toISOString();
  record.statusLabel = enterpriseStatusLabel(record.status);
  await putJson(salesRequestKey(record.requestId), record);
  await appendRequestsIndex({
    requestId: record.requestId,
    secureReference: record.secureReference,
    status: record.status,
    createdAt: record.createdAt,
    buyerEmail: record.buyerEmail,
    company: record.company,
    country: record.country,
    totalWorkItems: record.rawTaskCount ?? record.workItemMetrics?.totalWorkItems,
    projectCount: record.projectCount ?? record.workItemMetrics?.projectCount,
    detectedPlatform: record.detectedPlatform,
  });
  return record;
}

export async function updateSalesRequestContact(sessionId, contact) {
  const record = await loadSalesRequestBySession(sessionId);
  if (!record) return null;

  record.buyerName = contact.name;
  record.buyerEmail = contact.email;
  record.company = contact.company || null;
  record.status = ENTERPRISE_STATUS.CONTACT_RECEIVED;
  await appendEnterpriseAudit(record, "contact_received", {
    email: contact.email,
    company: contact.company,
  });
  await saveSalesRequest(record);
  return record;
}

export async function setEnterpriseQuote(record, quote, actor = "admin") {
  record.quoteAmountMinor = Math.round(Number(quote.amountMinor));
  record.quoteCurrency = quote.currency || "INR";
  record.discountMinor = Math.round(Number(quote.discountMinor || 0));
  record.status = ENTERPRISE_STATUS.QUOTE_SET;
  await appendEnterpriseAudit(record, "quote_set", quote, actor);
  await saveSalesRequest(record);
  return record;
}

export async function addEnterpriseNote(record, note, actor = "admin") {
  record.salesNotes = record.salesNotes || [];
  record.salesNotes.push({
    id: crypto.randomUUID(),
    text: note,
    actor,
    at: new Date().toISOString(),
  });
  await appendEnterpriseAudit(record, "note_added", { notePreview: note.slice(0, 120) }, actor);
  await saveSalesRequest(record);
  return record;
}

export async function notifySalesTeam(record, siteUrl) {
  return sendEnterpriseSalesNotification({
    secureReference: record.secureReference,
    requestId: record.requestId,
    auditId: record.auditId,
    sessionId: record.sessionId,
    filename: record.filename,
    source: record.source,
    detectedPlatform: record.detectedPlatform,
    country: record.country,
    metrics: record.workItemMetrics,
    buyerName: record.buyerName,
    buyerEmail: record.buyerEmail,
    company: record.company,
    adminSessionRef: record.sessionId,
    uploadStorageKey: record.uploadStorageKey,
    status: record.status,
    siteUrl,
  });
}

export async function attachEnterprisePaymentLink(record, session, order, keySecret, siteUrl) {
  const payToken = createEnterprisePayToken(session.sessionId, order.id, keySecret);
  record.customOrderId = order.id;
  record.payToken = payToken;
  record.status = ENTERPRISE_STATUS.PAYMENT_LINK_READY;
  await appendEnterpriseAudit(record, "payment_link_created", {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  });
  await saveSalesRequest(record);

  if (record.buyerEmail) {
    const checkoutUrl = `${siteUrl}/enterprise-checkout.html?token=${encodeURIComponent(payToken)}`;
    await sendEnterprisePaymentLinkEmail({
      buyerName: record.buyerName,
      buyerEmail: record.buyerEmail,
      secureReference: record.secureReference,
      checkoutUrl,
    });
  }

  return { payToken, checkoutUrl: `${siteUrl}/enterprise-checkout.html?token=${encodeURIComponent(payToken)}` };
}

export async function markEnterpriseReportDelivered(record, orderId, actor = "admin") {
  record.status = ENTERPRISE_STATUS.REPORT_DELIVERED;
  record.deliveredOrderId = orderId || record.customOrderId;
  await appendEnterpriseAudit(record, "report_delivered", { orderId: record.deliveredOrderId }, actor);
  await saveSalesRequest(record);
  return record;
}

export async function closeEnterpriseRequest(record, actor = "admin") {
  record.status = ENTERPRISE_STATUS.CLOSED;
  await appendEnterpriseAudit(record, "request_closed", {}, actor);
  await saveSalesRequest(record);
  return record;
}

export function publicEnterpriseStatus(record) {
  if (!record) return null;
  return {
    secureReference: record.secureReference,
    status: record.status,
    statusLabel: record.statusLabel || enterpriseStatusLabel(record.status),
    detectedPlatform: record.detectedPlatform,
    workItemMetrics: record.workItemMetrics,
    rawTaskCount: record.rawTaskCount,
    uniqueTaskCount: record.uniqueTaskCount,
    duplicateTaskCount: record.duplicateTaskCount,
    projectCount: record.projectCount,
    createdAt: record.createdAt,
  };
}
