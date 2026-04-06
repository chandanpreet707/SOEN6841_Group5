/**
 * modeConstants.js
 *
 * Shared constants for Dry Run / Live mode across the extension.
 * Centralising these prevents magic strings from being scattered
 * across Background, Popup, and Content scripts.
 */

// ── Badge display ────────────────────────────────────────────────────────────

/** Badge text shown when the extension is in Dry Run mode */
export const BADGE_DRY_TEXT  = 'DRY';

/** Badge text shown when the extension is in Live mode */
export const BADGE_LIVE_TEXT = 'LIVE';

/** Badge background colour for Dry Run mode (amber) */
export const BADGE_DRY_COLOR  = '#FF9800';

/** Badge background colour for Live mode (green) */
export const BADGE_LIVE_COLOR = '#4CAF50';

// ── Storage keys ─────────────────────────────────────────────────────────────

/** chrome.storage.local key for the dry-run boolean flag */
export const STORAGE_KEY_DRY_RUN      = 'dryRunMode';

/** chrome.storage.local key for the host allowlist array */
export const STORAGE_KEY_ALLOWLIST    = 'allowlist';

/** chrome.storage.local key for the audit log array */
export const STORAGE_KEY_AUDIT_LOG    = 'auditLog';

/** chrome.storage.local key for the payload history array */
export const STORAGE_KEY_PAYLOAD_HIST = 'payloadHistory';

/** chrome.storage.local key for the last active popup tab */
export const STORAGE_KEY_LAST_TAB     = 'lastActiveTab';

// ── Audit log action types ───────────────────────────────────────────────────

export const ACTION_SCAN         = 'SCAN';
export const ACTION_VULN_TEST    = 'VULN_TEST';
export const ACTION_ATTACH_FILE  = 'ATTACH_FILE';
export const ACTION_DRY_RUN      = 'DRY_RUN';

// ── Rate limiting ────────────────────────────────────────────────────────────

/** Maximum number of live actions allowed per 60-second window */
export const RATE_LIMIT_MAX     = 20;

/** Duration of the rate-limit sliding window in milliseconds */
export const RATE_LIMIT_WINDOW  = 60_000;
