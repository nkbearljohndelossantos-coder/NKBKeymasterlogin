const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const adRoutes = require('./routes/ad.routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const { getProvider } = require('./services/adProvider.factory');

const app = express();

app.use(helmet());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Liveness check (process alive)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'AD Identity Service',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/liveness', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Readiness check (dependencies available)
app.get('/health/readiness', async (req, res) => {
  try {
    const readyStatus = await getProvider().checkReadiness();
    if (readyStatus.ready) {
      return res.status(200).json({
        status: 'READY',
        provider: readyStatus.provider,
        domain: readyStatus.domain
      });
    }
    return res.status(503).json({
      status: 'NOT_READY',
      error: readyStatus.error || 'Provider initialization pending'
    });
  } catch (err) {
    return res.status(503).json({ status: 'NOT_READY', error: err.message });
  }
});

app.use('/internal/ad', adRoutes);

app.use(errorHandler);

module.exports = app;
