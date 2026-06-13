const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const chatRoutes = require('./routes/chatRoutes');
const dbRoutes = require('./routes/dbRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 50,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ── Routes ──────────────────────────────────────────────────────────────────
// Public — no auth required (used for status indicators in the UI)
app.use('/api/health', healthRoutes);

app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/db',   authMiddleware, dbRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SQL Assistant Chatbot API',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      database: '/api/db',
      health: '/api/health'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const { initializeDatabase } = require('./config/database');

app.listen(PORT, async () => {
  console.log(`\n🚀 SQL Assistant Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 LLM Provider: Local Ollama (llama3)`);
  console.log(`🗄️  Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);

  // Initialize and seed sample database tables
  await initializeDatabase();
  console.log('✅ Local Database checks complete.\n');
});

module.exports = app;
