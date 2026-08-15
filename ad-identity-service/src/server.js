const app = require('./app');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` AD Identity Service Running (Privileged AD Boundary)`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Provider: ${process.env.AD_PROVIDER || 'mock'}`);
  console.log(` Port: ${PORT}`);
  console.log(`=======================================================`);
});

// Graceful Shutdown Handlers
function gracefulShutdown(signal) {
  console.log(`[AD Identity Service] Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('[AD Identity Service] HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[AD Identity Service] Forceful shutdown initiated after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
