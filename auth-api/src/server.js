const app = require('./app');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('./config/database');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(` NKB Authentication REST API & Admin Portal Running`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Host: ${HOST}`);
  console.log(` Port: ${PORT}`);
  console.log(` Web Portal: http://localhost:${PORT}/`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/v1/auth/verify`);
  console.log(`=======================================================`);
});

// Graceful Shutdown Handlers
function gracefulShutdown(signal) {
  console.log(`[NKB Auth API] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[NKB Auth API] HTTP server closed.');
    try {
      if (db.pool) {
        await db.pool.end();
        console.log('[NKB Auth API] Database pool closed.');
      }
    } catch (err) {
      console.error('[NKB Auth API] Error closing DB pool:', err.message);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[NKB Auth API] Forceful shutdown initiated after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
