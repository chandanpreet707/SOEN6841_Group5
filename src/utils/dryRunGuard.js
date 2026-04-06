/**
 * dryRunGuard.js
 * 
 * Central guard for all live actions in SecureInspect.
 * Provides a single entry point to check dry-run state before
 * any payload is dispatched to the content script.
 */

/**
 * Evaluates whether an action should proceed based on the current mode.
 *
 * In DRY mode:
 *   - Logs the attempt to the audit trail
 *   - Shows a preview alert describing what WOULD happen
 *   - Does NOT execute the callback
 *
 * In LIVE mode:
 *   - Proceeds to the confirmation modal
 *   - Executes callback only after explicit user confirmation
 *
 * @param {boolean}  isDryRun      - Current dry-run state from storage/React state
 * @param {string}   actionLabel   - Human-readable name of the action
 * @param {object}   elementInfo   - { name, type } of the target element
 * @param {string[]} payloads      - Payloads that would be applied
 * @param {Function} onDryRun      - Called when in dry-run mode (receives actionLabel, elementInfo)
 * @param {Function} onLive        - Called when in live mode (receives payloads)
 */
export function dryRunGuard({
  isDryRun,
  actionLabel,
  elementInfo,
  payloads = [],
  onDryRun,
  onLive,
}) {
  if (isDryRun) {
    // Notify the caller so it can log + show the preview alert
    if (typeof onDryRun === 'function') {
      onDryRun(actionLabel, elementInfo, payloads);
    }
    return;
  }

  // Live mode — hand off to the confirmation flow
  if (typeof onLive === 'function') {
    onLive(payloads);
  }
}

/**
 * Builds a human-readable dry-run preview message.
 *
 * @param {string}   actionLabel
 * @param {object}   elementInfo  - { name, type }
 * @param {string[]} payloads
 * @returns {string}
 */
export function buildDryRunMessage(actionLabel, elementInfo, payloads = []) {
  const target = elementInfo?.name || elementInfo?.type || 'unknown field';
  const preview = payloads.slice(0, 3).join('\n');
  const more = payloads.length > 3 ? `\n… +${payloads.length - 3} more` : '';

  return (
    `[Dry Run] "${actionLabel}" was previewed but not executed.\n\n` +
    `Target field: ${target}\n\n` +
    `Payloads that would be used:\n${preview}${more}\n\n` +
    `Switch to Live Mode in Settings to execute this action.`
  );
}
