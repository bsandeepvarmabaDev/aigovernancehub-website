// AI Governance Hub — persistent storage v17.1 (production hardening)
// Vercel Blob (preferred) or AWS S3 via official SDKs only. Fail closed — no /tmp fallback.
import { get, put } from "@vercel/blob";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import { trimEnv } from "./tokens.js";

import { getReportExpiresAt, getSessionExpiresAt } from "./retention.js";

function storageBackend() {
  if (trimEnv(process.env.BLOB_READ_WRITE_TOKEN) || trimEnv(process.env.BLOB_STORE_ID)) {
    return "blob";
  }
  if (
    trimEnv(process.env.AWS_S3_BUCKET) &&
    trimEnv(process.env.AWS_ACCESS_KEY_ID) &&
    trimEnv(process.env.AWS_SECRET_ACCESS_KEY)
  ) {
    return "s3";
  }
  return "none";
}

export function assertStorageConfigured() {
  if (storageBackend() === "none") {
    const error = new Error("Persistent storage is not configured.");
    error.statusCode = 503;
    throw error;
  }
}

export function isStorageConfigured() {
  return storageBackend() !== "none";
}

export function getStorageBackendName() {
  return storageBackend();
}

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: trimEnv(process.env.AWS_REGION) || "us-east-1",
      credentials: {
        accessKeyId: trimEnv(process.env.AWS_ACCESS_KEY_ID),
        secretAccessKey: trimEnv(process.env.AWS_SECRET_ACCESS_KEY),
      },
    });
  }
  return s3Client;
}

async function streamToBuffer(stream) {
  if (stream && typeof stream.getReader === "function") {
    return Buffer.from(await new Response(stream).arrayBuffer());
  }
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function blobCommandOptions() {
  const token = trimEnv(process.env.BLOB_READ_WRITE_TOKEN);
  return token ? { token } : {};
}

async function putBlobObject(key, body, contentType) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body), "utf8");
  const result = await put(key, payload, {
    access: "private",
    contentType: contentType || "application/octet-stream",
    addRandomSuffix: false,
    allowOverwrite: true,
    ...blobCommandOptions(),
  });
  return { pathname: result.pathname, url: result.url };
}

async function getBlobObject(keyOrPathname) {
  try {
    const result = await get(keyOrPathname, {
      access: "private",
      ...blobCommandOptions(),
    });
    if (!result?.stream) {
      return null;
    }
    return streamToBuffer(result.stream);
  } catch {
    return null;
  }
}

async function putS3Object(key, body, contentType) {
  const bucket = trimEnv(process.env.AWS_S3_BUCKET);
  const client = getS3Client();
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body), "utf8");
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: payload,
      ContentType: contentType || "application/octet-stream",
      ServerSideEncryption: "AES256",
    })
  );
  return { pathname: key, url: `s3://${bucket}/${key}` };
}

async function getS3Object(key) {
  const bucket = trimEnv(process.env.AWS_S3_BUCKET);
  const client = getS3Client();
  try {
    const result = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return streamToBuffer(result.Body);
  } catch {
    return null;
  }
}

export async function putObject(key, body, contentType) {
  assertStorageConfigured();
  const backend = storageBackend();
  if (backend === "blob") {
    return putBlobObject(key, body, contentType);
  }
  return putS3Object(key, body, contentType);
}

export async function getObject(keyOrPathname) {
  if (!isStorageConfigured()) {
    return null;
  }
  const backend = storageBackend();
  if (backend === "blob") {
    return getBlobObject(keyOrPathname);
  }
  return getS3Object(keyOrPathname);
}

export async function putJson(key, value) {
  await putObject(key, JSON.stringify(value), "application/json");
  return key;
}

export async function getJson(key) {
  const raw = await getObject(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    return null;
  }
}

export { getReportExpiresAt, getSessionExpiresAt } from "./retention.js";

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function emailIndexKey(email, keySecret) {
  const normalized = normalizeEmail(email);
  const hash = crypto.createHmac("sha256", keySecret).update(normalized).digest("hex");
  return `indexes/email/${hash}.json`;
}

