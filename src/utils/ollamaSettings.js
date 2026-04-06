/**
 * ollamaSettings.js
 *
 * Manages Ollama connection settings for the SecureInspect extension.
 * Provides helpers for persisting, loading, and validating
 * the Ollama base URL and model name in chrome.storage.local.
 */

// ── Storage keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEY_OLLAMA_URL   = 'ollamaUrl';
export const STORAGE_KEY_OLLAMA_MODEL = 'ollamaModel';

// ── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_OLLAMA_URL   = 'http://127.0.0.1:11434'\;
export const DEFAULT_OLLAMA_MODEL = 'llama3';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Load persisted Ollama settings from chrome.storage.local.
 * Falls back to defaults if nothing is stored yet.
 *
 * @returns {Promise<{ ollamaUrl: string, ollamaModel: string }>}
 */
export function loadOllamaSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [STORAGE_KEY_OLLAMA_URL, STORAGE_KEY_OLLAMA_MODEL],
      (result) => {
        resolve({
          ollamaUrl:   result[STORAGE_KEY_OLLAMA_URL]   || DEFAULT_OLLAMA_URL,
          ollamaModel: result[STORAGE_KEY_OLLAMA_MODEL] || DEFAULT_OLLAMA_MODEL,
        });
      }
    );
  });
}

/**
 * Persist Ollama connection settings to chrome.storage.local.
 *
 * @param {string} url   - Ollama base URL (e.g. "http://127.0.0.1:11434")
 * @param {string} model - Model name      (e.g. "llama3")
 * @returns {Promise<void>}
 */
export function saveOllamaSettings(url, model) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [STORAGE_KEY_OLLAMA_URL]:   url   || DEFAULT_OLLAMA_URL,
        [STORAGE_KEY_OLLAMA_MODEL]: model || DEFAULT_OLLAMA_MODEL,
      },
      resolve
    );
  });
}

/**
 * Reset Ollama settings back to their default values.
 *
 * @returns {Promise<void>}
 */
export function resetOllamaSettings() {
  return saveOllamaSettings(DEFAULT_OLLAMA_URL, DEFAULT_OLLAMA_MODEL);
}

/**
 * Validate that a given URL string looks like a reachable Ollama endpoint.
 * Does NOT make a network request — just checks the format.
 *
 * @param {string} url
 * @returns {{ valid: boolean, reason: string }}
 */
export function validateOllamaUrl(url) {
  if (!url || !url.trim()) {
    return { valid: false, reason: 'URL cannot be empty.' };
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'\].includes\(parsed.protocol\)\) {
      return { valid: false, reason: 'URL must use http or https.' };
    }
    return { valid: true, reason: 'URL format looks valid.' };
  } catch {
    return { valid: false, reason: 'URL is not a valid format.' };
  }
}
