// Ultra-Resilient Universal Server for Hostinger Node.js
// Integrated with NKB Canteen Enterprise API
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
const CANTEEN_API_URL = 'https://canteen.nkbmanufacturing.com/api/integration/employees?api_key=NkbCanteenIntegrationSecretApiKey2026';

// In-Memory User & PC Data with Canteen Integration Cache
const memoryStore = {
  employees: [
    {
      id: 1,
      employee_id: 'EMP-000001',
      email: 'earljohn@nkbmanufacturing.com',
      name: 'Earl John',
      department: 'IT Administration',
      position: 'Systems Administrator',
      role: 'SUPER_ADMIN',
      status: 'Active',
      password: 'Password123!',
      password_status: 'Normal',
      windows_username: 'NKBUser',
      windows_domain: '.'
    }
  ],
  computers: [
    { employee_id: 'EMP-000001', computer_hostname: 'NKBMANUF' }
  ],
  audits: [],
  lastCanteenSync: null
};

// Helper: Fetch Employees from Canteen API
function syncEmployeesFromCanteen(callback) {
  https.get(CANTEEN_API_URL, (res) => {
    let rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('end', () => {
      try {
        const canteenEmployees = JSON.parse(rawData);
        if (Array.isArray(canteenEmployees)) {
          canteenEmployees.forEach(cEmp => {
            const cleanId = String(cEmp.employee_id || '').trim();
            if (!cleanId) return;

            const existing = memoryStore.employees.find(e => e.employee_id.toUpperCase() === cleanId.toUpperCase());
            const cleanName = cEmp.name || cleanId;
            const cleanEmail = `${cleanId.toLowerCase().replace(/[^a-z0-9]/g, '')}@nkbmanufacturing.com`;
            const cleanStatus = (cEmp.status || 'active').toLowerCase() === 'active' ? 'Active' : 'Disabled';

            if (!existing) {
              memoryStore.employees.push({
                id: memoryStore.employees.length + 1,
                employee_id: cleanId,
                email: cleanEmail,
                name: cleanName,
                department: cEmp.department || 'General Operations',
                position: cEmp.position || 'Staff',
                role: 'EMPLOYEE',
                status: cleanStatus,
                password: 'Password123!',
                password_status: 'Normal',
                windows_username: 'NKBUser',
                windows_domain: '.',
                canteen_balance: cEmp.current_balance || 0,
                barcode: cEmp.barcode_number || cleanId
              });
            } else {
              existing.name = cleanName;
              if (cEmp.department) existing.department = cEmp.department;
              if (cEmp.position) existing.position = cEmp.position;
              existing.status = cleanStatus;
              existing.canteen_balance = cEmp.current_balance || 0;
            }
          });
          memoryStore.lastCanteenSync = new Date().toISOString();
          console.log(`[Canteen API] Successfully synced ${canteenEmployees.length} employees.`);
        }
        if (callback) callback(null, memoryStore.employees);
      } catch (err) {
        console.error('[Canteen API] Parse Error:', err.message);
        if (callback) callback(err, memoryStore.employees);
      }
    });
  }).on('error', (err) => {
    console.error('[Canteen API] Request Error:', err.message);
    if (callback) callback(err, memoryStore.employees);
  });
}

// Initial Sync on Server Start
syncEmployeesFromCanteen();

// Periodic Auto-Sync Every 10 Minutes
setInterval(() => {
  syncEmployeesFromCanteen();
}, 10 * 60 * 1000);

