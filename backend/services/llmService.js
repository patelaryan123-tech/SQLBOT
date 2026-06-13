const axios = require('axios');
require('dotenv').config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * Check if local Ollama service is available.
 * Replaces isGeminiAvailable for completely offline functionality.
 */
async function isOllamaAvailable() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
    const models = response.data.models || [];
    const hasLlama = models.some(m => m.name.includes(OLLAMA_MODEL));
    
    return { 
      available: true, 
      model: OLLAMA_MODEL,
      installed: hasLlama
    };
  } catch (error) {
    return { 
      available: false, 
      error: `Ollama not reachable at ${OLLAMA_BASE_URL}. Ensure Ollama is running locally.`
    };
  }
}

/**
 * Send a prompt to the local Ollama LLM.
 * This centralizes all AI queries for offline use.
 */
async function queryLLM(prompt, systemPrompt = '', options = {}) {
  try {
    // Ollama /api/generate combines system and user prompts into one prompt for some models,
    // or we can use /api/chat. The user specifically requested /api/generate.
    const fullPrompt = systemPrompt ? `System: ${systemPrompt}\n\nUser: ${prompt}` : prompt;

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: fullPrompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.2,
      }
    }, { timeout: options.timeout || 120000 });

    return {
      success: true,
      response: response.data.response,
      model: OLLAMA_MODEL
    };
  } catch (error) {
    console.error('Ollama query error:', error.message);
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
