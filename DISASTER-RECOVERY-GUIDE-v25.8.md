# DISASTER RECOVERY GUIDE — v25.8

## Data stores

| Data | Location | Retention |
|------|----------|-----------|
| Upload sessions | Blob/S3 `sessions/` | `RETENTION_SESSION_DAYS` (default 1) |
| Reports | Blob/S3 `reports/` | `RETENTION_REPORT_DAYS` (default 90) |
| Audit logs | Blob/S3 `audit/` | `RETENTION_AUDIT_DAYS` (default 365) |
| Enterprise requests | Blob/S3 `enterprise/` | `RETENTION_ENTERPRISE_DAYS` (default 365) |

---

## Scenario: Storage unavailable

**Symptoms:** 503 on all APIs, health `degraded`

**Response:**
1. Check Vercel status + blob token validity
2. Do not deploy code changes during outage
3. Customers see "temporarily unavailable" — no partial writes

**Recovery:** Restore blob access; no manual data repair needed if outage was read/write block only.

---

## Scenario: SMTP unavailable

**Symptoms:** `emailSent: false`, `emailError` on report records

**Response:**
1. Admin portal → `resend_email` action per order
2. Customer can use recover-reports magic link (requires SMTP for new link)

**Recovery:** Fix SMTP credentials; batch resend via admin.

---

## Scenario: Razorpay unavailable

**Symptoms:** create-order/verify 502

**Response:**
1. Customer retains session + pendingCheckout
2. Retry after Razorpay recovery
3. Webhook catches delayed captures

---

## Scenario: Report generation interrupted

**Symptoms:** `reportStatus: failed`, payment confirmed

**Response:**
1. Admin → `retry_generation` with orderId
2. Audit log shows `report_regenerated`

**Customer message:** "Payment received. Report generation encountered an issue — contact support."

---

## Scenario: Paid customer data loss prevention

- Payment index: `indexes/payment/{paymentId}.json`
- Session-order index: `indexes/session-order/{sessionId}.json`
- Email index: `indexes/email/{hash}.json`
- Never delete report record without admin `delete_expired`

---

## Secret rotation (DR)

See `OPERATIONS-RUNBOOK-v25.8.md` § Secret Rotation.

---

## Backup

Blob/S3 is primary store. Enable provider versioning/replication for enterprise SLA.
