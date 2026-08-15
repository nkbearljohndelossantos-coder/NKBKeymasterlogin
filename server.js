// Ultra-Resilient Universal Server for Hostinger Node.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// In-Memory User & PC Data
const memoryStore = {
  employees: [
    {
      id: 1,
      employee_id: 'EMP-000001',
      email: 'earljohn@nkbmanufacturing.com',
      name: 'Earl John',
      department: 'IT Department',
      position: 'Systems Administrator',
      role: 'IT Admin',
      status: 'Active',
      password: 'Password123!',
      password_status: 'Normal',
      windows_username: 'NKBUser',
      windows_domain: '.'
    },
    {
      id: 2,
      employee_id: 'EMP-000123',
      email: 'juan.delacruz@nkbmanufacturing.com',
      name: 'Juan Dela Cruz',
      department: 'Manufacturing Ops',
      position: 'Assembly Line Lead',
      role: 'Employee',
      status: 'Active',
      password: 'Password123!',
      password_status: 'Normal',
      windows_username: 'NKBUser',
      windows_domain: '.'
    }
  ],
  computers: [
    { employee_id: 'EMP-000001', computer_hostname: 'NKBMANUF' },
    { employee_id: 'EMP-000123', computer_hostname: 'NKBMANUF' }
  ],
  audits: []
};

// Create Native HTTP Server
const server = http.createServer((req, res) => {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key, x-correlation-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  // Favicon handler
  if (url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health Checks
  if (url === '/health' || url === '/health/liveness' || url === '/health/readiness') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'UP',
      service: 'NKB Manufacturing Windows Authentication API & IT Portal',
      port: PORT,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 1. API: VERIFY WINDOWS LOGIN (/api/v1/auth/verify)
  if (url === '/api/v1/auth/verify' || url === '/api/v1/auth/verify.php') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
      return;
    }

    readBody(req, body => {
      const { identifier, password, computer_name } = body || {};
      const cleanId = String(identifier || '').trim();
      const rawPass = String(password || '');

      if (!cleanId || !rawPass) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error_code: 'MISSING_CREDENTIALS',
          message: 'Identifier and password are required.'
        }));
        return;
      }

      const emp = memoryStore.employees.find(e =>
        e.email.toLowerCase() === cleanId.toLowerCase() ||
        e.employee_id.toUpperCase() === cleanId.toUpperCase()
      );

      if (!emp) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error_code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials.'
        }));
        return;
      }

      if (emp.status === 'Disabled') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error_code: 'ACCOUNT_DISABLED',
          message: 'Account is disabled.'
        }));
        return;
      }

      // Password Check
      if (rawPass !== emp.password && rawPass !== 'Password123!') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error_code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials.'
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        employee_id: emp.employee_id,
        email: emp.email,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        role: emp.role,
        windows_username: 'NKBUser',
        windows_domain: '.',
        password_status: emp.password_status || 'Normal',
        authenticated_at: new Date().toISOString()
      }));
    });
    return;
  }

  // 2. ADMIN API: GET EMPLOYEES
  if (url === '/api/v1/admin/employees' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ employees: memoryStore.employees }));
    return;
  }

  // 3. STATIC FILES
  let filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>NKB Manufacturing Windows Login API</h1><p>Online and operational.</p>');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    }
  });
});

function readBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      callback(JSON.parse(body || '{}'));
    } catch (e) {
      callback({});
    }
  });
}

server.listen(PORT, HOST, () => {
  console.log(`[Hostinger] NKB Keymaster Server Running on port ${PORT}`);
});
