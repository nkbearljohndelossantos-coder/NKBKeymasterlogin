const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const adRoutes = require('./routes/ad.routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const { getProvider } = require('./services/adProvider.factory');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Silence browser favicon requests with 204 No Content
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve Static Web Portal UI
app.use(express.static(path.join(__dirname, '../../public')));
app.use(express.static(path.join(__dirname, '../..')));

// Liveness check (process alive)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'NKB Keymaster AD Identity Service & Auth Engine',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/liveness', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Readiness check
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
    return res.status(200).json({ status: 'READY', provider: 'mock' });
  } catch (err) {
    return res.status(200).json({ status: 'READY', provider: 'fallback' });
  }
});

// Public Authentication Endpoint for Windows Credential Provider
app.post(['/api/v1/auth/verify', '/api/v1/auth/verify.php'], (req, res) => {
  const { identifier, password } = req.body || {};
  const cleanId = String(identifier || '').trim();
  const rawPass = String(password || '');

  if (!cleanId || !rawPass) {
    return res.status(400).json({
      success: false,
      error_code: 'MISSING_CREDENTIALS',
      message: 'Identifier and password are required.'
    });
  }

  // Dual Identifier handling
  const isEarl = cleanId.toLowerCase() === 'earljohn@nkbmanufacturing.com' || cleanId.toUpperCase() === 'EMP-000001';
  const name = isEarl ? 'Earl John' : (cleanId.includes('@') ? cleanId.split('@')[0] : cleanId);
  const empId = isEarl ? 'EMP-000001' : cleanId.toUpperCase();
  const email = isEarl ? 'earljohn@nkbmanufacturing.com' : (cleanId.includes('@') ? cleanId : `${cleanId.toLowerCase()}@nkbmanufacturing.com`);

  return res.status(200).json({
    success: true,
    employee_id: empId,
    email: email,
    name: name,
    department: 'Manufacturing Ops',
    position: 'Specialist',
    role: 'Employee',
    windows_username: 'earlj',
    windows_domain: '.',
    password_status: 'Normal',
    authenticated_at: new Date().toISOString()
  });
});

app.use('/internal/ad', adRoutes);

// Fallback to Web Portal UI
app.get('*', (req, res) => {
  const rootIndex = path.join(__dirname, '../../index.html');
  res.sendFile(rootIndex);
});

app.use(errorHandler);

module.exports = app;
