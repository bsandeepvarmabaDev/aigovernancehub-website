# ADMIN SECURITY REPORT — v25.11

*(Consolidated into SECURITY-REPORT-v25.13.md — retained for v25.11 traceability)*

## Controls

| Control | Status |
|---------|--------|
| Admin API key (`isAdminAuthorized`) | PASS |
| Rate limits on admin-actions/search/enterprise | PASS |
| No unauthenticated diagnostics | PASS — admin-only |
| Audit all admin actions | PASS — `auditAdmin` v25.13 |
| No sensitive data in public health | PASS |
| Masked order/payment IDs in admin views | PASS |

## Audited Actions

- `operations_dashboard`, `diagnostics`
- `enterprise_set_quote`, `enterprise_add_note`, `enterprise_mark_delivered`, `enterprise_close`
- `create_enterprise_payment`
- `retry_generation`, `resend_email`
- `disable_download`, `enable_download`, `delete_expired`
- `mark_refunded` (existing audit)

## Recommendations

- IP allowlist for admin portal (v25.14+)
- Separate admin subdomain (v25.16+)
- MFA for admin key rotation events