export function sanitizeFilename(filename) {
  const base = String(filename || "upload.csv").split(/[/\\]/).pop() || "upload.csv";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function sessionKey(sessionId) {
  return `sessions/${sessionId}.json`;
}

export function reportKey(orderId) {
  return `reports/${orderId}.json`;
}

export function reportHtmlKey(orderId) {
  return `reports/${orderId}/report.html`;
}

export function reportTextKey(orderId) {
  return `reports/${orderId}/report.txt`;
}

export function reportPdfKey(orderId) {
  return `reports/${orderId}/report.pdf`;
}

export function reportDocxKey(orderId) {
  return `reports/${orderId}/report.docx`;
}

export function reportPptxKey(orderId) {
  return `reports/${orderId}/report.pptx`;
}

export function uploadKey(sessionId, filename) {
  return `uploads/${sessionId}/${sanitizeFilename(filename)}`;
}

export function auditKey(orderId) {
  return `audit/${orderId}.json`;
}

export function rateLimitKey(scope, identifierHash) {
  return `ratelimit/${scope}/${identifierHash}.json`;
}

export async function saveSessionRecord(session) {
  await putJson(sessionKey(session.sessionId), session);
  return session;
}

export async function loadSessionRecord(sessionId) {
  return getJson(sessionKey(sessionId));
}

export async function saveReportRecord(report) {
  await putJson(reportKey(report.orderId), report);
  return report;
}

export async function loadReportRecord(orderId) {
  return getJson(reportKey(orderId));
}

export async function saveReportContent(orderId, html, text, extras = {}) {
  await putObject(reportHtmlKey(orderId), html, "text/html; charset=utf-8");
  await putObject(reportTextKey(orderId), text, "text/plain; charset=utf-8");
  if (extras.pdf) {
    await putObject(reportPdfKey(orderId), extras.pdf, "application/pdf");
  }
  if (extras.docx) {
    await putObject(
      reportDocxKey(orderId),
      extras.docx,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  }
  if (extras.pptx) {
    await putObject(
      reportPptxKey(orderId),
      extras.pptx,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
  }
}

export async function loadReportPdf(orderId) {
  return getObject(reportPdfKey(orderId));
}

export async function loadReportDocx(orderId) {
  return getObject(reportDocxKey(orderId));
}

export async function loadReportPptx(orderId) {
  return getObject(reportPptxKey(orderId));
}

export async function loadReportHtml(orderId) {
  const raw = await getObject(reportHtmlKey(orderId));
  return raw ? raw.toString("utf8") : null;
}

export async function loadReportText(orderId) {
  const raw = await getObject(reportTextKey(orderId));
  return raw ? raw.toString("utf8") : null;
}

export async function saveUploadedFile(sessionId, filename, buffer) {
  const key = uploadKey(sessionId, filename);
  await putObject(key, buffer, "application/octet-stream");
  return key;
}

export async function indexReportForEmail(email, orderId, keySecret) {
  const key = emailIndexKey(email, keySecret);
  const existing = (await getJson(key)) || [];
  if (!existing.includes(orderId)) {
    existing.push(orderId);
    await putJson(key, existing);
  }
}

export async function listReportIdsForEmail(email, keySecret) {
  const key = emailIndexKey(email, keySecret);
  return (await getJson(key)) || [];
}

export async function incrementDownloadCount(orderId, ipHash) {
  const report = await loadReportRecord(orderId);
  if (!report) {
    return null;
  }
  report.downloadCount = Number(report.downloadCount || 0) + 1;
  report.lastDownloadAt = new Date().toISOString();
  if (ipHash) {
    report.lastDownloadIpHash = ipHash;
  }
  await saveReportRecord(report);
  return report;
}

export async function appendAuditEvent(orderId, event) {
  const key = auditKey(orderId);
  const existing = (await getJson(key)) || [];
  existing.push({
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  });
  await putJson(key, existing);
  return existing;
}

export async function loadAuditEvents(orderId) {
  return (await getJson(auditKey(orderId))) || [];
}

export function maskPaymentId(paymentId) {
  if (!paymentId || paymentId.length < 8) {
    return "****";
  }
  return `${paymentId.slice(0, 4)}…${paymentId.slice(-4)}`;
}

export function maskOrderId(orderId) {
  if (!orderId || orderId.length < 8) {
    return "****";
  }
  return `${orderId.slice(0, 6)}…${orderId.slice(-4)}`;
}

export function webhookEventKey(eventId) {
  return `webhooks/razorpay/${eventId}.json`;
}

export async function isWebhookEventProcessed(eventId) {
  if (!eventId) return false;
  const row = await getJson(webhookEventKey(eventId));
  return Boolean(row?.processed);
}

export async function markWebhookEventProcessed(eventId, meta = {}) {
  if (!eventId) return;
  await putJson(webhookEventKey(eventId), {
    eventId,
    processed: true,
    processedAt: new Date().toISOString(),
    ...meta,
  });
}

export function paymentIndexKey(paymentId) {
  return `indexes/payment/${paymentId}.json`;
}

export function sessionOrderIndexKey(sessionId) {
  return `indexes/session-order/${sessionId}.json`;
}

export async function indexPaymentOrder(paymentId, orderId) {
  await putJson(paymentIndexKey(paymentId), { paymentId, orderId });
}

export async function indexSessionOrder(sessionId, orderId) {
  await putJson(sessionOrderIndexKey(sessionId), { sessionId, orderId });
}

export async function findOrderIdByPaymentId(paymentId) {
  const row = await getJson(paymentIndexKey(paymentId));
  return row?.orderId || null;
}

export async function findOrderIdBySessionId(sessionId) {
  const row = await getJson(sessionOrderIndexKey(sessionId));
  return row?.orderId || null;
}

export function orderSessionIndexKey(orderId) {
  return `indexes/order-session/${orderId}.json`;
}

export async function indexOrderSession(orderId, sessionId) {
  if (!orderId || !sessionId) return;
  await putJson(orderSessionIndexKey(orderId), { orderId, sessionId });
}

export async function findSessionIdByOrderId(orderId) {
  const row = await getJson(orderSessionIndexKey(orderId));
  return row?.sessionId || null;
}

export async function adminSearch(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) {
    return [];
  }
  const results = [];

  const directReport = await loadReportRecord(trimmed);
  if (directReport) {
    results.push(directReport);
  }

  const paymentOrder = await findOrderIdByPaymentId(trimmed);
  if (paymentOrder && paymentOrder !== trimmed) {
    const report = await loadReportRecord(paymentOrder);
    if (report) results.push(report);
  }

  const sessionOrder = await findOrderIdBySessionId(trimmed);
  if (sessionOrder && sessionOrder !== trimmed) {
    const report = await loadReportRecord(sessionOrder);
    if (report) results.push(report);
  }

  const session = await loadSessionRecord(trimmed);
  if (session) {
    results.push({
      type: "session",
      sessionId: session.sessionId,
      filename: session.filename,
      createdAt: session.createdAt,
      preview: session.preview,
    });
  }

  const unique = new Map();
  results.forEach((item) => {
    const key = item.orderId || item.sessionId || JSON.stringify(item);
    if (!unique.has(key)) unique.set(key, item);
  });
  return Array.from(unique.values());
}
