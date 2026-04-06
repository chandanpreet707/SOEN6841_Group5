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
        const suffix = norm.slice(2); // "example.com"
        return hostname === suffix || hostname.endsWith('.' + suffix);
      }
      return hostname.includes(norm);
    });
  } catch {
    return false;
  }
}
