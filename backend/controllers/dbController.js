const db = require('../config/database');

async function testConnection(req, res) {
  try {
    const result = await db.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ connected: false, message: error.message });
  }
}

async function getDatabases(req, res) {
  try {
    const databases = await db.getDatabases();
    let currentDatabase = process.env.DB_NAME || 'sqlbot_db';
    try {
      const { results } = await db.executeQuery('SELECT DATABASE() as currentDb');
      if (results && results[0]?.currentDb) {
        currentDatabase = results[0].currentDb;
      }
    } catch (e) {
      console.warn('Could not query current database name, falling back to env:', e.message);
    }
    res.json({ databases, currentDatabase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTables(req, res) {
  try {
    const tables = await db.getTables();
    const currentDb = process.env.DB_NAME || 'sqlbot_db';
    try {
      require('fs').appendFileSync('requests.log', `[${new Date().toISOString()}] getTables - Current DB: ${currentDb}, Tables count: ${tables.length}, Tables: ${JSON.stringify(tables)}\n`);
    } catch (err) {}
    res.json({ tables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTableSchema(req, res) {
  try {
    const { tableName } = req.params;
    const schema = await db.getTableSchema(tableName);
    res.json({ tableName, schema });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getFullSchema(req, res) {
  try {
    const schemaContext = await db.getSchemaContext();
    res.json({ schema: schemaContext });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function switchDatabase(req, res) {
  try {
    const { dbName } = req.body;
    if (!dbName) {
      return res.status(400).json({ error: 'dbName is required' });
    }
    try {
      require('fs').appendFileSync('requests.log', `[${new Date().toISOString()}] switchDatabase - Request to switch to: ${dbName}\n`);
    } catch (err) {}
    const result = await db.switchDatabase(dbName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
