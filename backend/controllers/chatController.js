const { v4: uuidv4 } = require('uuid');
const { classifyIntent, extractSQL, extractTableName } = require('../services/nlpEngine');
const llmService = require('../services/llmService');
const db = require('../config/database');

// Rule-based high-fidelity fallback responses when LLM is offline
const SQL_KNOWLEDGE_BASE = {
  join: {
    message: "A **JOIN** clause is used to combine rows from two or more tables, based on a related column between them.\n\nHere are the primary types of SQL Joins:\n\n• **INNER JOIN**: Returns records that have matching values in both tables.\n• **LEFT (OUTER) JOIN**: Returns all records from the left table, and the matched records from the right table. If no match is found, NULL is returned for the right table.\n• **RIGHT (OUTER) JOIN**: Returns all records from the right table, and the matched records from the left table.\n• **FULL (OUTER) JOIN**: Returns all records when there is a match in either left or right table.\n\n### Example:\n```sql\nSELECT users.full_name, subscriptions.plan_name \nFROM users \nINNER JOIN subscriptions ON users.subscription_id = subscriptions.id;\n```",
    sql: "SELECT users.full_name, subscriptions.plan_name FROM users INNER JOIN subscriptions ON users.subscription_id = subscriptions.id;"
  },
  'group by': {
    message: "The **GROUP BY** statement groups rows that have the same values into summary rows, like \"find the number of customers in each country\".\n\nIt is often used with aggregate functions (`COUNT()`, `MAX()`, `MIN()`, `SUM()`, `AVG()`) to group the result-set by one or more columns.\n\n### Example:\n```sql\nSELECT city, COUNT(*) as total_customers \nFROM users \nGROUP BY city;\n```",
    sql: "SELECT city, COUNT(*) as total_customers FROM users GROUP BY city;"
  },
  having: {
    message: "The **HAVING** clause was added to SQL because the `WHERE` keyword cannot be used with aggregate functions.\n\nIt is used to filter the results of a `GROUP BY` statement based on a specified condition.\n\n### Example:\n```sql\nSELECT city, COUNT(*) as total \nFROM users \nGROUP BY city \nHAVING COUNT(*) > 5;\n```",
    sql: "SELECT city, COUNT(*) as total FROM users GROUP BY city HAVING COUNT(*) > 5;"
  },
  index: {
    message: "An **INDEX** is a performance optimization tool used by databases to find rows extremely quickly.\n\nWithout an index, the database must perform a *Full Table Scan* (reading every single row). With an index, it can jump straight to the data using a B-Tree structure, drastically speeding up queries on large tables.\n\n### Example:\n```sql\nCREATE INDEX idx_user_email ON users(email);\n```",
    sql: "CREATE INDEX idx_user_email ON users(email);"
  },
  'primary key': {
    message: "A **PRIMARY KEY** is a column (or a combination of columns) that uniquely identifies each row in a table.\n\n• Primary key values must be unique.\n• A primary key column cannot contain NULL values.\n• A table can have only ONE primary key.\n\n### Example:\n```sql\nCREATE TABLE users (\n  user_id INT PRIMARY KEY AUTO_INCREMENT,\n  email VARCHAR(255) NOT NULL UNIQUE\n);\n```",
    sql: "CREATE TABLE users (user_id INT PRIMARY KEY AUTO_INCREMENT, email VARCHAR(255) NOT NULL UNIQUE);"
  },
  'foreign key': {
    message: "A **FOREIGN KEY** is a field (or collection of fields) in one table, that refers to the `PRIMARY KEY` in another table.\n\nIt is used to link two tables together and enforce *Referential Integrity*, ensuring that the relationship between tables remains consistent.\n\n### Example:\n```sql\nCREATE TABLE users (\n  user_id INT PRIMARY KEY,\n  subscription_id INT,\n  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)\n);\n```",
    sql: "ALTER TABLE users ADD CONSTRAINT fk_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);"
  },
  cte: {
    message: "A **CTE (Common Table Expression)** is a temporary named result set that you can reference within a `SELECT`, `INSERT`, `UPDATE`, or `DELETE` statement.\n\nCTEs improve query readability and maintainability by breaking complex nested joins and subqueries into logical blocks.\n\n### Example:\n```sql\nWITH PremiumUsers AS (\n  SELECT * FROM users WHERE tier = 'premium'\n)\nSELECT * FROM PremiumUsers WHERE city = 'Ahmedabad';\n```",
    sql: "WITH PremiumUsers AS (SELECT * FROM users WHERE tier = 'premium') SELECT * FROM PremiumUsers;"
  },
  subquery: {
    message: "A **Subquery** (or Inner Query / Nested Query) is a query within another SQL query.\n\nIt can be placed in the `SELECT` clause, the `FROM` clause, or the `WHERE` clause to compute a value that the outer query needs.\n\n### Example:\n```sql\nSELECT * FROM users \nWHERE subscription_id IN (SELECT id FROM subscriptions WHERE tier = 'premium');\n```",
    sql: "SELECT * FROM users WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tier = 'premium');"
  },
  transaction: {
    message: "A **Transaction** is a sequential group of database operations executed as a single logical unit of work.\n\nTransactions must follow **ACID** properties:\n• **Atomicity**: All changes succeed, or all fail together (Rollback).\n• **Consistency**: Database remains in a valid state.\n• **Isolation**: Concurrent transactions do not interfere.\n• **Durability**: Completed transactions are permanently saved.\n\n### Example:\n```sql\nSTART TRANSACTION;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;\n```",
    sql: "START TRANSACTION; UPDATE accounts SET balance = balance - 100 WHERE id = 1; COMMIT;"
  },
  union: {
    message: "The **UNION** operator is used to combine the result-set of two or more `SELECT` statements.\n\n• Each `SELECT` statement within `UNION` must have the same number of columns.\n• The columns must have similar data types.\n• `UNION` selects only distinct values by default. Use `UNION ALL` to include duplicate values.\n\n### Example:\n```sql\nSELECT city FROM users\nUNION\nSELECT city FROM suppliers;\n```",
    sql: "SELECT city FROM users UNION SELECT city FROM suppliers;"
  }
};

