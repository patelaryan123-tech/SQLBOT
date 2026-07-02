const express  = require('express');
const router   = express.Router();

const chatController = require('../controllers/chatController');

// Security Rule #1 — Validate Every User Input
const { validateChatMessage, validateSQL } = require('../middleware/validators');
// Security Rule #3 — Limit Login Attempts (chat-specific rate limit)
const { chatLimiter } = require('../middleware/loginLimiter');

// Main chat endpoint — validate message AND enforce per-user chat rate limit
router.post('/message',     chatLimiter, validateChatMessage, chatController.handleMessage);

// SQL operation endpoints — validate SQL body
router.post('/explain',     validateSQL, chatController.explainQuery);
router.post('/optimize',    validateSQL, chatController.optimizeQuery);
router.post('/check-errors',validateSQL, chatController.checkErrors);

// Execute SQL (already has destructive-query guards in controller)
router.post('/execute',     validateSQL, chatController.executeQuery);

// Chat history
router.get('/history',  chatController.getHistory);
router.delete('/history', chatController.clearHistory);

module.exports = router;
