# Security Report — v19.0 Enterprise Guided Assessment

**Date:** 2026-06-27  
**Verdict:** **PASS**

## Summary

v19.0 adds client-side wizard UX and server-side upload structure validation without weakening v18 security controls. Payment verification, signed downloads, rate limiting, and fail-closed storage remain intact.

## Controls verified

| Control | Status | v19.0 notes |
|---------|--------|-------------|
| No secrets in frontend | ✅ | Unchanged |
| Server-side payment verification | ✅ | Unchanged |
| Plan-tier checkout gate | ✅ NEW | `create-order.js` rejects non-Starter |
| Signed downloads | ✅ | Unchanged |
| Persistent storage only | ✅ | Unchanged |
| Rate limiting | ✅ | Unchanged |
| Security headers | ✅ | Unchanged |
| Fail closed | ✅ | Unchanged |
| No localStorage payment unlock | ✅ | Unchanged |
| Input validation | ✅ ENHANCED | Column, encoding, security scan |
| Safe error messages | ✅ NEW | Generic user-facing errors only |

## Upload security (new)

- **Security scan:** Rejects files containing `<script`, `javascript:`, event handlers, server-side template markers
- **Encoding validation:** Rejects invalid UTF-8 with replacement characters
- **Duplicate column detection:** Prevents ambiguous parsing
- **Required column enforcement:** Server-side only — cannot bypass via API
- **File size cap:** 5 MB (unchanged); enterprise CTA for oversized files

## Plan gate (new)

Enterprise/Professional/Business uploads cannot create Razorpay orders even if API is called directly — `selfServeAllowed` and `planTier` stored server-side in session record.

## No regressions

- Razorpay amount remains **19900 paise** server-side
- HMAC verification unchanged
- Auth cookies HttpOnly/Secure/SameSite unchanged

## P0 verdict

**PASS** — No blocking security issues identified in static review.
