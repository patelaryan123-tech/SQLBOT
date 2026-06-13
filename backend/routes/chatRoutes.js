const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Main chat endpoint - processes user messages
router.post('/message', chatController.handleMessage);

// Explain a SQL query
router.post('/explain', chatController.explainQuery);

// Optimize a SQL query
router.post('/optimize', chatController.optimizeQuery);

// Check SQL for errors
router.post('/check-errors', chatController.checkErrors);

// Execute a SQL query
router.post('/execute', chatController.executeQuery);

// Get chat history (in-memory for now)
router.get('/history', chatController.getHistory);

// Clear chat history
router.delete('/history', chatController.clearHistory);

module.exports = router;
