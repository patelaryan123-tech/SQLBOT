/**
 * errorHandler.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Security Rule #5 — Hide Authentication Details
 *
 * A centralised error-handling middleware that NEVER leaks:
 *   • Stack traces in production
 *   • Database credentials or connection strings
 *   • Internal file paths
 *   • Authentication tokens or secrets
 *   • Specific error codes that reveal infrastructure details
 *
 * It maps known error types to safe, client-facing messages while logging
 * the full detail server-side only.
 */

const isProd = process.env.NODE_ENV === 'production';

// ── Credential patterns to scrub from any message before logging ─────────────
const CREDENTIAL_PATTERNS = [
  /password\s*[:=]\s*\S+/gi,
  /secret\s*[:=]\s*\S+/gi,
  /token\s*[:=]\s*\S+/gi,
  /api[_-]?key\s*[:=]\s*\S+/gi,
  /authorization:\s*\S+/gi,
  /mysql:\/\/[^\s]+/gi,            // DB connection strings
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g  // IP addresses
];

/**
 * Scrub credential patterns from a string.
 * @param {string} msg
 * @returns {string}
 */
function scrubSensitive(msg) {
  if (typeof msg !== 'string') return String(msg);
  return CREDENTIAL_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, '[REDACTED]'), msg);
}

/**
 * Map an error to a safe HTTP status code and a vague client message.
 * The full error detail is logged server-side.
 * @param {Error} err
 * @returns {{ status: number, clientMessage: string }}
 */
function classifyError(err) {
  const code = err.code || '';
  const msg  = (err.message || '').toLowerCase();

  // MySQL / DB errors — hide all DB internals
  if (code.startsWith('ER_') || msg.includes('mysql') || msg.includes('sql')) {
    return { status: 500, clientMessage: 'A database error occurred. Please try again.' };
  }
  // Auth errors
  if (code === 'UNAUTHENTICATED' || msg.includes('token') || msg.includes('unauthorized') || msg.includes('forbidden')) {
    return { status: 401, clientMessage: 'Authentication failed. Please log in again.' };
  }
  // Validation errors (should be caught upstream, but just in case)
  if (code === 'VALIDATION_ERROR' || msg.includes('validation')) {
    return { status: 422, clientMessage: 'The provided data is invalid. Please check your input.' };
  }
  // Network / external service errors
  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || msg.includes('ollama') || msg.includes('llm')) {
    return { status: 503, clientMessage: 'An external service is temporarily unavailable. Please try again shortly.' };
  }
  // File system errors — never expose paths
  if (code === 'ENOENT' || code === 'EACCES' || msg.includes('file') || msg.includes('path')) {
    return { status: 500, clientMessage: 'A server-side resource error occurred.' };
  }
  // Default
  return { status: 500, clientMessage: 'An unexpected error occurred. Please try again.' };
}

/**
 * Global error-handling middleware.
 * Must be registered LAST in server.js (after all routes).
 *
 * @param {Error} err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {  // eslint-disable-line no-unused-vars
  // Always log the real, full error on the server (with credentials scrubbed).
  const scrubbedMessage = scrubSensitive(err.message || '');
  const scrubbedStack   = isProd ? '[stack hidden in production]' : scrubSensitive(err.stack || '');

  console.error(`[ERROR] ${req.method} ${req.path} — ${scrubbedMessage}`);
  if (!isProd) {
    console.error(scrubbedStack);
  }

  // Determine what the client should see
  const { status, clientMessage } = classifyError(err);

  // Build a safe response — NO stack, NO internal paths, NO credentials
  const body = {
    error: clientMessage
  };

  // In development, attach a scrubbed error code to aid debugging
  if (!isProd && err.code) {
    body.code = err.code;
  }

  res.status(status).json(body);
}

/**
 * 404 handler — placed before errorHandler in server.js.
 * Returns a vague "not found" without leaking route structure.
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: 'The requested resource was not found.' });
}

module.exports = { errorHandler, notFoundHandler, scrubSensitive };
