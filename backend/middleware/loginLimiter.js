/**
 * loginLimiter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Security Rule #3 — Limit Login Attempts
 *
 * Two separate rate-limiters:
 *
 *  1. loginLimiter — Tight limit specifically for authentication/sensitive
 *     endpoints. Allows only 10 attempts per 15 minutes per IP.
 *     Returns a descriptive 429 with a retry-after hint.
 *
 *  2. chatLimiter — Moderate limit for the AI chat endpoint (heavier LLM
 *     workload). Allows 30 requests per minute per IP.
 *
 * Both limiters add standard RateLimit-* headers so clients can adapt.
 */

const rateLimit = require('express-rate-limit');

// ── 1. Auth / sensitive route limiter ────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per window
  standardHeaders: true,     // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    error: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.',
    retryAfterSeconds: 15 * 60
  },
  // Customise key to include the route path so a burst on /login doesn't
  // penalise /register and vice-versa.
  keyGenerator: (req) => `${req.ip}::${req.path}`
});

// ── 2. Chat-endpoint limiter (AI is expensive) ───────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // 30 messages per minute — generous for a chat UI
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Chat rate limit exceeded. Please slow down — you can send up to 30 messages per minute.',
    retryAfterSeconds: 60
  }
});

// ── 3. DB switch limiter (prevent enumeration / brute-force DB names) ─────────
const dbSwitchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many database switch requests. Please wait before trying again.'
  }
});

module.exports = { loginLimiter, chatLimiter, dbSwitchLimiter };
