/**
 * NLP Engine - Intent classification and entity extraction
 * Uses keyword matching and pattern recognition for fast local processing.
 */

// Intent patterns for classification
const INTENT_PATTERNS = {
  generate_sql: {
    keywords: ['show', 'find', 'get', 'list', 'select', 'fetch', 'retrieve', 'display', 'query',
               'give me', 'what are', 'how many', 'count', 'total', 'average', 'sum',
               'insert', 'add', 'create', 'update', 'modify', 'change', 'delete', 'remove',
               'join', 'combine', 'merge', 'filter', 'sort', 'order', 'group',
               'between', 'greater', 'less', 'maximum', 'minimum', 'top', 'bottom',
               'all records', 'all data', 'all rows', 'table data', 'from table'],
    weight: 1.0
  },
  explain_sql: {
    keywords: ['explain', 'what does', 'meaning of', 'break down', 'understand', 'describe query',
               'how does this query', 'what is this query', 'analyze query', 'interpret'],
    patterns: [/explain\s+(this|the)?\s*(sql|query)/i, /what\s+does\s+.*(select|insert|update|delete)/i],
    weight: 1.2
  },
  optimize_sql: {
    keywords: ['optimize', 'improve', 'faster', 'performance', 'speed up', 'slow query',
               'make it faster', 'efficiency', 'tune', 'index suggestion'],
    patterns: [/optimi[zs]e/i, /make\s+(it\s+)?fast/i, /improve\s+performance/i],
    weight: 1.2
  },
  check_errors: {
    keywords: ['check', 'error', 'fix', 'debug', 'wrong', 'syntax', 'validate', 'correct',
               'issue', 'problem', 'bug', 'mistake', 'not working'],
    patterns: [/check\s+(this\s+)?(sql|query)/i, /fix\s+(this\s+)?(sql|query)/i, /what.s\s+wrong/i],
    weight: 1.2
  },
  show_tables: {
    keywords: ['show tables', 'list tables', 'what tables', 'available tables', 'database tables',
               'table names', 'all tables', 'show schema', 'database structure'],
    weight: 1.5
  },
  show_schema: {
    keywords: ['describe table', 'table structure', 'table schema', 'columns of', 'fields of',
               'table info', 'table details', 'column names', 'show columns'],
    patterns: [/describe\s+\w+/i, /schema\s+(of|for)\s+\w+/i, /structure\s+(of|for)\s+\w+/i],
    weight: 1.5
  },
  greeting: {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
               'howdy', 'greetings', 'sup', 'what\'s up', 'hii', 'hiii', 'yo'],
    weight: 0.8
  },
  help: {
    keywords: ['help', 'how to use', 'what can you do', 'capabilities', 'features',
               'guide', 'tutorial', 'instructions', 'how do i'],
    weight: 0.9
  },
  goodbye: {
    keywords: ['bye', 'goodbye', 'see you', 'thanks', 'thank you', 'quit', 'exit'],
    weight: 0.8
  },
  conceptual_question: {
    keywords: ['vs', 'difference', 'what is', 'what are', 'how to', 'why do', 'concept', 'explain the difference', 'tell me about', 'tutorial', 'rank', 'dense_rank', 'lead', 'lag', 'window function'],
    patterns: [/\bvs\b/i, /\bdifference\b/i, /\bwhat\s+(is|are)\b/i, /\bhow\s+to\b/i, /\brank\b/i, /\bdense\s+rank\b/i],
    weight: 1.5
  }
};

/**
 * Classify the intent of a user message.
 */
function classifyIntent(message) {
  const lowerMessage = message.toLowerCase().trim();
  const scores = {};

  // Check if the message contains SQL code
  const hasSQLCode = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|SHOW|DESCRIBE)\b/i.test(message);

  for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;

    // Keyword matching
    for (const keyword of config.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        score += config.weight;
      }
    }

    // Pattern matching
    if (config.patterns) {
      for (const pattern of config.patterns) {
        if (pattern.test(lowerMessage)) {
          score += config.weight * 1.5;
        }
      }
    }

    scores[intent] = score;
  }

  // If message contains SQL code and asks to explain/optimize/check
  if (hasSQLCode) {
    if (scores.explain_sql > 0) scores.explain_sql *= 2;
    else if (scores.optimize_sql > 0) scores.optimize_sql *= 2;
    else if (scores.check_errors > 0) scores.check_errors *= 2;
    else {
      // Default: if SQL is present and no specific action, assume check errors
      scores.check_errors += 0.5;
    }
  }

  // Find the highest scoring intent
  let maxScore = 0;
  let bestIntent = 'generate_sql'; // default intent

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent;
    }
  }

  // If no keywords matched at all, default based on content
  if (maxScore === 0) {
    if (hasSQLCode) bestIntent = 'explain_sql';
    else if (lowerMessage.length < 10) bestIntent = 'greeting';
    else bestIntent = 'generate_sql';
  }

  return {
    intent: bestIntent,
    confidence: Math.min(maxScore / 3, 1),
    scores
  };
}

/**
 * Extract entities from the user message (table names, column names, etc.).
 */
function extractEntities(message) {
  const entities = {
    tables: [],
    columns: [],
    values: [],
    conditions: [],
    orderBy: null,
    limit: null
  };

  // Extract quoted values
  const quotedValues = message.match(/["']([^"']+)["']/g);
  if (quotedValues) {
    entities.values = quotedValues.map(v => v.replace(/["']/g, ''));
  }

  // Extract numbers
  const numbers = message.match(/\b\d+\b/g);
  if (numbers) {
    entities.values.push(...numbers);
  }

  // Extract LIMIT
  const limitMatch = message.match(/\b(top|first|last|limit)\s+(\d+)/i);
  if (limitMatch) {
    entities.limit = parseInt(limitMatch[2]);
  }

  // Extract ORDER BY hints
  const orderMatch = message.match(/\b(sort|order)\s+(by\s+)?(\w+)\s*(asc|desc)?/i);
  if (orderMatch) {
    entities.orderBy = {
      column: orderMatch[3],
      direction: (orderMatch[4] || 'ASC').toUpperCase()
    };
  }

  return entities;
}

/**
 * Extract SQL code from a message.
 */
function extractSQL(message) {
  // Try to find SQL in code blocks
  const codeBlockMatch = message.match(/```sql?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try to find raw SQL statements
  const sqlMatch = message.match(/(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|SHOW|DESCRIBE|DROP|TRUNCATE)\s+[\s\S]+/i);
  if (sqlMatch) return sqlMatch[0].trim();

  return null;
}

/**
 * Extract table name from a message.
 */
function extractTableName(message) {
  const patterns = [
    /(?:describe|schema|structure|columns|fields)\s+(?:of\s+|for\s+)?[`"']?(\w+)[`"']?/i,
    /(?:table)\s+[`"']?(\w+)[`"']?/i,
    /[`"'](\w+)[`"']\s+(?:table|schema|structure)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  return null;
}

module.exports = {
  classifyIntent,
  extractEntities,
  extractSQL,
  extractTableName,
  INTENT_PATTERNS
};
