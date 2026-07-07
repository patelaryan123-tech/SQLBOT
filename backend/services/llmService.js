const axios = require('axios');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'; // Groq official stable fast model

/**
 * Check if local Ollama service is available.
 * (Now mocked for Groq Cloud functionality).
 */
async function isOllamaAvailable() {
  return { 
    available: true, 
    model: GROQ_MODEL,
    installed: true
  };
}

/**
 * Send a prompt to the Groq Cloud LLM.
 * This centralizes all AI queries.
 */
async function queryLLM(prompt, systemPrompt = '', options = {}) {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY environment variable is not defined.");
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: GROQ_MODEL,
      messages: messages,
      temperature: options.temperature || 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: options.timeout || 60000
    });

    return {
      success: true,
      response: response.data.choices[0].message.content,
      model: GROQ_MODEL
    };
  } catch (error) {
    console.error('Groq query error:', error.response ? error.response.data : error.message);
    return {
      success: false,
      error: error.message,
      response: null
    };
  }
}

/**
 * Generate SQL from natural language using local Llama 3.
 */
async function generateSQL(userQuery, schemaContext) {
  const systemPrompt = `You are an expert SQL query generator. Convert natural language into MySQL.
RULES:
1. Generate ONLY valid MySQL syntax.
2. Use proper JOIN syntax when relating tables.
3. Return your response in this exact JSON format:
{
  "sql": "THE SQL QUERY HERE",
  "explanation": "Brief explanation",
  "confidence": 0.95
}`;

  const prompt = `Database Schema:\n${schemaContext}\n\nUser Request: "${userQuery}"\n\nGenerate MySQL query. Respond ONLY with valid JSON.`;

  const result = await queryLLM(prompt, systemPrompt, { temperature: 0.1 });

  if (!result.success) return { success: false, error: result.error };

  try {
    // Extract JSON from potential prose
    let jsonStr = result.response;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
    
    const parsed = JSON.parse(jsonStr);
    return {
      success: true,
       ...parsed,
      model: result.model
    };
  } catch (parseError) {
    const sqlMatch = result.response.match(/```sql\s*([\s\S]*?)```/i) || result.response.match(/(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|SHOW|DESCRIBE)[\s\S]+/i);
    return {
      success: true,
      sql: sqlMatch ? (sqlMatch[1] || sqlMatch[0]).trim() : null,
      explanation: 'Query generated (offline fallback parser).',
      confidence: 0.6,
      model: result.model
    };
  }
}

/**
 * Explain a SQL query.
 */
async function explainSQL(sqlQuery) {
  const systemPrompt = `Explain SQL queries in simple language. JSON format: { "explanation": "...", "breakdown": [], "concepts": [] }`;
  const prompt = `Explain this SQL query:\n\n${sqlQuery}`;
  const result = await queryLLM(prompt, systemPrompt, { temperature: 0.3 });
  if (!result.success) return { success: false, error: result.error };
  try {
    let jsonStr = result.response;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
    return { success: true, ...JSON.parse(jsonStr) };
  } catch {
    return { success: true, explanation: result.response };
  }
}

/**
 * Optimize a SQL query.
 */
async function optimizeSQL(sqlQuery, schemaContext) {
  const systemPrompt = `Analyze and suggest optimizations for MySQL. JSON format: { "optimizedQuery": "...", "improvements": [] }`;
  const prompt = `Schema: ${schemaContext}\nOptimize: ${sqlQuery}`;
  const result = await queryLLM(prompt, systemPrompt, { temperature: 0.2 });
  if (!result.success) return { success: false, error: result.error };
  try {
    let jsonStr = result.response;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
    return { success: true, ...JSON.parse(jsonStr) };
  } catch {
    return { success: true, optimizedQuery: sqlQuery };
  }
}

/**
 * Detect syntax errors in SQL.
 */
async function detectErrors(sqlQuery) {
  const systemPrompt = `Check MySQL syntax errors. JSON format: { "hasErrors": boolean, "errors": [], "correctedQuery": "..." }`;
  const prompt = `Check: ${sqlQuery}`;
  const result = await queryLLM(prompt, systemPrompt, { temperature: 0.1 });
  if (!result.success) return { success: false, error: result.error };
  try {
    let jsonStr = result.response;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
    return { success: true, ...JSON.parse(jsonStr) };
  } catch {
    return { success: true, hasErrors: false };
  }
}

/**
 * Handle general conversation.
 */
async function handleConversation(userMessage) {
  const systemPrompt = `You are a friendly SQL assistant. Respond concisely.`;
  return await queryLLM(userMessage, systemPrompt, { temperature: 0.7 });
}

module.exports = {
  isOllamaAvailable,
  queryLLM,
  generateSQL,
  explainSQL,
  optimizeSQL,
  detectErrors,
  handleConversation
};