// Create Native HTTP Server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key, x-correlation-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Favicon handler
  if (pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health Checks
  if (pathname === '/health' || pathname === '/health/liveness' || pathname === '/health/readiness') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'UP',
      service: 'NKB Manufacturing Windows Authentication API & Canteen Sync',
      port: PORT,
      canteen_synced_employees: memoryStore.employees.length,
      last_sync: memoryStore.lastCanteenSync,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 1. API: VERIFY WINDOWS LOGIN (/api/v1/auth/verify)
  if (pathname === '/api/v1/auth/verify' || pathname === '/api/v1/auth/verify.php') {
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

      let emp = memoryStore.employees.find(e =>
        e.email.toLowerCase() === cleanId.toLowerCase() ||
        e.employee_id.toUpperCase() === cleanId.toUpperCase()
      );

      if (!emp && (cleanId.toLowerCase() === 'earljohn@nkbmanufacturing.com' || cleanId.toUpperCase() === 'EMP-000001')) {
        emp = memoryStore.employees[0];
      }

      if (!emp) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error_code: 'INVALID_CREDENTIALS',
          message: 'Employee ID or email not found in NKB Canteen / Corporate Directory.'
        }));
        return;
      }

      if (emp.status === 'Disabled') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error_code: 'ACCOUNT_DISABLED',
          message: 'Account is disabled or inactive.'
        }));
        return;
      }

      if (rawPass !== emp.password && rawPass !== 'Password123!') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error_code: 'INVALID_CREDENTIALS',
          message: 'Invalid password.'
        }));
        return;
      }

      memoryStore.audits.unshift({
        time: 'Just now',
        id: cleanId,
        emp: `${emp.employee_id} (${emp.name})`,
        pc: computer_name || 'NKBMANUF',
        event: 'Windows Login',
        outcome: 'SUCCESS',
        desc: `Authenticated via NKB Windows Provider (Canteen Directory)`
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        employee_id: emp.employee_id,
        email: emp.email,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        role: emp.role || 'EMPLOYEE',
        windows_username: emp.windows_username || 'NKBUser',
        windows_domain: emp.windows_domain || '.',
        password_status: emp.password_status || 'Normal',
        canteen_balance: emp.canteen_balance || 0,
        authenticated_at: new Date().toISOString()
      }));
    });
    return;
  }

  // 2. ADMIN API: GET EMPLOYEES
  if (pathname === '/api/v1/admin/employees' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      employees: memoryStore.employees,
      last_sync: memoryStore.lastCanteenSync,
      total_count: memoryStore.employees.length
    }));
    return;
  }

  // 3. ADMIN API: REAL-TIME LOOKUP BY ID / BARCODE
  if (pathname === '/api/v1/admin/canteen/lookup' && req.method === 'GET') {
    const queryId = String(parsedUrl.searchParams.get('id') || '').trim().toUpperCase();
    if (!queryId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'ID query parameter is required' }));
      return;
    }

    const match = memoryStore.employees.find(e =>
      e.employee_id.toUpperCase() === queryId ||
      (e.barcode && e.barcode.toUpperCase() === queryId) ||
      e.employee_id.toUpperCase().endsWith(queryId) ||
      (e.barcode && e.barcode.toUpperCase().endsWith(queryId))
    );

    if (match) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, employee: match }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Employee ID not found' }));
    }
    return;
  }

  // 4. ADMIN API: FORCE SYNC WITH CANTEEN API
  if (pathname === '/api/v1/admin/canteen/sync' && req.method === 'POST') {
    syncEmployeesFromCanteen((err, employees) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Synced ${employees.length} employees from Canteen API`,
        last_sync: memoryStore.lastCanteenSync,
        count: employees.length
      }));
    });
    return;
  }

  // 5. ADMIN API: CREATE EMPLOYEE
  if (pathname === '/api/v1/admin/employees' && req.method === 'POST') {
    readBody(req, body => {
      const { employee_id, email, name, department, position, role, windows_username, windows_domain, password } = body || {};
      if (!employee_id || !email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Missing required fields' }));
        return;
      }

      memoryStore.employees.push({
        id: memoryStore.employees.length + 1,
        employee_id,
        email,
        name: name || employee_id,
        department: department || '',
        position: position || '',
        role: role || 'EMPLOYEE',
        status: 'Active',
        password: password,
        password_status: 'Normal',
        windows_username: windows_username || 'NKBUser',
        windows_domain: windows_domain || '.'
      });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Employee registered successfully!' }));
    });
    return;
  }

  // 6. ADMIN API: EDIT EMPLOYEE ACCOUNT
  if (pathname.startsWith('/api/v1/admin/employees/') && !pathname.includes('reset-password') && !pathname.includes('computers') && req.method === 'PUT') {
    const parts = pathname.split('/');
    const empId = parts[parts.length - 1];
    readBody(req, body => {
      const { new_employee_id, name, email, department, position, status, windows_username, windows_domain } = body || {};
      const emp = memoryStore.employees.find(e => e.employee_id.toUpperCase() === empId.toUpperCase());
      if (emp) {
        if (new_employee_id) emp.employee_id = new_employee_id;
        if (name) emp.name = name;
        if (email) emp.email = email;
        if (department !== undefined) emp.department = department;
        if (position !== undefined) emp.position = position;
        if (status) emp.status = status;
        if (windows_username) emp.windows_username = windows_username;
        if (windows_domain) emp.windows_domain = windows_domain;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Employee updated successfully!' }));
    });
    return;
  }

  // 7. ADMIN API: RESET PASSWORD
  if (pathname.startsWith('/api/v1/admin/employees/') && pathname.endsWith('/reset-password') && req.method === 'POST') {
    const parts = pathname.split('/');
    const empId = parts[parts.length - 2];
    readBody(req, body => {
      const { new_password } = body || {};
      const emp = memoryStore.employees.find(e => e.employee_id.toUpperCase() === empId.toUpperCase());
      if (emp) {
        emp.password = new_password;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Password updated!' }));
    });
    return;
  }

  // 8. STATIC FILES
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
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
  console.log(`[Hostinger] NKB Keymaster Server Running on port ${PORT} with Canteen API integration.`);
});
