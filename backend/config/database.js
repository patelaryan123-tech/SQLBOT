const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

/**
 * Get or create the MySQL connection pool.
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sqlbot_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return pool;
}

/**
 * Execute a SQL query with optional parameters.
 */
async function executeQuery(sql, params = []) {
  const connection = getPool();
  try {
    const [results, fields] = await connection.execute(sql, params);
    return { results, fields };
  } catch (error) {
    throw error;
  }
}

/**
 * Test the database connection.
 */
async function testConnection() {
  try {
    const connection = getPool();
    const [rows] = await connection.execute('SELECT 1 as connected');
    return { connected: true, message: 'Database connected successfully' };
  } catch (error) {
    return { connected: false, message: error.message };
  }
}

/**
 * Get all databases.
 */
async function getDatabases() {
  const { results } = await executeQuery('SHOW DATABASES');
  return results.map(r => Object.values(r)[0]);
}

/**
 * Get all tables in the current database.
 */
async function getTables() {
  const { results } = await executeQuery('SHOW TABLES');
  return results.map(r => Object.values(r)[0]);
}

/**
 * Get table structure / schema.
 */
async function getTableSchema(tableName) {
  const { results } = await executeQuery(`DESCRIBE \`${tableName}\``);
  return results;
}

/**
 * Get the full schema context string for LLM prompts.
 */
async function getSchemaContext() {
  try {
    const tables = await getTables();
    if (tables.length === 0) return 'No tables found in the database.';

    let context = `Database: ${process.env.DB_NAME}\nTables:\n`;
    for (const table of tables) {
      const schema = await getTableSchema(table);
      context += `\n  Table: ${table}\n  Columns:\n`;
      schema.forEach(col => {
        context += `    - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULLABLE' : 'NOT NULL'} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''} ${col.Key === 'MUL' ? 'FOREIGN KEY' : ''}\n`;
      });
    }
    return context;
  } catch (error) {
    return `Error fetching schema: ${error.message}`;
  }
}

/**
 * Automatically create and seed sample tables if they do not exist.
 */
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database schema...');
    
    // 1. Create subscriptions table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS \`subscriptions\` (
        \`id\` INT PRIMARY KEY AUTO_INCREMENT,
        \`plan_name\` VARCHAR(100) NOT NULL,
        \`tier\` VARCHAR(50) NOT NULL,
        \`status\` VARCHAR(50) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Create users table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`user_id\` INT PRIMARY KEY AUTO_INCREMENT,
        \`full_name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`city\` VARCHAR(100) NOT NULL,
        \`status\` VARCHAR(50) NOT NULL,
        \`subscription_id\` INT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Create products table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS \`products\` (
        \`product_id\` INT PRIMARY KEY AUTO_INCREMENT,
        \`product_name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`price\` DECIMAL(10,2) NOT NULL,
        \`stock\` INT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Create orders table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`order_id\` INT PRIMARY KEY AUTO_INCREMENT,
        \`customer_name\` VARCHAR(255) NOT NULL,
        \`amount\` DECIMAL(10,2) NOT NULL,
        \`status\` VARCHAR(50) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create persistent chat history table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS \`chat_history\` (
        \`id\` INT PRIMARY KEY AUTO_INCREMENT,
        \`user_uid\` VARCHAR(128) NOT NULL,
        \`user_message\` TEXT NOT NULL,
        \`response\` JSON NOT NULL,
        \`intent\` VARCHAR(50),
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_user_uid\` (\`user_uid\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if users table is empty to seed initial data
    const { results: userCheck } = await executeQuery('SELECT COUNT(*) as count FROM users');
    if (userCheck[0].count === 0) {
      console.log('🌱 Seeding initial database records...');
      
      // Seed Subscriptions
      await executeQuery(`
        INSERT INTO \`subscriptions\` (\`plan_name\`, \`tier\`, \`status\`) VALUES
        ('Pro Yearly', 'premium', 'active'),
        ('Pro Monthly', 'premium', 'active'),
        ('Enterprise', 'premium', 'active'),
        ('Basic Free', 'free', 'active');
      `);

      // Seed Users
      await executeQuery(`
        INSERT INTO \`users\` (\`full_name\`, \`email\`, \`city\`, \`status\`, \`subscription_id\`) VALUES
        ('Rahul Sharma', 'rahul.s@example.com', 'Ahmedabad', 'active', 1),
        ('Priya Patel', 'priya.p@example.com', 'Ahmedabad', 'active', 2),
        ('Amit Mehta', 'amit.m@example.com', 'Ahmedabad', 'inactive', 4),
        ('Neha Joshi', 'neha.j@example.com', 'Ahmedabad', 'active', 1),
        ('Alice Vance', 'alice.v@example.com', 'Mumbai', 'active', 3),
        ('Bob Miller', 'bob.m@example.com', 'Delhi', 'active', 2),
        ('Charlie Day', 'charlie.d@example.com', 'Bangalore', 'active', 3),
        ('Diana Prince', 'diana.p@example.com', 'Pune', 'active', 1);
      `);

      // Seed Products
      await executeQuery(`
        INSERT INTO \`products\` (\`product_name\`, \`category\`, \`price\`, \`stock\`) VALUES
        ('Cyber Keyboard Pro', 'Hardware', 149.99, 45),
        ('HoloLens VR Headset', 'Gear', 499.00, 12),
        ('Quantum Deck', 'Hardware', 899.50, 8),
        ('Nexus Quantum Laptop', 'Hardware', 1999.00, 5),
        ('Cyber Deck Pro', 'Hardware', 1499.00, 15);
      `);

      // Seed Orders
      await executeQuery(`
        INSERT INTO \`orders\` (\`customer_name\`, \`amount\`, \`status\`) VALUES
        ('Rahul Sharma', 149.99, 'completed'),
        ('Priya Patel', 499.00, 'completed'),
        ('Alice Vance', 1999.00, 'completed'),
        ('Bob Miller', 1499.00, 'pending');
      `);
      console.log('✅ Database seeding complete.');
    } else {
      console.log('✅ Database already seeded.');
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
  }
}

