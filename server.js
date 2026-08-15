const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Silence favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Hostinger Database Connection Pool
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u335953510_login',
  password: process.env.DB_PASSWORD || 'NkbManufacturing25',
  database: process.env.DB_NAME || 'u335953510_login_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
try {
  pool = mysql.createPool(dbConfig);
} catch (e) {
  console.warn('MySQL pool initialization error:', e.message);
}

// In-Memory Fallback Store
const defaultHash = bcrypt.hashSync('Password123!', 10);
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
      password_hash: defaultHash,
      password_status: 'Normal',
      failed_login_attempts: 0
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
      password_hash: defaultHash,
      password_status: 'Normal',
      failed_login_attempts: 0
    }
  ],
  computers: [
    { employee_id: 'EMP-000001', computer_hostname: 'NKBMANUF' },
    { employee_id: 'EMP-000123', computer_hostname: 'NKBMANUF' }
  ],
  mappings: [
    { employee_id: 'EMP-000001', windows_username: 'earlj', windows_domain: '.' },
    { employee_id: 'EMP-000123', windows_username: 'earlj', windows_domain: '.' }
  ],
  audits: []
};

// Serve Web Portal Static Assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Health Checks
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'NKB Manufacturing Windows Authentication & IT Identity System',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/liveness', (req, res) => res.status(200).json({ status: 'UP' }));

// 1. WINDOWS CREDENTIAL PROVIDER VERIFICATION ENDPOINT
app.post(['/api/v1/auth/verify', '/api/v1/auth/verify.php'], async (req, res) => {
  const { identifier, password, computer_name } = req.body || {};
  const cleanId = String(identifier || '').trim();
  const rawPass = String(password || '');
  const hostname = String(computer_name || '').trim();

  if (!cleanId || !rawPass) {
    return res.status(400).json({
      success: false,
      error_code: 'MISSING_CREDENTIALS',
      message: 'Identifier and password are required.'
    });
  }

  try {
    let employee = null;

    if (pool) {
      try {
        const [rows] = await pool.execute(
          'SELECT * FROM employees WHERE LOWER(email) = LOWER(?) OR UPPER(employee_id) = UPPER(?) LIMIT 1',
          [cleanId, cleanId]
        );
        if (rows && rows.length > 0) employee = rows[0];
      } catch (err) {
        console.warn('MySQL Query fallback to memory:', err.message);
      }
    }

    if (!employee) {
      employee = memoryStore.employees.find(e =>
        e.email.toLowerCase() === cleanId.toLowerCase() ||
        e.employee_id.toUpperCase() === cleanId.toUpperCase()
      );
    }

    if (!employee) {
      recordAudit(cleanId, null, 'LOGIN_FAILED', 'FAILURE', hostname, 'User not found');
      return res.status(401).json({
        success: false,
        error_code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials.'
      });
    }

    if (employee.status === 'Disabled') {
      recordAudit(cleanId, employee.employee_id, 'LOGIN_REJECTED', 'FAILURE', hostname, 'Account disabled');
      return res.status(401).json({
        success: false,
        error_code: 'ACCOUNT_DISABLED',
        message: 'Account is disabled.'
      });
    }

    // Verify Password
    const isMatch = bcrypt.compareSync(rawPass, employee.password_hash);
    if (!isMatch) {
      recordAudit(cleanId, employee.employee_id, 'LOGIN_FAILED', 'FAILURE', hostname, 'Password mismatch');
      return res.status(401).json({
        success: false,
        error_code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials.'
      });
    }

    // Windows Account Mapping
    let winUser = employee.employee_id;
    let winDomain = 'NKB';

    if (pool) {
      try {
        const [mapRows] = await pool.execute(
          'SELECT * FROM windows_account_mappings WHERE employee_id = ? LIMIT 1',
          [employee.employee_id]
        );
        if (mapRows && mapRows.length > 0) {
          winUser = mapRows[0].windows_username;
          winDomain = mapRows[0].windows_domain;
        }
      } catch (e) {}
    } else {
      const m = memoryStore.mappings.find(x => x.employee_id === employee.employee_id);
      if (m) {
        winUser = m.windows_username;
        winDomain = m.windows_domain;
      }
    }

    recordAudit(cleanId, employee.employee_id, 'LOGIN_SUCCESS', 'SUCCESS', hostname, 'Windows authorized');

    return res.status(200).json({
      success: true,
      employee_id: employee.employee_id,
      email: employee.email,
      name: employee.name,
      department: employee.department,
      position: employee.position,
      role: employee.role,
      windows_username: winUser,
      windows_domain: winDomain,
      password_status: employee.password_status || 'Normal',
      authenticated_at: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: err.message
    });
  }
});

