/**
 * Allowlist utilities for SecureInspect.
 * Centralises host-matching logic so Background and Popup share one source of truth.
 */

/**
 * Normalise a raw hostname string:
 *  - lowercases
 *  - strips trailing port (e.g. "localhost:3000" → "localhost")
 */
export function normalizeHost(raw) {
  if (!raw) return '';
  return String(raw).toLowerCase().replace(/:\d+$/, '').trim();
}

/**
 * Returns true if `url` is covered by at least one entry in `allowlist`.
 * Supports exact matches and the wildcard "*".
 *
 * @param {string}   url       - Full page URL
 * @param {string[]} allowlist - Array of allowed host strings
 */
export function isHostAllowed(url, allowlist = []) {
  try {
    const hostname = normalizeHost(new URL(url).hostname);
    if (allowlist.includes('*')) return true;
    return allowlist.some((entry) => hostname.includes(normalizeHost(entry)));
  } catch {
    return false;
  }
}
