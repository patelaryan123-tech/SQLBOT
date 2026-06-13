import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = `${API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 600000,
  headers: { 'Content-Type': 'application/json' }
});

// ── API Endpoints ──────────────────────────────────────────────────────────────

// Chat
export const sendMessage     = (message) => api.post('/chat/message', { message });
export const explainSQL      = (sql)     => api.post('/chat/explain', { sql });
export const optimizeSQL     = (sql)     => api.post('/chat/optimize', { sql });
export const checkErrors     = (sql)     => api.post('/chat/check-errors', { sql });
export const executeSQL      = (sql)     => api.post('/chat/execute', { sql });
export const getChatHistory  = ()        => api.get('/chat/history');
export const clearChatHistory = ()       => api.delete('/chat/history');

// Database
export const getTables       = ()        => api.get('/db/tables');
export const getDatabases    = ()        => api.get('/db/databases');
export const switchDatabase  = (dbName) => api.post('/db/switch', { dbName });
export const getTableSchema  = (tableName) => api.get(`/db/schema/${tableName}`);
export const testDBConnection = ()      => api.get('/db/test');

// Health
export const getHealthStatus = ()        => api.get('/health');

export default api;
