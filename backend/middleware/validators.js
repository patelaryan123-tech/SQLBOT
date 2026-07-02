/**
 * validators.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Security Rule #1 — Validate Every User Input
 * Security Rule #2 — Sanitize All Server Inputs (paired with server.js xss)
 *
 * Uses express-validator to define strict schemas for every incoming request.
 * Each validator chain:
 *   1. Checks that required fields exist and have the correct type/length.
 *   2. Trims whitespace and escapes HTML entities (sanitization).
 *   3. Returns a 422 Unprocessable Entity with field-level errors on failure.
 */

const { body, param, query, validationResult } = require('express-validator');

// ── Helper: run validationResult and return 422 if errors exist ──────────────
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
}

// ── Rule #1 + #2: Chat message validator ─────────────────────────────────────
const validateChatMessage = [
  body('message')
    .exists({ checkFalsy: true }).withMessage('message is required')
    .isString().withMessage('message must be a string')
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('message must be between 1 and 2000 characters')
    .escape(),  // HTML-encode < > & " ' — prevents XSS reflection
  validate
];

// ── Rule #1 + #2: SQL query validator (for /execute, /explain, /optimize) ───
const validateSQL = [
  body('sql')
    .exists({ checkFalsy: true }).withMessage('sql is required')
    .isString().withMessage('sql must be a string')
    .trim()
    .isLength({ min: 1, max: 8000 }).withMessage('sql must be between 1 and 8000 characters'),
  // NOTE: We do NOT .escape() SQL because that would corrupt valid SQL syntax.
  // SQL-injection prevention is handled by parameterised queries at the DB layer.
  validate
];

// ── Rule #1 + #2: Database switch validator ──────────────────────────────────
const validateDbSwitch = [
  body('dbName')
    .exists({ checkFalsy: true }).withMessage('dbName is required')
    .isString().withMessage('dbName must be a string')
    .trim()
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('dbName may only contain letters, numbers, and underscores')
    .isLength({ min: 1, max: 64 }).withMessage('dbName must be between 1 and 64 characters'),
  validate
];

// ── Rule #1 + #2: Table name param validator ─────────────────────────────────
const validateTableNameParam = [
  param('tableName')
    .exists({ checkFalsy: true }).withMessage('tableName param is required')
    .isString().withMessage('tableName must be a string')
    .trim()
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('tableName may only contain letters, numbers, and underscores')
    .isLength({ min: 1, max: 64 }).withMessage('tableName must be between 1 and 64 characters'),
  validate
];

// ── Rule #1 + #2: Upload file validator (runs after multer) ──────────────────
const validateUpload = [
  (req, res, next) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(422).json({ error: 'Validation failed', details: [{ field: 'file', message: 'A file upload is required' }] });
    }
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const file = req.file || req.files[0];
    if (!allowed.includes(file.mimetype)) {
      return res.status(422).json({ error: 'Validation failed', details: [{ field: 'file', message: `Unsupported file type: ${file.mimetype}` }] });
    }
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE_BYTES) {
      return res.status(422).json({ error: 'Validation failed', details: [{ field: 'file', message: 'File exceeds 10 MB limit' }] });
    }
    next();
  }
];

module.exports = {
  validate,
  validateChatMessage,
  validateSQL,
  validateDbSwitch,
  validateTableNameParam,
  validateUpload
};
