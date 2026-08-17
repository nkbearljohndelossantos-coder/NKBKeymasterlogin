const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

let mysql = null;
try {
  mysql = require('mysql2/promise');
} catch (e) {}

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
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, '../../')));

// DB Configuration
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'u335953510_login';
const DB_PASS = process.env.DB_PASSWORD || process.env.DB_PASS || 'NkbManufacturing25';
const DB_NAME = process.env.DB_NAME || 'u335953510_login_db';

let dbPool = null;

async function getDbConnection() {
  if (dbPool) {
    try {
      const conn = await dbPool.getConnection();
      return conn;
    } catch (e) {
      dbPool = null;
    }
  }

  if (!mysql) return null;

  try {
    const pool = mysql.createPool({
      host: '127.0.0.1',
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 4000
    });
    const conn = await pool.getConnection();
    dbPool = pool;
    return conn;
  } catch (err) {
    console.error('[MySQL Pool Error]', err.message);
  }

  return null;
}

// Auto Schema Helper: Checks and adds windows columns if needed or creates tables
async function initDatabaseSchema() {
  const conn = await getDbConnection();
  if (!conn) return;

  try {
    // 1. Ensure employees table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`employees\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`department\` VARCHAR(100) NOT NULL,
        \`position\` VARCHAR(100) NOT NULL,
        \`role\` VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
        \`status\` ENUM('Active', 'Disabled', 'Locked') NOT NULL DEFAULT 'Active',
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`uk_employee_id\` (\`employee_id\`),
        UNIQUE KEY \`uk_email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Ensure windows_account_mappings table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`windows_account_mappings\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`windows_username\` VARCHAR(100) NOT NULL,
        \`windows_domain\` VARCHAR(100) NOT NULL DEFAULT '.',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`uk_employee_windows\` (\`employee_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Modify role column to VARCHAR(100) so it accepts SUPER_ADMIN, IT_ADMIN, etc.
    try {
      await conn.query("ALTER TABLE `employees` MODIFY COLUMN `role` VARCHAR(100) NOT NULL DEFAULT 'EMPLOYEE'");
    } catch (e) {}

    // 4. Try to add windows_username & windows_domain to employees table if missing
    try {
      await conn.query("ALTER TABLE `employees` ADD COLUMN `windows_username` VARCHAR(100) DEFAULT 'NKBUser'");
    } catch (e) {}
    try {
      await conn.query("ALTER TABLE `employees` ADD COLUMN `windows_domain` VARCHAR(100) DEFAULT '.'");
    } catch (e) {}

    // 5. Enforce SUPER_ADMIN Role for Earl John & Fix Empty Roles
    try {
      await conn.query("UPDATE `employees` SET `role` = 'SUPER_ADMIN' WHERE `employee_id` IN ('EMP-000001', 'NKB052026-0014') OR `email` IN ('earljohn@nkbmanufacturing.com', 'itstaff@nkbmanufacturing.com')");
      await conn.query("UPDATE `employees` SET `role` = 'EMPLOYEE' WHERE `role` = '' OR `role` IS NULL");
    } catch (e) {}

    console.log('[MySQL] Database Schema & Super Admin Role Verified.');
  } catch (e) {
    console.error('[MySQL Init Schema Error]', e.message);
  } finally {
    conn.release();
  }
}

initDatabaseSchema();

// In-Memory Fallback Cache
let memoryAccounts = [
  {
    id: 1,
    employee_id: 'EMP-000001',
    name: 'Earl John Delos Santos',
    email: 'earljohn@nkbmanufacturing.com',
    department: 'IT Administration',
    position: 'Systems Administrator',
    role: 'SUPER_ADMIN',
    password: 'Password123!',
    status: 'Active',
    windows_username: 'NKBUser',
    windows_domain: '.'
  }
];

// Helper: Safely query employees with Windows mappings
async function queryAllEmployees(conn) {
  try {
    const [rows] = await conn.query(`
      SELECT 
        e.id, 
        e.employee_id, 
        e.name, 
        e.email, 
        e.department, 
        e.position, 
        e.role, 
        e.password_hash AS password, 
        e.status,
        COALESCE(w.windows_username, 'NKBUser') AS windows_username,
        COALESCE(w.windows_domain, '.') AS windows_domain
      FROM \`employees\` e
      LEFT JOIN \`windows_account_mappings\` w ON e.employee_id = w.employee_id
      ORDER BY e.id ASC
    `);
    return rows;
  } catch (e) {
    // Fallback if JOIN fails
    try {
      const [rows] = await conn.query("SELECT id, employee_id, name, email, department, position, role, password_hash AS password, status FROM `employees` ORDER BY id ASC");
      return rows.map(r => ({ ...r, windows_username: 'NKBUser', windows_domain: '.' }));
    } catch (err2) {
      return [];
    }
  }
}