/**
 * Switch the active database by recreating the connection pool.
 */
async function switchDatabase(dbName) {
  try {
    if (pool) {
      await pool.end();
      pool = null;
    }
    process.env.DB_NAME = dbName;
    // Force recreation of pool and test it
    const testPool = getPool();
    await testPool.execute('SELECT 1');
    console.log(`✅ Successfully switched database to: ${dbName}`);
    return { success: true, message: `Switched database to ${dbName}` };
  } catch (error) {
    console.error(`❌ Failed to switch database to ${dbName}:`, error.message);
    throw error;
  }
}

/**
 * Persistent Chat Persistence Layer
 */
async function saveChat(uid, userMessage, response, intent) {
  return await executeQuery(
    'INSERT INTO chat_history (user_uid, user_message, response, intent) VALUES (?, ?, ?, ?)',
    [uid, userMessage, JSON.stringify(response), intent]
  );
}

async function getPersistentHistory(uid, limit = 50) {
  const safeLimit = parseInt(limit, 10) || 50;
  const { results } = await executeQuery(
    `SELECT * FROM chat_history WHERE user_uid = ? ORDER BY created_at DESC LIMIT ${safeLimit}`,
    [uid]
  );
  
  if (!results || !Array.isArray(results)) return [];
  
  // Return in chronological order for the UI, ensuring response is parsed from JSON
  return [...results].reverse().map(r => ({
    id: r.id,
    timestamp: r.created_at,
    userMessage: r.user_message,
    intent: r.intent,
    response: typeof r.response === 'string' ? JSON.parse(r.response) : r.response
  }));
}

async function clearPersistentHistory(uid) {
  return await executeQuery('DELETE FROM chat_history WHERE user_uid = ?', [uid]);
}

module.exports = {
  getPool,
  executeQuery,
  testConnection,
  getDatabases,
  getTables,
  getTableSchema,
  getSchemaContext,
  initializeDatabase,
  switchDatabase,
  saveChat,
  getPersistentHistory,
  clearPersistentHistory
};