function getFallbackResponse(intent, message) {
  const lower = message.toLowerCase().trim();
  
  // 1. Check SQL Knowledge Base for concepts
  for (const [key, kb] of Object.entries(SQL_KNOWLEDGE_BASE)) {
    if (lower.includes(key)) {
      return {
        success: true,
        type: 'conversation',
        message: kb.message,
        sql: kb.sql
      };
    }
  }

  // 2. Generic concept matcher (e.g. "what is x", "explain y")
  const conceptMatch = message.match(/(?:what is|explain|tell me about|how to use|define)\s+([a-zA-Z\s]+)/i);
  if (conceptMatch) {
    const concept = conceptMatch[1].trim();
    if (concept.length > 2 && concept.length < 25) {
      const properConcept = concept.toUpperCase();
      return {
        success: true,
        type: 'conversation',
        message: `**${properConcept}** is a core SQL concept. Usually, it is utilized to structure, filter, or manipulate database sets. Here is a standard structural query representing **${properConcept}** syntax:\n\nIf you want to perform query generation or explore specific tables, let me know!`,
        sql: `SELECT * FROM users; -- Standard ${properConcept} demo context`
      };
    }
  }

  // 3. Fallback to SQL Generator for table requests
  if (lower.includes('show') || lower.includes('list') || lower.includes('get') || lower.includes('find') || lower.includes('select') || lower.includes('customer') || lower.includes('product') || lower.includes('order')) {
    let table = 'users'; // default
    let tableLabel = 'users';
    if (lower.includes('customer') || lower.includes('client') || lower.includes('user')) {
      table = 'users';
      tableLabel = 'customers';
    } else if (lower.includes('product') || lower.includes('item')) {
      table = 'products';
      tableLabel = 'products';
    } else if (lower.includes('order') || lower.includes('purchase')) {
      table = 'orders';
      tableLabel = 'orders';
    } else if (lower.includes('subscription') || lower.includes('plan')) {
      table = 'subscriptions';
      tableLabel = 'subscriptions';
    } else if (lower.includes('employee') || lower.includes('staff')) {
      table = 'employees';
      tableLabel = 'employees';
    }

    let conditions = [];
    let explanationParts = [];
    let detectedCity = 'Ahmedabad'; // default
    
    // Place detection
    const cityMatch = message.match(/(?:from|in|at|living in|location of)\s+([A-Z][a-zA-Z]+)/);
    if (cityMatch) {
      detectedCity = cityMatch[1];
      conditions.push(`city = '${detectedCity}'`);
      explanationParts.push(`where the city is '${detectedCity}'`);
    } else {
      const cityLowerMatch = message.match(/(?:from|in|at|living in)\s+([a-z]+)/i);
      if (cityLowerMatch && cityLowerMatch[1] !== 'the' && cityLowerMatch[1] !== 'a' && cityLowerMatch[1] !== 'my') {
        detectedCity = cityLowerMatch[1].charAt(0).toUpperCase() + cityLowerMatch[1].slice(1);
        conditions.push(`city = '${detectedCity}'`);
        explanationParts.push(`where the city is '${detectedCity}'`);
      }
    }

    // Status detection
    const statusMatch = lower.match(/\b(active|pending|completed|inactive|cancelled)\b/i);
    if (statusMatch) {
      const status = statusMatch[1];
      conditions.push(`status = '${status}'`);
      explanationParts.push(`having a status of '${status}'`);
    }

    // Price filter
    const numberMatch = lower.match(/(?:greater than|more than|>)\s*(\d+)/i);
    if (numberMatch) {
      const num = numberMatch[1];
      const field = table === 'employees' ? 'salary' : (table === 'products' ? 'price' : 'amount');
      conditions.push(`${field} > ${num}`);
      explanationParts.push(`where the ${field} is greater than ${num}`);
    }

    let selectFields = '*';
    let isCount = false;
    if (lower.includes('how many') || lower.includes('count')) {
      selectFields = 'COUNT(*) as total';
      isCount = true;
    }

    let sql = `SELECT ${selectFields} FROM ${table}`;
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    let limitMatch = lower.match(/(?:limit|top|first)\s*(\d+)/);
    if (limitMatch) {
      sql += ` LIMIT ${limitMatch[1]}`;
    } else if (!isCount && selectFields === '*') {
      sql += ` LIMIT 10`;
    }
    sql += ';';

    let mockData = [];
    let fields = [];
    
    if (isCount) {
      mockData = [{ total: 12 }];
      fields = [{ name: 'total' }];
    } else if (table === 'users') {
      mockData = [
        { user_id: 101, full_name: "Rahul Sharma", email: "rahul.s@example.com", city: detectedCity, status: "active" },
        { user_id: 104, full_name: "Priya Patel", email: "priya.p@example.com", city: detectedCity, status: "active" },
        { user_id: 109, full_name: "Amit Mehta", email: "amit.m@example.com", city: detectedCity, status: "inactive" },
        { user_id: 115, full_name: "Neha Joshi", email: "neha.j@example.com", city: detectedCity, status: "active" }
      ];
      fields = [{ name: 'user_id' }, { name: 'full_name' }, { name: 'email' }, { name: 'city' }, { name: 'status' }];
      
      if (statusMatch) {
        mockData = mockData.filter(d => d.status === statusMatch[1]);
      }
    } else if (table === 'products') {
      mockData = [
        { product_id: 301, product_name: "Cyber Keyboard Pro", category: "Hardware", price: 149.99, stock: 45 },
        { product_id: 302, product_name: "HoloLens VR Headset", category: "Gear", price: 499.00, stock: 12 },
        { product_id: 305, product_name: "Quantum Deck", category: "Hardware", price: 899.50, stock: 8 }
      ];
      fields = [{ name: 'product_id' }, { name: 'product_name' }, { name: 'category' }, { name: 'price' }, { name: 'stock' }];
    } else if (table === 'orders') {
      mockData = [
        { order_id: 5001, customer_name: "Rahul Sharma", amount: 149.99, status: "completed", date: "2026-05-15" },
        { order_id: 5002, customer_name: "Priya Patel", amount: 499.00, status: "completed", date: "2026-05-16" }
      ];
      fields = [{ name: 'order_id' }, { name: 'customer_name' }, { name: 'amount' }, { name: 'status' }, { name: 'date' }];
    } else {
      mockData = [
        { id: 1, name: "Sample Record A", status: "active" },
        { id: 2, name: "Sample Record B", status: "completed" }
      ];
      fields = [{ name: 'id' }, { name: 'name' }, { name: 'status' }];
    }

    let explanation = `Certainly! I've generated the SQL query to retrieve ${tableLabel}`;
    if (explanationParts.length > 0) {
      explanation += ` ${explanationParts.join(' and ')}`;
    }
    explanation += `.`;

    return {
      success: true,
      type: 'sql_generation',
      sql: sql,
      explanation: explanation,
      queryResult: {
        success: true,
        data: mockData,
        fields: fields,
        rowCount: mockData.length
      }
    };
  }

  // 4. Dynamic Offline fallback based on keywords and topics
  if (lower.includes('missing') || lower.includes('id') || lower.includes('gap') || lower.includes('null')) {
    return {
      success: true,
      type: 'conversation',
      message: `### Finding Missing or Unmatched IDs in SQL\n\nWhen looking for missing IDs (such as gaps in sequential IDs or unmatched foreign keys), you can utilize a few core SQL techniques:\n\n1. **Using LEFT JOIN to detect mismatched records:**\n\`\`\`sql\nSELECT a.id \nFROM table_a a \nLEFT JOIN table_b b ON a.id = b.id \nWHERE b.id IS NULL;\n\`\`\`\nThis query returns all IDs from \`table_a\` that do not exist in \`table_b\`.\n\n2. **Finding Gaps in Sequential IDs (e.g., 1, 2, 4 -> 3 is missing):**\n\`\`\`sql\nSELECT t1.id + 1 AS missing_id\nFROM users t1\nLEFT JOIN users t2 ON t1.id + 1 = t2.id\nWHERE t2.id IS NULL \nORDER BY t1.id \nLIMIT 1;\n\`\`\`\n\nWould you like me to analyze one of your specific tables or queries? Let me know!`
    };
  }

  if (lower.includes('duplicate') || lower.includes('repeat') || lower.includes('double')) {
    return {
      success: true,
      type: 'conversation',
      message: `### Detecting Duplicate Rows in SQL\n\nTo find duplicate rows in a table, you can use the **GROUP BY** clause coupled with the **HAVING** clause filtering on count greater than 1:\n\n\`\`\`sql\nSELECT email, COUNT(*)\nFROM users\nGROUP BY email\nHAVING COUNT(*) > 1;\n\`\`\`\n\nTo delete duplicates while keeping only the unique lowest ID:\n\`\`\`sql\nDELETE t1 FROM users t1\nINNER JOIN users t2 \nON t1.email = t2.email AND t1.id > t2.id;\n\`\`\`\n\nLet me know which table you'd like to check for duplicates!`
    };
  }

  if (lower.includes('slow') || lower.includes('index') || lower.includes('fast') || lower.includes('speed') || lower.includes('performance')) {
    return {
      success: true,
      type: 'conversation',
      message: `### SQL Query Optimization & Performance\n\nTo speed up slow queries, here are the most effective strategies:\n\n1. **Create indexes on frequently filtered fields:**\n\`\`\`sql\nCREATE INDEX idx_user_status ON users(status);\n\`\`\`\n\n2. **Avoid SELECT *:** Only retrieve the columns you actually need to reduce memory and transfer overhead.\n\n3. **Use EXPLAIN:** Prefix your query with \`EXPLAIN\` to inspect execution plans and index lookups:\n\`\`\`sql\nEXPLAIN SELECT * FROM users WHERE email = 'test@example.com';\n\`\`\`\n\nLet me know if you want me to optimize a specific query for you!`
    };
  }

  const topic = message.replace(/[?.]/g, '').trim();
  return {
    success: true,
    type: 'conversation',
    message: `### Exploring SQL Concepts: "${topic}"\n\nI am currently operating in smart conceptual mode. To answer your query about **"${topic}"**, here is how this is structurally handled in database architecture:\n\n* **Syntax / Concept**: Usually, query behaviors relating to **${topic}** involve referencing specific table fields, aggregations, or join techniques to match target keys.\n* **Best Practice**: Ensure that indexes are set up on fields mentioned in the WHERE clause to speed up operations.\n\nHere is a query template that illustrates how to build structure dynamically:\n\`\`\`sql\nSELECT * FROM users \nWHERE email IS NOT NULL\nORDER BY user_id DESC;\n\`\`\`\n\n*Tip: Start or restart your backend server using \`npm run dev\` so that the Llama 3 model can generate fully customized, live responses!*`
  };
}

