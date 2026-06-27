/**
 * AI Governance Hub v24.0 — Short-lived in-memory cache (per serverless instance)
 */
const store = new Map();
const DEFAULT_TTL_MS = 60_000;

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function cacheKey(prefix, ...parts) {
  return `${prefix}:${parts.join(":")}`;
}
