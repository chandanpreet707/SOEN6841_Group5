#!/usr/bin/env node
/**
 * Local CORS proxy for Ollama API.
 *
 * Forwards /api/* requests to an Ollama instance, stripping
 * origin/referer headers and injecting permissive CORS headers
 * so browser extensions can talk to Ollama without restrictions.
 *
 * Usage:
 *   node scripts/ollama-proxy.js [port]
 *
 * Environment variables:
 *   PROXY_PORT   – listen port (default: 5000)
 *   OLLAMA_BASE  – upstream Ollama URL (default: http://127.0.0.1:11434)
 *
 * Then point the extension's Ollama Base URL at http://127.0.0.1:<port>
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// ── Configuration ───────────────────────────────────────────────────────────

const TARGET_BASE = process.env.OLLAMA_BASE || 'http://127.0.0.1:11434';
const TARGET = new URL(TARGET_BASE);
const IS_HTTPS = TARGET.protocol === 'https:';
const TRANSPORT = IS_HTTPS ? https : http;
const AGENT = IS_HTTPS
  ? new https.Agent({ keepAlive: false })
  : new http.Agent({ keepAlive: false });

const MAX_PORT_RETRIES = 10;
const REQUEST_TIMEOUT_MS = 120_000;

let port = parseInt(process.env.PROXY_PORT || process.argv[2] || '5000', 10);
let retries = 0;

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[ollama-proxy] ${msg}`);
}

function warn(msg) {
  console.warn(`[ollama-proxy] ${msg}`);
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

function sendJson(res, statusCode, body) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function buildProxyOptions(req, targetUrl) {
  const headers = { ...req.headers };
  delete headers.origin;
  delete headers.referer;
  headers.host = TARGET.host;
  headers.connection = 'close';

  return {
    protocol: TARGET.protocol,
    hostname: TARGET.hostname,
    port: TARGET.port || (IS_HTTPS ? 443 : 80),
    method: req.method,
    path: targetUrl.pathname + targetUrl.search,
    headers,
    agent: AGENT,
    timeout: REQUEST_TIMEOUT_MS,
  };
}

function sanitizeResponseHeaders(proxyRes) {
  const headers = { ...proxyRes.headers };
  delete headers['content-security-policy'];
  delete headers['content-security-policy-report-only'];
  return headers;
}

// ── Request handler ─────────────────────────────────────────────────────────

function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (!req.url.startsWith('/api/')) {
    sendJson(res, 200, { ok: true, message: 'Ollama proxy alive', target: TARGET_BASE });
    return;
  }

  const targetUrl = new URL(req.url, TARGET_BASE);
  const options = buildProxyOptions(req, targetUrl);

  const proxyReq = TRANSPORT.request(options, (proxyRes) => {
    setCorsHeaders(res);

    const headers = sanitizeResponseHeaders(proxyRes);
    for (const [key, value] of Object.entries(headers)) {
      try { res.setHeader(key, value); } catch {}
    }

    res.writeHead(proxyRes.statusCode || 502);
    proxyRes.pipe(res);
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    sendJson(res, 504, { ok: false, error: 'Gateway timeout' });
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      sendJson(res, 502, { ok: false, error: 'Proxy error', message: err.message });
    }
  });

  req.pipe(proxyReq);
}

// ── Server lifecycle ────────────────────────────────────────────────────────

function startServer() {
  const server = http.createServer(handleRequest);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (retries >= MAX_PORT_RETRIES) {
        console.error(`[ollama-proxy] Gave up after ${MAX_PORT_RETRIES} port retries.`);
        process.exit(1);
      }
      retries++;
      const next = port + 1;
      warn(`Port ${port} in use, trying ${next}…`);
      port = next;
      server.close(() => startServer());
      return;
    }
    console.error('[ollama-proxy] Server error:', err);
    process.exit(1);
  });

  server.listen(port, () => {
    log(`Listening on http://127.0.0.1:${port} → ${TARGET_BASE}`);
  });

  function shutdown() {
    log('Shutting down…');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5_000);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
