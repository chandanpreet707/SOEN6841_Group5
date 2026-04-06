const rateLimiter = {
  actions: [],
  maxActionsPerMinute: 20,

  canPerformAction() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.actions = this.actions.filter((time) => time > oneMinuteAgo);
    if (this.actions.length >= this.maxActionsPerMinute) {
      return false;
    }
    this.actions.push(now);
    return true;
  },

  getRemainingActions() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.actions = this.actions.filter((time) => time > oneMinuteAgo);
    return this.maxActionsPerMinute - this.actions.length;
  },
};

/**
 * Payload validator.
 * Checks that a payload string does not contain dangerous patterns
 * before it is dispatched to the content script.
 *
 * Sanctioned lab hosts (localhost, dvwa, etc.) bypass pattern checks
 * so testers can run full OWASP payloads without interference.
 *
 * @typedef  {Object}  ValidationResult
 * @property {boolean} safe   - Whether the payload passed all checks.
 * @property {string}  reason - Human-readable explanation.
 */
const payloadValidator = {
  dangerousPatterns: [
    /<script[\s\S]*?>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+.*SET/i,
    /UNION\s+SELECT/i,
    /exec\s*\(/i,
    /\.\.\/\.\.\//g,
  ],

  isSafe(payload, targetHost) {
    const sanctionedLabs = [
      'dvwa',
      'localhost',
      '127.0.0.1',
      'google',
      'webgoat',
      'hackazon',
    ];
    const normalizedHost = String(targetHost || '').toLowerCase();
    const isSanctioned = sanctionedLabs.some((lab) =>
      normalizedHost.includes(lab)
    );

    if (isSanctioned) {
      return { safe: true, reason: 'Sanctioned lab target' };
    }

    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(payload)) {
        return {
          safe: false,
          reason: `Dangerous pattern detected: ${pattern.toString()}`,
        };
      }
    }

    return { safe: true, reason: 'Passed validation' };
  },
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkRateLimit') {
    const canPerform = rateLimiter.canPerformAction();
    const remaining = rateLimiter.getRemainingActions();
    sendResponse({
      allowed: canPerform,
      remaining: remaining,
      message: canPerform ? 'Action allowed' : 'Rate limit exceeded',
    });
    return true;
  }

  if (request.action === 'validatePayload') {
    const validation = payloadValidator.isSafe(request.payload, request.host);
    sendResponse(validation);
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['allowlist', 'dryRunMode', 'auditLog'], (result) => {
    const defaults = {};
    if (!result.allowlist)              defaults.allowlist   = ['*'];
    if (result.dryRunMode === undefined) defaults.dryRunMode = true;
    if (!result.auditLog)              defaults.auditLog    = [];

    chrome.storage.local.set(defaults, () => {
      // Explicitly set badge after defaults are written so the badge
      // reflects reality on first install rather than waiting for a
      // storage.onChanged event (which does not fire for the initial set).
      const isDry = result.dryRunMode !== false;
      chrome.action.setBadgeText({ text: isDry ? 'DRY' : 'LIVE' });
      chrome.action.setBadgeBackgroundColor({ color: isDry ? '#FF9800' : '#4CAF50' });
    });
  });
});

chrome.storage.local.get(['dryRunMode'], (result) => {
  if (result.dryRunMode) {
    chrome.action.setBadgeText({ text: 'DRY' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
  } else {
    chrome.action.setBadgeText({ text: 'LIVE' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.dryRunMode) {
    if (changes.dryRunMode.newValue) {
      chrome.action.setBadgeText({ text: 'DRY' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
    } else {
      chrome.action.setBadgeText({ text: 'LIVE' });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    }
  }
});