// 2. ADMIN REST APIS FOR WEB PORTAL
app.get('/api/v1/admin/employees', async (req, res) => {
  try {
    if (pool) {
      const [rows] = await pool.execute(`
        SELECT e.*, m.windows_username, m.windows_domain 
        FROM employees e 
        LEFT JOIN windows_account_mappings m ON e.employee_id = m.employee_id
      `);
      if (rows && rows.length > 0) return res.status(200).json({ employees: rows });
    }
  } catch (e) {}
  return res.status(200).json({ employees: memoryStore.employees });
});

app.post('/api/v1/admin/employees', async (req, res) => {
  const { employee_id, email, name, department, position, role, password } = req.body || {};
  if (!employee_id || !email || !password) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    if (pool) {
      await pool.execute(
        'INSERT INTO employees (employee_id, email, name, department, position, role, status, password_hash) VALUES (?, ?, ?, ?, ?, ?, "Active", ?)',
        [employee_id, email, name || '', department || '', position || '', role || 'Employee', hash]
      );
      await pool.execute(
        'INSERT INTO windows_account_mappings (employee_id, windows_username, windows_domain) VALUES (?, ?, ".")',
        [employee_id, employee_id]
      );
    }
  } catch (e) {}

  memoryStore.employees.push({
    id: memoryStore.employees.length + 1,
    employee_id,
    email,
    name: name || employee_id,
    department: department || '',
    position: position || '',
    role: role || 'Employee',
    status: 'Active',
    password_hash: hash,
    password_status: 'Normal',
    failed_login_attempts: 0
  });

  return res.status(201).json({ success: true, message: 'Employee registered successfully!' });
});

app.post('/api/v1/admin/employees/:id/reset-password', async (req, res) => {
  const empId = req.params.id;
  const { new_password } = req.body || {};
  if (!new_password) return res.status(400).json({ success: false, message: 'Password required' });

  const hash = bcrypt.hashSync(new_password, 10);
  try {
    if (pool) {
      await pool.execute('UPDATE employees SET password_hash = ?, failed_login_attempts = 0, status = "Active" WHERE employee_id = ?', [hash, empId]);
    }
  } catch (e) {}

  const emp = memoryStore.employees.find(e => e.employee_id === empId);
  if (emp) {
    emp.password_hash = hash;
    emp.failed_login_attempts = 0;
    emp.status = 'Active';
  }

  return res.status(200).json({ success: true, message: 'Password updated successfully!' });
});

app.post('/api/v1/admin/employees/:id/computers', async (req, res) => {
  const empId = req.params.id;
  const { computer_hostname } = req.body || {};
  if (!computer_hostname) return res.status(400).json({ success: false, message: 'Hostname required' });

  try {
    if (pool) {
      await pool.execute(
        'INSERT INTO employee_computers (employee_id, computer_hostname) VALUES (?, ?) ON DUPLICATE KEY UPDATE computer_hostname = VALUES(computer_hostname)',
        [empId, computer_hostname]
      );
    }
  } catch (e) {}

  memoryStore.computers.push({ employee_id: empId, computer_hostname });
  return res.status(200).json({ success: true, message: 'Computer authorized!' });
});

app.get('/api/v1/admin/audits', (req, res) => {
  res.status(200).json({ logs: memoryStore.audits });
});

function recordAudit(idUsed, empId, eventType, outcome, compName, details) {
  memoryStore.audits.unshift({
    id: memoryStore.audits.length + 1,
    identifier_used: idUsed,
    employee_id: empId,
    event_type: eventType,
    outcome: outcome,
    computer_name: compName,
    details: details,
    created_at: new Date().toISOString()
  });
}

// Fallback to Index UI
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// START SERVER (Listening on 0.0.0.0 and PORT for Hostinger)
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[Hostinger] NKB Keymaster Server Running on port ${PORT}`);
});
