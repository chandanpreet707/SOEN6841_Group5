/**
 * settingsValidator.js
 *
 * Validation helpers for the Settings panel in SecureInspect.
 * Keeps validation logic out of Popup.jsx and makes it
 * independently testable.
 */

// ── Host validation ───────────────────────────────────────────────────────────

/**
 * Validate a host string before adding it to the allowlist.
 *
 * Accepts:
 *  - plain hostnames       ("localhost", "dvwa")
 *  - IP addresses          ("127.0.0.1")
 *  - wildcard              ("*")
 *  - subdomain wildcards   ("*.example.com")
 *  - hostnames with ports  ("localhost:8080")
 *
 * Rejects:
 *  - empty strings
 *  - full URLs with path   ("http://localhost/dvwa") — strip to hostname first
 *  - strings with spaces
 *
 * @param {string}   host     - Raw host string entered by the user.
 * @param {string[]} existing - Current allowlist to check for duplicates.
 * @returns {{ valid: boolean, reason: string }}
 */
export function validateHost(host, existing = []) {
  if (!host || !host.trim()) {
    return { valid: false, reason: 'Host cannot be empty.' };
  }

  const trimmed = host.trim();

  if (/\s/.test(trimmed)) {
    return { valid: false, reason: 'Host must not contain spaces.' };
  }

  if (existing.includes(trimmed)) {
    return { valid: false, reason: `"${trimmed}" is already in the allowlist.` };
  }

  // Reject full URLs — user should enter hostname only
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      valid: false,
      reason: 'Enter a hostname only (e.g. "localhost"), not a full URL.',
    };
  }

  return { valid: true, reason: 'Host is valid.' };
}

// ── Audit log validation ──────────────────────────────────────────────────────

/**
 * Check whether there is anything to export from the audit log.
 *
 * @param {object[]} auditLog
 * @returns {{ exportable: boolean, reason: string }}
 */
export function canExportAuditLog(auditLog = []) {
  if (!Array.isArray(auditLog) || auditLog.length === 0) {
    return {
      exportable: false,
      reason: 'No entries to export yet. Start scanning to populate the log.',
    };
  }
  return {
    exportable: true,
    reason: `${auditLog.length} entr${auditLog.length === 1 ? 'y' : 'ies'} ready to export.`,
  };
}

// ── Dry run validation ────────────────────────────────────────────────────────

/**
 * Returns a human-readable description of what toggling dry-run mode will do.
 *
 * @param {boolean} currentlyDryRun - The CURRENT state (before toggle).
 * @returns {string}
 */
export function describeModeToggle(currentlyDryRun) {
  if (currentlyDryRun) {
    return (
      'You are about to switch to Live Mode. ' +
      'Payloads will be injected into real page inputs after confirmation. ' +
      'Only proceed on authorized test targets.'
    );
  }
  return (
    'You are about to switch to Dry Run Mode. ' +
    'Actions will be previewed safely without injecting any payload.'
  );
}
