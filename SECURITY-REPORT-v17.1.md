# Security Report — v17.1 Production Hardening

## Threat model

Public SaaS checkout with file upload, payment, persistent report storage, email delivery, and recovery by email. Attackers may attempt payment bypass, report theft, upload abuse, email enumeration, and token replay.

## Controls implemented

| Control | Status | Implementation |
|---------|--------|----------------|
| Razorpay Key Secret server-only | ✅ | `process.env.RAZORPAY_KEY_SECRET` in API routes only |
| HMAC payment verification | ✅ | `crypto.timingSafeEqual` — unchanged |
| Amount fixed 19900 paise | ✅ | `create-order.js` |
| No client-side unlock | ✅ | All downloads require server-validated token |
| No localStorage payment proof | ✅ | Tokens server-issued; session in page memory only |
| Persistent storage only | ✅ | Blob/S3 via official SDKs; **no /tmp fallback** |
| Fail closed without storage | ✅ | `assertStorageConfigured()` → 503 |
| Rate limiting | ✅ | Per-IP + per-email on upload, order, verify, download, recover |
| Short success token (15 min) | ✅ | `createSuccessToken` |
| Long recovery token (90 days) | ✅ | `createRecoveryToken` — only after verified payment |
| Download audit trail | ✅ | `downloadCount`, `lastDownloadAt`, IP hash |
| Payment audit trail | ✅ | `audit/{orderId}.json` events |
| File validation | ✅ | Type, size, sanitize filename |
| XSS prevention in reports | ✅ | `escapeHtml` |
| Generic error messages | ✅ | No internal paths/secrets in client errors |
| Security headers on APIs | ✅ | `X-Content-Type-Options`, `X-Frame-Options`, etc. |
| Email graceful degradation | ✅ | Payment succeeds if email fails |
| Masked identifiers in UI | ✅ | `maskOrderId`, `maskPaymentId` |

## Residual risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Success token in URL query string | Medium | Short TTL; recovery path via email; consider POST exchange in v17.2 |
| Email recovery without OTP | Medium | Rate limiting + generic responses; consider magic-link OTP later |
| Rate limits stored in Blob | Low | Acceptable for MVP; migrate to Upstash Redis at scale |
| Excel binary parsing | Low | CSV recommended; document in deployment notes |

## Verdict

**Ready for production deploy** when `BLOB_READ_WRITE_TOKEN` (or S3) and Razorpay env vars are configured. Deploy all v17.1 files atomically including `package.json` dependencies.
