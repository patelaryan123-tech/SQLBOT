const db = require('../config/database');
// Security Rule #5 — Hide Authentication Details
const { scrubSensitive } = require('../middleware/errorHandler');

async function testConnection(req, res, next) {
  try {
    const result = await db.testConnection();
    res.json(result);
  } catch (error) {
    next(error); // Rule #5: global handler returns safe message
  }
}

async function getDatabases(req, res, next) {
  try {
    const databases = await db.getDatabases();
    let currentDatabase = process.env.DB_NAME || 'sqlbot_db';
    try {
      const { results } = await db.executeQuery('SELECT DATABASE() as currentDb');
      if (results && results[0]?.currentDb) {
        currentDatabase = results[0].currentDb;
      }
    } catch (e) {
      // Non-fatal — fall back to env value; don't expose e.message to client
      console.warn('Could not query current database name, falling back to env.');
    }
    res.json({ databases, currentDatabase });
  } catch (error) {
    next(error); // Rule #5
  }
}

async function getTables(req, res, next) {
  try {
    const tables = await db.getTables();
    const currentDb = process.env.DB_NAME || 'sqlbot_db';
    try {
      require('fs').appendFileSync('requests.log', `[${new Date().toISOString()}] getTables - DB: ${currentDb}, count: ${tables.length}\n`);
    } catch (err) {} // ignore log errors
    res.json({ tables });
  } catch (error) {
    next(error); // Rule #5
  }
}

async function getTableSchema(req, res, next) {
  try {
    const { tableName } = req.params;
    // Rule #1: tableName is already validated/sanitized by validateTableNameParam
    const schema = await db.getTableSchema(tableName);
    res.json({ tableName, schema });
  } catch (error) {
    next(error); // Rule #5
  }
}

async function getFullSchema(req, res, next) {
  try {
    const schemaContext = await db.getSchemaContext();
    res.json({ schema: schemaContext });
  } catch (error) {
    next(error); // Rule #5
  }
}

async function switchDatabase(req, res, next) {
  try {
    const { dbName } = req.body;
    if (!dbName) {
      return res.status(400).json({ error: 'dbName is required' });
    }
    try {
      require('fs').appendFileSync('requests.log', `[${new Date().toISOString()}] switchDatabase - switching to: ${dbName}\n`);
    } catch (err) {} // ignore log errors
    const result = await db.switchDatabase(dbName);
    res.json(result);
  } catch (error) {
    next(error); // Rule #5
  }
}

module.exports = {
  testConnection,
  getDatabases,
  getTables,
  getTableSchema,
  getFullSchema,
  switchDatabase
};
