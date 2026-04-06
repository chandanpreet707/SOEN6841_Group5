/**
 * Allowlist utilities for SecureInspect.
 * Centralises host-matching logic so Background and Popup share one source of truth.
 */

/**
 * Normalise a raw hostname string:
 *  - lowercases
 *  - strips trailing port  (e.g. "localhost:3000"  → "localhost")
 *  - strips trailing slash (e.g. "example.com/"    → "example.com")
 *  - strips http(s):// prefix if user accidentally pastes a full URL
 */
export function normalizeHost(raw) {
  if (!raw) return '';
  let s = String(raw).toLowerCase().trim();
  // Strip protocol prefix
  s = s.replace(/^https?:\/\//, '');
  // Strip port suffix
  s = s.replace(/:\d+$/, '');
  // Strip trailing slash
  s = s.replace(/\/$/, '');
  return s;
}

/**
 * Returns true if `url` is covered by at least one entry in `allowlist`.
 * Supports:
 *  - exact hostname match          ("dvwa")
 *  - global wildcard               ("*")
 *  - leading-wildcard subdomain    ("*.example.com")
 *
 * @param {string}   url
 * @param {string[]} allowlist
 */
export function isHostAllowed(url, allowlist = []) {
  try {
    const hostname = normalizeHost(new URL(url).hostname);
    if (allowlist.includes('*')) return true;

    return allowlist.some((entry) => {
      const norm = normalizeHost(entry);
      // Leading-wildcard: *.example.com matches sub.example.com
      if (norm.startsWith('*.')) {
        const suffix = norm.slice(2);
        return hostname === suffix || hostname.endsWith('.' + suffix);
      }
      return hostname.includes(norm);
    });
  } catch {
    return false;
  }
}
