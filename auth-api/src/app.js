const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { authRateLimiter } = require('./middleware/rateLimiter.middleware');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const db = require('./config/database');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false // Allow inline styles & scripts for administrative portal
}));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Silence browser favicon requests with 204 No Content
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve Static IT Management Portal UI
app.use(express.static(path.join(__dirname, '../public')));

// Liveness check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'NKB Authentication API & IT Management Portal',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/liveness', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Readiness check (checks database connectivity)
app.get('/health/readiness', async (req, res) => {
  try {
    const isDbConnected = await db.testConnection();
    if (isDbConnected) {
      return res.status(200).json({ status: 'READY', database: 'CONNECTED' });
    }
    return res.status(503).json({ status: 'NOT_READY', database: 'DISCONNECTED' });
  } catch (err) {
    return res.status(503).json({ status: 'NOT_READY', error: err.message });
  }
});

// Apply rate limiting to public authentication routes
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/admin', adminRoutes);

// Fallback route for Admin Portal SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(errorHandler);

module.exports = app;