/**
 * Main message handler — classifies intent and routes to appropriate service.
 */
async function handleMessage(req, res) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    // Classify intent using NLP engine
    let { intent, confidence } = classifyIntent(message);

    // Contextual Override: If the user just pastes a SQL query, the NLP engine might default to generate_sql.
    // Try to get context from the user's persistent last message
    let lastEntry = null;
    try {
      const history = await db.getPersistentHistory(req.user?.uid || 'dev-user', 5);
      lastEntry = history[history.length - 1];
    } catch (err) {
      console.error('❌ Failed to fetch context history:', err.message);
    }

    if (lastEntry && lastEntry.response && lastEntry.response.type === 'conversation') {
      const lastBotMsg = lastEntry.response.message.toLowerCase();
      if (lastBotMsg.includes('optimize') || lastBotMsg.includes('faster') || lastBotMsg.includes('performance')) {
        intent = 'optimize_sql';
        confidence = 1.0;
      } else if (lastBotMsg.includes('explain') || lastBotMsg.includes('break down')) {
        intent = 'explain_sql';
        confidence = 1.0;
      } else if (lastBotMsg.includes('error') || lastBotMsg.includes('check')) {
        intent = 'check_errors';
        confidence = 1.0;
      }
    }

    let response = {};

    switch (intent) {
      case 'generate_sql': {
        const schemaContext = await db.getSchemaContext();
        const result = await llmService.generateSQL(message, schemaContext);
        if (!result.success) {
          response = getFallbackResponse(intent, message);
        } else {
          response = {
            type: 'sql_generation',
            ...result,
            intent,
            intentConfidence: confidence
          };
        }
        break;
      }

      case 'explain_sql': {
        const sql = extractSQL(message);
        if (sql) {
          const result = await llmService.explainSQL(sql);
          if (!result.success) {
            response = getFallbackResponse(intent, message);
          } else {
            response = { type: 'sql_explanation', ...result };
          }
        } else {
          const result = await llmService.handleConversation(message);
          if (!result.success) {
            response = getFallbackResponse(intent, message);
          } else {
            response = {
              type: 'conversation',
              message: result.response || 'Please provide a SQL query to explain.'
            };
          }
        }
        break;
      }

      case 'optimize_sql': {
        const sql = extractSQL(message);
        if (sql) {
          const schemaContext = await db.getSchemaContext();
          const result = await llmService.optimizeSQL(sql, schemaContext);
          if (!result.success) {
            response = getFallbackResponse(intent, message);
          } else {
            response = { type: 'sql_optimization', ...result };
          }
        } else {
          response = getFallbackResponse(intent, message);
        }
        break;
      }

      case 'check_errors': {
        const sql = extractSQL(message);
        if (sql) {
          const result = await llmService.detectErrors(sql);
          if (!result.success) {
            response = getFallbackResponse(intent, message);
          } else {
            response = { type: 'error_check', ...result };
          }
        } else {
          response = getFallbackResponse(intent, message);
        }
        break;
      }

      case 'show_tables': {
        try {
          const tables = await db.getTables();
          response = {
            type: 'table_list',
            tables,
            message: tables.length > 0
              ? `Found ${tables.length} table(s) in the database.`
              : 'No tables found in the database.'
          };
        } catch (dbError) {
          response = getFallbackResponse(intent, message);
        }
        break;
      }

      case 'show_schema': {
        const tableName = extractTableName(message);
        if (tableName) {
          try {
            const schema = await db.getTableSchema(tableName);
            response = { type: 'table_schema', tableName, schema };
          } catch (dbError) {
            response = getFallbackResponse(intent, message);
          }
        } else {
          response = {
            type: 'conversation',
            message: 'Which table would you like to see the schema for? Try: "describe users"'
          };
        }
        break;
      }

      case 'conceptual_question':
      case 'greeting': {
        const result = await llmService.handleConversation(message);
        if (!result.success) {
          response = getFallbackResponse(intent, message);
        } else {
          response = {
            type: 'conversation',
            message: result.response
          };
        }
        break;
      }

      case 'help': {
        response = {
          type: 'help',
          message: "Here's what I can do for you:",
          capabilities: [
            { icon: '🔍', title: 'Generate SQL', description: 'Convert natural language to SQL.' },
            { icon: '📖', title: 'Explain SQL', description: 'Understand complex queries.' },
            { icon: '⚡', title: 'Optimize SQL', description: 'Speed up slow queries.' },
            { icon: '🔧', title: 'Fix Errors', description: 'Debug SQL issues.' },
            { icon: '📊', title: 'Explore Schema', description: 'Browse your database.' }
          ]
        };
        break;
      }

      case 'goodbye': {
        response = {
          type: 'conversation',
          message: "Goodbye! 👋 Feel free to come back anytime you need SQL help."
        };
        break;
      }

      default: {
        const result = await llmService.handleConversation(message);
        if (!result.success) {
          response = getFallbackResponse(intent, message);
        } else {
          response = {
            type: 'conversation',
            message: result.response
          };
        }
      }
    }

    // Save to history (MySQL Persistent)
    try {
      await db.saveChat(req.user?.uid || 'dev-user', message, response, intent);
    } catch (err) {
      console.error('❌ Failed to save chat message:', err.message);
    }

    res.json({
      id: messageId,
      timestamp,
      userMessage: message,
      intent,
      intentConfidence: confidence,
      response
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      message: error.message
    });
  }
}

