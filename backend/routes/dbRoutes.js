const express  = require('express');
const router   = express.Router();
const dbController = require('../controllers/dbController');

// Security Rule #1 — Validate Every User Input
const { validateDbSwitch, validateTableNameParam } = require('../middleware/validators');
// Security Rule #3 — Limit Login Attempts (db-switch specific limiter)
const { dbSwitchLimiter } = require('../middleware/loginLimiter');

// Test database connection
router.get('/test', dbController.testConnection);

// List all databases (read-only, no validation needed beyond auth)
router.get('/databases', dbController.getDatabases);

// List all tables
router.get('/tables', dbController.getTables);

// Get table schema — validate tableName path param (prevents path traversal)
router.get('/schema/:tableName', validateTableNameParam, dbController.getTableSchema);

// Get full schema context
router.get('/schema', dbController.getFullSchema);

// Switch active database — validate body AND apply strict rate limit
router.post('/switch', dbSwitchLimiter, validateDbSwitch, dbController.switchDatabase);

module.exports = router;
