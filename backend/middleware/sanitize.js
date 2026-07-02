/**
 * sanitize.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Security Rule #2 — Sanitize All Server Inputs (deep sanitization layer)
 *
 * This middleware runs AFTER body-parser and xss-clean (in server.js) to
 * perform a second, deeper pass of sanitization:
 *
 *  1. deepStrip()  — Recursively walks req.body / req.query / req.params and:
 *       • Removes null bytes (\x00) — used in path-traversal attacks
 *       • Strips Unicode directional override chars — used in UI-spoofing
 *       • Collapses zero-width spaces / invisible characters
 *       • Trims leading/trailing whitespace from strings
 *
 *  2. detectSQLInjection() — Pattern-checks raw string values for common
 *       SQL-injection payloads and rejects the request with 400 early,
 *       before the query reaches any database layer.
 *       (NOT a replacement for parameterised queries — a defence-in-depth layer.)
 */

// Patterns that strongly indicate SQL injection attempts in a chat message
// (not in the /execute endpoint which legitimately receives SQL).
const SQL_INJECTION_PATTERNS = [
  /'\s*(OR|AND)\s+'?\d+'?\s*=\s*'?\d+/i,        // ' OR 1=1
  /;\s*(DROP|DELETE|TRUNCATE|ALTER|GRANT)\s+/i,  // ; DROP TABLE
  /UNION\s+(ALL\s+)?SELECT/i,                     // UNION SELECT
  /'\s*;\s*--/,                                   // '; --
  /\/\*[\s\S]*?\*\//,                             // /* block comment */
  /xp_cmdshell/i,                                 // MSSQL shell escape
  /EXEC\s*\(/i,                                    // EXEC(
  /LOAD_FILE\s*\(/i,                              // MySQL file read
  /INTO\s+OUTFILE/i                               // MySQL file write
];

/**
 * Recursively sanitize a value.
 * @param {*} value
 * @returns sanitized value of the same type
 */
function deepStrip(value) {
  if (typeof value === 'string') {
    return value
      .replace(/\x00/g, '')                          // null bytes
      .replace(/[\u200B-\u200D\uFEFF]/g, '')         // zero-width chars
      .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')  // bidi override chars
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(deepStrip);
  }
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(value)) {
      cleaned[k] = deepStrip(v);
    }
    return cleaned;
  }
  return value;
}

/**
 * Check a string for SQL injection patterns.
 * Returns true if a known injection pattern is detected.
 * @param {string} str
 * @returns {boolean}
 */
function hasSQLInjection(str) {
  if (typeof str !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(str));
}

/**
 * Recursively scan an object's string values for SQL injection patterns.
 * Returns the first suspicious value found, or null.
 * @param {*} obj
 * @returns {string|null}
 */
function findInjection(obj) {
  if (typeof obj === 'string') {
    return hasSQLInjection(obj) ? obj : null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const hit = findInjection(item);
      if (hit) return hit;
    }
  }
  if (obj !== null && typeof obj === 'object') {
    for (const v of Object.values(obj)) {
      const hit = findInjection(v);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Express middleware: deep-sanitize all incoming data and block SQL injection
 * in non-SQL endpoints.
 */
function sanitizeInputs(req, res, next) {
  // 1. Deep-strip invisible/dangerous characters from all inputs
  if (req.body && typeof req.body === 'object') {
    req.body = deepStrip(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = deepStrip(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = deepStrip(req.params);
  }

  // 2. Block SQL injection in chat messages (not in /execute which is a SQL editor)
  const isSQLEndpoint = req.path === '/execute';
  if (!isSQLEndpoint && req.body) {
    const suspicious = findInjection(req.body);
    if (suspicious) {
      console.warn(`[SECURITY] SQL injection pattern blocked from ${req.ip} on ${req.path}`);
      return res.status(400).json({
        error: 'Invalid input detected',
        message: 'Your request contains characters or patterns that are not permitted.'
      });
    }
  }

  next();
}

module.exports = { sanitizeInputs, deepStrip, hasSQLInjection };
