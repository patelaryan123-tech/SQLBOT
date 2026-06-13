const express = require('express');
const router = express.Router();
const { testConnection } = require('../config/database');
const { isOllamaAvailable } = require('../services/llmService');

router.get('/', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const llmStatus = await isOllamaAvailable();

    res.json({
      status: 'ok',
      services: {
        database: {
          connected: dbStatus === true || dbStatus?.connected === true
        },
        llm: {
          available: llmStatus.available,
          model: 'llama3'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;