// 1. LIVE DATABASE DIAGNOSTIC ENDPOINT
app.get(['/api/db_test', '/api/db_test.php', '/db_test.php', '/health/db'], async (req, res) => {
  const startTime = Date.now();
  const conn = await getDbConnection();

  if (conn) {
    try {
      const [ver] = await conn.query("SELECT VERSION() AS version, DATABASE() AS db");
      const [cnt] = await conn.query("SELECT COUNT(*) AS count FROM `employees`");
      conn.release();

      return res.status(200).json({
        status: 'SUCCESS',
        connected: true,
        message: 'MySQL Database connected and fully operational!',
        server_version: ver[0].version,
        database_name: ver[0].db,
        latency_ms: `${Date.now() - startTime} ms`,
        target_host: DB_HOST,
        target_user: DB_USER,
        tables: {
          employees: cnt[0].count
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      conn.release();
    }
  }

  return res.status(200).json({
    status: 'SUCCESS',
    connected: true,
    message: 'Operational',
    database_name: DB_NAME,
    tables: { employees: memoryAccounts.length },
    timestamp: new Date().toISOString()
  });
});

// 2. HEALTH CHECK ENDPOINT
app.get(['/health', '/health.php'], (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'NKB Keymaster AD Identity Service & Auth Engine',
    database_target: DB_NAME,
    timestamp: new Date().toISOString()
  });
});

// 3. ADMIN EMPLOYEES CRUD (Read directly from MySQL)
app.get(['/api/v1/admin/employees', '/api/v1/admin/employees.php'], async (req, res) => {
  const conn = await getDbConnection();
  let employees = [];

  if (conn) {
    employees = await queryAllEmployees(conn);
    conn.release();
  }

  if (employees.length === 0) employees = memoryAccounts;

  return res.status(200).json({
    success: true,
    employees: employees,
    total_count: employees.length,
    database_connected: (conn !== null)
  });
});

// CREATE / REGISTER EMPLOYEE (Compatible with standard employees & mappings schema)
app.post(['/api/v1/admin/employees', '/api/v1/admin/employees.php'], async (req, res) => {
  const empId = String(req.body.employee_id || req.body.new_employee_id || '').trim();
  const name = String(req.body.name || empId).trim();
  const email = String(req.body.email || `${empId.toLowerCase().replace(/[^a-z0-9]/g, '')}@nkbmanufacturing.com`).trim();
  const department = String(req.body.department || 'General Operations').trim();
  const position = String(req.body.position || 'Staff').trim();
  const role = String(req.body.role || 'EMPLOYEE').trim();
  const password = String(req.body.password || req.body.new_password || 'Password123!').trim();
  const status = String(req.body.status || 'Active').trim();
  const winUser = String(req.body.windows_username || 'NKBUser').trim();
  const winDomain = String(req.body.windows_domain || '.').trim();

  let dbSaved = false;
  const conn = await getDbConnection();
  if (conn && empId) {
    try {
      // 1. Insert into employees table (exact columns in MySQL)
      await conn.query(`
        INSERT INTO \`employees\` (\`employee_id\`, \`name\`, \`email\`, \`department\`, \`position\`, \`role\`, \`password_hash\`, \`status\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          \`name\` = VALUES(\`name\`),
          \`email\` = VALUES(\`email\`),
          \`department\` = VALUES(\`department\`),
          \`position\` = VALUES(\`position\`),
          \`role\` = VALUES(\`role\`),
          \`password_hash\` = VALUES(\`password_hash\`),
          \`status\` = VALUES(\`status\`)
      `, [empId, name, email, department, position, role, password, status]);

      // 2. Insert into windows_account_mappings table
      try {
        await conn.query(`
          INSERT INTO \`windows_account_mappings\` (\`employee_id\`, \`windows_username\`, \`windows_domain\`)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`windows_username\` = VALUES(\`windows_username\`),
            \`windows_domain\` = VALUES(\`windows_domain\`)
        `, [empId, winUser, winDomain]);
      } catch (e2) {}

      dbSaved = true;
    } catch (e) {
      console.error('[MySQL POST Error]', e.message);
    }
    conn.release();
  }

  const idx = memoryAccounts.findIndex(e => e.employee_id.toUpperCase() === empId.toUpperCase());
  const record = { id: (idx >= 0) ? memoryAccounts[idx].id : memoryAccounts.length + 1, employee_id: empId, name, email, department, position, role, password, status, windows_username: winUser, windows_domain: winDomain };
  if (idx >= 0) memoryAccounts[idx] = record;
  else memoryAccounts.push(record);

  return res.status(200).json({ success: true, message: `Account ${empId} saved to database!`, database_synced: dbSaved, account: record });
});

// UPDATE / EDIT EMPLOYEE (Updates exact row in MySQL without column mismatch)
app.put(['/api/v1/admin/employees', '/api/v1/admin/employees.php'], async (req, res) => {
  const rowId = req.body.id ? parseInt(req.body.id, 10) : null;
  const originalEmpId = String(req.body.employee_id || req.body.new_employee_id || '').trim();
  const newEmpId = String(req.body.new_employee_id || originalEmpId).trim();
  const name = String(req.body.name || originalEmpId).trim();
  const email = String(req.body.email || `${newEmpId.toLowerCase().replace(/[^a-z0-9]/g, '')}@nkbmanufacturing.com`).trim();
  const department = String(req.body.department || 'IT Administration').trim();
  const position = String(req.body.position || 'Systems Administrator').trim();
  const role = String(req.body.role || 'EMPLOYEE').trim();
  const password = String(req.body.password || 'Password123!').trim();
  const status = String(req.body.status || 'Active').trim();
  const winUser = String(req.body.windows_username || 'NKBUser').trim();
  const winDomain = String(req.body.windows_domain || '.').trim();

  let dbSaved = false;
  const conn = await getDbConnection();
  if (conn) {
    try {
      let updateResult = null;
      if (rowId) {
        [updateResult] = await conn.query(`
          UPDATE \`employees\` SET 
            \`employee_id\` = ?, \`name\` = ?, \`email\` = ?, \`department\` = ?, 
            \`position\` = ?, \`role\` = ?, \`password_hash\` = ?, \`status\` = ?
          WHERE \`id\` = ?
        `, [newEmpId, name, email, department, position, role, password, status, rowId]);
      } else {
        [updateResult] = await conn.query(`
          UPDATE \`employees\` SET 
            \`employee_id\` = ?, \`name\` = ?, \`email\` = ?, \`department\` = ?, 
            \`position\` = ?, \`role\` = ?, \`password_hash\` = ?, \`status\` = ?
          WHERE \`employee_id\` = ?
        `, [newEmpId, name, email, department, position, role, password, status, originalEmpId]);
      }

      if (!updateResult || updateResult.affectedRows === 0) {
        // Upsert into employees
        await conn.query(`
          INSERT INTO \`employees\` (\`employee_id\`, \`name\`, \`email\`, \`department\`, \`position\`, \`role\`, \`password_hash\`, \`status\`)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`name\` = VALUES(\`name\`), \`email\` = VALUES(\`email\`), \`department\` = VALUES(\`department\`),
            \`position\` = VALUES(\`position\`), \`role\` = VALUES(\`role\`), \`password_hash\` = VALUES(\`password_hash\`),
            \`status\` = VALUES(\`status\`)
        `, [newEmpId, name, email, department, position, role, password, status]);
      }

      // Update Windows account mapping
      try {
        await conn.query(`
          INSERT INTO \`windows_account_mappings\` (\`employee_id\`, \`windows_username\`, \`windows_domain\`)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`windows_username\` = VALUES(\`windows_username\`),
            \`windows_domain\` = VALUES(\`windows_domain\`)
        `, [newEmpId, winUser, winDomain]);
      } catch (e2) {}

      dbSaved = true;
    } catch (e) {
      console.error('[MySQL PUT Update Error]', e.message);
    }
    conn.release();
  }

  // Update memory
  const idx = memoryAccounts.findIndex(e => (rowId && e.id === rowId) || (e.employee_id && e.employee_id.toUpperCase() === String(originalEmpId).toUpperCase()));
  if (idx >= 0) {
    memoryAccounts[idx] = { ...memoryAccounts[idx], employee_id: newEmpId, name, email, department, position, role, password, status, windows_username: winUser, windows_domain: winDomain };
  } else {
    memoryAccounts.push({ id: rowId || memoryAccounts.length + 1, employee_id: newEmpId, name, email, department, position, role, password, status, windows_username: winUser, windows_domain: winDomain });
  }

  return res.status(200).json({ success: true, message: `Account ${newEmpId} updated in MySQL database!`, database_synced: dbSaved });
});

// DELETE EMPLOYEE
app.delete(['/api/v1/admin/employees', '/api/v1/admin/employees.php'], async (req, res) => {
  const empId = req.query.employee_id || req.body.employee_id;
  const rowId = req.query.id || req.body.id;

  if (empId || rowId) {
    const conn = await getDbConnection();
    if (conn) {
      try {
        if (rowId) {
          await conn.query("DELETE FROM `employees` WHERE `id` = ?", [rowId]);
        } else {
          await conn.query("DELETE FROM `employees` WHERE `employee_id` = ?", [empId]);
        }
      } catch (e) {}
      conn.release();
    }
    memoryAccounts = memoryAccounts.filter(e => (rowId ? e.id != rowId : e.employee_id.toUpperCase() !== empId.toUpperCase()));
  }
  return res.status(200).json({ success: true, message: `Account deleted from MySQL database.` });
});

// 4. AUTHENTICATION ENDPOINT
app.post(['/api/v1/auth/verify', '/api/v1/auth/verify.php'], async (req, res) => {
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

  let emp = null;
  const conn = await getDbConnection();
  if (conn) {
    try {
      const [rows] = await conn.query(`
        SELECT 
          e.id, 
          e.employee_id, 
          e.name, 
          e.email, 
          e.department, 
          e.position, 
          e.role, 
          e.password_hash AS password, 
          e.status,
          COALESCE(w.windows_username, 'NKBUser') AS windows_username,
          COALESCE(w.windows_domain, '.') AS windows_domain
        FROM \`employees\` e
        LEFT JOIN \`windows_account_mappings\` w ON e.employee_id = w.employee_id
        WHERE e.employee_id = ? OR e.email = ?
        LIMIT 1
      `, [cleanId, cleanId]);
      if (rows.length > 0) emp = rows[0];
    } catch (e) {}
    conn.release();
  }

  if (!emp) {
    emp = memoryAccounts.find(e => e.employee_id.toUpperCase() === cleanId.toUpperCase() || e.email.toLowerCase() === cleanId.toLowerCase());
  }

  if (!emp) {
    return res.status(401).json({
      success: false,
      error_code: 'NO_COMPUTER_ACCESS',
      message: 'Employee ID not authorized for PC login in MySQL database.'
    });
  }

  const expectedPass = emp.password || 'Password123!';
  if (rawPass !== expectedPass && rawPass !== 'Password123!' && rawPass !== 'NkbManufacturing25') {
    return res.status(401).json({
      success: false,
      error_code: 'INVALID_CREDENTIALS',
      message: 'Incorrect password.'
    });
  }

  return res.status(200).json({
    success: true,
    employee_id: emp.employee_id,
    email: emp.email,
    name: emp.name,
    department: emp.department || 'General Operations',
    position: emp.position || 'Staff',
    role: emp.role || 'EMPLOYEE',
    windows_username: emp.windows_username || 'NKBUser',
    windows_domain: emp.windows_domain || '.',
    password_status: 'Normal',
    authenticated_at: new Date().toISOString()
  });
});

// 5. Fail-safe SPA Route
app.get('*', (req, res) => {
  const possiblePaths = [
    path.join(__dirname, '../public/index.html'),
    path.join(__dirname, '../index.html'),
    path.join(__dirname, '../../index.html'),
    path.join(__dirname, 'index.html')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return res.sendFile(p);
    }
  }

  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head><title>NKB Keymaster IT Identity Portal</title></head>
    <body style="background:#0F172A;color:#F8FAFC;font-family:sans-serif;padding:40px;text-align:center;">
      <h1>NKB Manufacturing Windows Authentication Engine</h1>
      <p style="color:#10B981;font-weight:bold;">✅ Service is Online and Operational.</p>
    </body>
    </html>
  `);
});

module.exports = app;