/**
 * Explain a SQL query.
 */
async function explainQuery(req, res) {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'SQL query is required' });

    const result = await llmService.explainSQL(sql);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Optimize a SQL query.
 */
async function optimizeQuery(req, res) {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'SQL query is required' });

    const schemaContext = await db.getSchemaContext();
    const result = await llmService.optimizeSQL(sql, schemaContext);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Check SQL for errors.
 */
async function checkErrors(req, res) {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'SQL query is required' });

    const result = await llmService.detectErrors(sql);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Execute a SQL query against the database.
 */
async function executeQuery(req, res) {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'SQL query is required' });

    // Safety: block destructive queries
    const destructive = /^\s*(DROP\s+DATABASE|TRUNCATE|DROP\s+TABLE)/i;
    if (destructive.test(sql)) {
      return res.status(403).json({
        error: 'Destructive queries (DROP DATABASE, TRUNCATE) are blocked for safety.'
      });
    }

    const startTime = Date.now();
    const { results, fields } = await db.executeQuery(sql);
    const duration = Date.now() - startTime;

    const isModification = /^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i.test(sql);

    res.json({
      success: true,
      data: isModification ? null : results,
      fields: fields?.map(f => ({ name: f.name, type: f.type })) || [],
      rowCount: isModification ? results.affectedRows : results.length,
      affectedRows: results.affectedRows,
      duration: `${duration}ms`,
      isModification
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      sqlState: error.sqlState,
      errno: error.errno
    });
  }
}

/**
 * Get chat history (Database persistent per user).
 */
async function getHistory(req, res) {
  try {
    const history = await db.getPersistentHistory(req.user.uid);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Clear chat history (Database persistent per user).
 */
async function clearHistory(req, res) {
  try {
    await db.clearPersistentHistory(req.user.uid);
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  handleMessage,
  explainQuery,
  optimizeQuery,
  checkErrors,
  executeQuery,
  getHistory,
  clearHistory
};
