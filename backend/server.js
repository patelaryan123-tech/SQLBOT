const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
require('dotenv').config();

const chatRoutes   = require('./routes/chatRoutes');
const dbRoutes     = require('./routes/dbRoutes');
const healthRoutes = require('./routes/healthRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const { authMiddleware }         = require('./middleware/authMiddleware');
const { sanitizeInputs }         = require('./middleware/sanitize');       // Rule #2
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler'); // Rule #5

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security Rule #5: Helmet sets safe HTTP headers & hides server fingerprint
app.use(helmet({
  // Hide X-Powered-By so attackers can't fingerprint the framework
  hidePoweredBy: true,
  // Content-Security-Policy: restrict sources aggressively
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"]
    }
  },
  // HSTS — force HTTPS even if someone types http://
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));

// ── CORS — only allow the known frontend origin ───────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// ── Logging (dev only — no sensitive data logged in production) ───────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // In production use combined format to a log file — omit req bodies
  app.use(morgan('combined'));
}

// ── Body parsing — MUST come before XSS and HPP ──────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Security Rule #2: XSS-clean (strips script tags from parsed body) ─────────
app.use(xss());

// ── Prevent HTTP parameter pollution ─────────────────────────────────────────
app.use(hpp());

// ── Global rate limiter (broad protection across all /api/ routes) ────────────
// Security Rule #3: Limit Login Attempts (per-route limiters applied in routes)
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', globalLimiter);

// ── Security Rule #2: Deep input sanitization (null bytes, bidi, injection) ───
app.use('/api/', sanitizeInputs);

// ── Routes ───────────────────────────────────────────────────────────────────
// Public — no auth required
app.use('/api/health', healthRoutes);

// Protected routes — auth middleware applied first, then routes handle their
// own fine-grained validation and rate-limiting per endpoint.
app.use('/api/chat',   authMiddleware, chatRoutes);
app.use('/api/db',     authMiddleware, dbRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);

// Root info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'QueryMind AI — SQL Assistant API',
    version: '1.0.0'
    // Intentionally omitting internal endpoint listing (Rule #5)
  });
});

// ── Security Rule #5: 404 handler (before global error handler) ───────────────
app.use(notFoundHandler);

// ── Security Rule #5: Global error handler (hides internals from clients) ─────
app.use(errorHandler);

// ── Database initialisation ───────────────────────────────────────────────────
const { initializeDatabase } = require('./config/database');

app.listen(PORT, async () => {
  console.log(`\n🚀 QueryMind AI Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 LLM Provider: Local Ollama (llama3)`);
  // Rule #5: never log DB credentials — only host info
  console.log(`🗄️  Database host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  console.log(`🔒 Security stack: Helmet ✓ | XSS-clean ✓ | HPP ✓ | Rate-limit ✓ | Deep-sanitize ✓`);

  await initializeDatabase();
  console.log('✅ Local Database checks complete.\n');
});

module.exports = app;
