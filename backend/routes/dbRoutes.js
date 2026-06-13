const express = require('express');
const router = express.Router();
const dbController = require('../controllers/dbController');

// Test database connection
router.get('/test', dbController.testConnection);

// List all databases
router.get('/databases', dbController.getDatabases);

// List all tables
router.get('/tables', dbController.getTables);

// Get table schema
router.get('/schema/:tableName', dbController.getTableSchema);

// Get full schema context
router.get('/schema', dbController.getFullSchema);

// Switch active database
router.post('/switch', dbController.switchDatabase);

module.exports = router;
