/**
 * passwordUtils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Security Rule #4 — Hash Every Password
 *
 * Centralised bcrypt wrapper used throughout the application.
 * Cost factor (SALT_ROUNDS) is configurable via .env.
 * NEVER store or log plain-text passwords — always call hashPassword() first.
 *
 * Usage:
 *   const { hashPassword, verifyPassword, isStrong } = require('../utils/passwordUtils');
 *
 *   // Creating a new user:
 *   const hash = await hashPassword(plaintextPassword);
 *   await db.saveUser({ email, passwordHash: hash });
 *
 *   // Verifying login:
 *   const isValid = await verifyPassword(supplied, storedHash);
 *   if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
 */

const bcrypt = require('bcryptjs');

// Minimum recommended cost factor — increase in production (12–14).
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

/**
 * Hash a plaintext password.
 * @param {string} plaintext
 * @returns {Promise<string>} bcrypt hash
 */
async function hashPassword(plaintext) {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('hashPassword: plaintext must be a non-empty string');
  }
  // bcrypt natively limits input to 72 bytes — note this in docs.
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Compare a plaintext attempt against a stored bcrypt hash.
 * Returns false (never throws) on mismatch so callers can safely branch.
 * @param {string} plaintext
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(plaintext, hash) {
  if (!plaintext || !hash) return false;
  try {
    return await bcrypt.compare(plaintext, hash);
  } catch {
    return false;
  }
}

/**
 * Minimal password strength checker.
 * Returns { valid: boolean, reason?: string }.
 * Enforce BEFORE hashing so we reject weak passwords early.
 *
 * Rules:
 *   - At least 8 characters
 *   - At least one uppercase letter
 *   - At least one lowercase letter
 *   - At least one digit
 *   - At least one special character
 */
function isStrongPassword(plaintext) {
  if (typeof plaintext !== 'string') {
    return { valid: false, reason: 'Password must be a string' };
  }
  if (plaintext.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(plaintext)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(plaintext)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter' };
  }
  if (!/\d/.test(plaintext)) {
    return { valid: false, reason: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(plaintext)) {
    return { valid: false, reason: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

module.exports = { hashPassword, verifyPassword, isStrongPassword };
