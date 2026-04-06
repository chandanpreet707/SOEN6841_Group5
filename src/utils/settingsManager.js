/**
 * settingsManager.js
 *
 * Provides helper functions for reading and writing extension settings
 * to chrome.storage.local. Keeps Popup.jsx clean by abstracting
 * all storage calls into one place.
 */

import {
  STORAGE_KEY_DRY_RUN,
  STORAGE_KEY_ALLOWLIST,
  STORAGE_KEY_AUDIT_LOG,
  STORAGE_KEY_PAYLOAD_HIST,
  STORAGE_KEY_LAST_TAB,
} from './modeConstants';

/**
 * Load all persisted settings in one storage read.
 * Returns a promise that resolves with the settings object.
 *
 * @returns {Promise<{
 *   allowlist:      string[],
 *   dryRunMode:     boolean,
 *   auditLog:       object[],
 *   payloadHistory: object[],
 *   lastActiveTab:  string,
 * }>}
 */
export function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [
        STORAGE_KEY_ALLOWLIST,
        STORAGE_KEY_DRY_RUN,
        STORAGE_KEY_AUDIT_LOG,
        STORAGE_KEY_PAYLOAD_HIST,
        STORAGE_KEY_LAST_TAB,
      ],
      (result) => {
        resolve({
          allowlist:      result[STORAGE_KEY_ALLOWLIST]    || ['*'],
          dryRunMode:     result[STORAGE_KEY_DRY_RUN]      !== false,
          auditLog:       result[STORAGE_KEY_AUDIT_LOG]    || [],
          payloadHistory: result[STORAGE_KEY_PAYLOAD_HIST] || [],
          lastActiveTab:  result[STORAGE_KEY_LAST_TAB]     || 'Scan',
        });
      }
    );
  });
}

/**
 * Persist a partial settings update.
 * Only the keys provided will be written; others are left untouched.
 *
 * @param {object} patch - Partial settings object to merge into storage.
 * @returns {Promise<void>}
 */
export function saveSettings(patch = {}) {
  return new Promise((resolve) => {
    chrome.storage.local.set(patch, resolve);
  });
}

/**
 * Add a host to the allowlist if not already present.
 * Returns the updated allowlist array.
 *
 * @param {string[]} current  - Current allowlist from state.
 * @param {string}   newHost  - Host string to add.
 * @returns {string[] | null} - Updated list, or null if host was already present.
 */
export function addHost(current, newHost) {
  const trimmed = newHost.trim();
  if (!trimmed || current.includes(trimmed)) return null;
  return [...current, trimmed];
}

/**
 * Remove a host from the allowlist.
 * Returns the updated allowlist array.
 *
 * @param {string[]} current - Current allowlist from state.
 * @param {string}   host    - Host string to remove.
 * @returns {string[]}
 */
export function removeHost(current, host) {
  return current.filter((h) => h !== host);
}

/**
 * Append an entry to the audit log, capping at 100 entries.
 *
 * @param {object[]} current - Existing audit log entries.
 * @param {object}   entry   - New entry to prepend.
 * @returns {object[]}
 */
export function appendAuditEntry(current, entry) {
  return [entry, ...current].slice(0, 100);
}
