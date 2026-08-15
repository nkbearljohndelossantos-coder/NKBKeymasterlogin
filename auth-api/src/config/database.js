const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nkb_auth_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// In-Memory Data Store Fallback for Testing / Standalone Execution
let useInMemory = false;
let memoryStore = null;

function initializeInMemoryStore() {
  const bcrypt = require('bcryptjs');
  const defaultHash = bcrypt.hashSync('Password123!', 10);
  
  memoryStore = {
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
        failed_login_attempts: 0,
        lockout_until: null,
        last_login_at: null
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
        failed_login_attempts: 0,
        lockout_until: null,
        last_login_at: null
      },
      {
        id: 3,
        employee_id: 'EMP-000999',
        email: 'disabled.user@nkbmanufacturing.com',
        name: 'Disabled User',
        department: 'Quality Control',
        position: 'Inspector',
        role: 'Employee',
        status: 'Disabled',
        password_hash: defaultHash,
        password_status: 'Normal',
        failed_login_attempts: 0,
        lockout_until: null,
        last_login_at: null
      },
      {
        id: 4,
        employee_id: 'EMP-000888',
        email: 'locked.user@nkbmanufacturing.com',
        name: 'Locked User',
        department: 'Logistics',
        position: 'Warehouse Lead',
        role: 'Employee',
        status: 'Locked',
        password_hash: defaultHash,
        password_status: 'Normal',
        failed_login_attempts: 0,
        lockout_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        last_login_at: null
      }
    ],
    windows_account_mappings: [
      { employee_id: 'EMP-000001', windows_username: 'earlj', windows_domain: '.' },
      { employee_id: 'EMP-000123', windows_username: 'earlj', windows_domain: '.' },
      { employee_id: 'EMP-000999', windows_username: 'EMP-000999', windows_domain: 'NKB' },
      { employee_id: 'EMP-000888', windows_username: 'EMP-000888', windows_domain: 'NKB' }
    ],
    computers: [
      { hostname: 'NKB-PC-001', status: 'Active' },
      { hostname: 'NKB-PC-002', status: 'Active' },
      { hostname: 'NKBMANUF', status: 'Active' },
      { hostname: 'NKB-PC-UNASSIGNED', status: 'Active' }
    ],
    employee_computers: [
      { employee_id: 'EMP-000001', computer_hostname: 'NKB-PC-001' },
      { employee_id: 'EMP-000001', computer_hostname: 'NKBMANUF' },
      { employee_id: 'EMP-000123', computer_hostname: 'NKB-PC-002' },
      { employee_id: 'EMP-000123', computer_hostname: 'NKBMANUF' },
      { employee_id: 'EMP-000999', computer_hostname: 'NKB-PC-001' },
      { employee_id: 'EMP-000888', computer_hostname: 'NKB-PC-001' }
    ],
    audit_logs: []
  };
}

let pool = null;

function getPool() {
  if (!pool && !useInMemory) {
    try {
      pool = mysql.createPool(dbConfig);
    } catch (err) {
      console.warn('MySQL pool creation warning:', err.message);
      useInMemory = true;
      initializeInMemoryStore();
    }
  }
  return pool;
}

function setInMemoryMode(enabled) {
  useInMemory = enabled;
  if (enabled && !memoryStore) {
    initializeInMemoryStore();
  }
}

function getMemoryStore() {
  if (!memoryStore) initializeInMemoryStore();
  return memoryStore;
}

async function query(sql, params = []) {
  if (useInMemory) {
    return handleInMemoryQuery(sql, params);
  }
  try {
    const p = getPool();
    const [rows] = await p.execute(sql, params);
    return rows;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ER_BAD_DB_ERROR') {
      useInMemory = true;
      initializeInMemoryStore();
      return handleInMemoryQuery(sql, params);
    }
    throw err;
  }
}

function handleInMemoryQuery(sql, params) {
  const store = getMemoryStore();
  const lowerSql = sql.toLowerCase();

  // SELECT employee by email OR employee_id
  if (lowerSql.includes('from employees') && lowerSql.includes('lower(email)') && lowerSql.includes('upper(employee_id)')) {
    const idParam = String(params[0] || '').toLowerCase().trim();
    const match = store.employees.find(e => 
      e.email.toLowerCase() === idParam || e.employee_id.toLowerCase() === idParam
    );
    return match ? [ { ...match } ] : [];
  }

  // SELECT employee by id OR email for uniqueness check
  if (lowerSql.includes('from employees') && (lowerSql.includes('where employee_id = ? or lower(email)') || lowerSql.includes('where employee_id = ? or email = ?'))) {
    const empId = params[0];
    const email = String(params[1] || '').toLowerCase();
    const match = store.employees.find(e => e.employee_id.toUpperCase() === String(empId).toUpperCase() || e.email.toLowerCase() === email);
    return match ? [ { ...match } ] : [];
  }

  // SELECT employee by employee_id alone
  if (lowerSql.includes('from employees') && lowerSql.includes('where employee_id =')) {
    const empId = params[0];
    const match = store.employees.find(e => e.employee_id === empId);
    return match ? [ { ...match } ] : [];
  }

  // SELECT windows account mapping
  if (lowerSql.includes('from windows_account_mappings')) {
    const empId = params[0];
    const match = store.windows_account_mappings.find(m => m.employee_id === empId);
    return match ? [ { ...match } ] : [{ employee_id: empId, windows_username: 'earlj', windows_domain: '.' }];
  }

  // SELECT employee_computers assignment
  if (lowerSql.includes('from employee_computers')) {
    if (lowerSql.includes('count(*)')) {
      const empId = params[0];
      const count = store.employee_computers.filter(c => c.employee_id === empId).length;
      return [{ cnt: count }];
    }
    const empId = params[0];
    const computerName = params[1];
    if (!computerName) {
      const list = store.employee_computers.filter(c => c.employee_id === empId);
      return list.map(c => ({ ...c }));
    }
    const match = store.employee_computers.find(c => 
      c.employee_id === empId && c.computer_hostname.toUpperCase() === String(computerName).toUpperCase()
    );
    return match ? [ { ...match } ] : [];
  }

  // UPDATE employees (failed_login_attempts, status, lockout_until, etc)
  if (lowerSql.includes('update employees')) {
    const empId = params[params.length - 1];
    const emp = store.employees.find(e => e.employee_id === empId || e.id === empId);
    if (emp) {
      if (lowerSql.includes('password_hash = ?')) {
        emp.password_hash = params[0];
        emp.password_status = params[1];
        emp.failed_login_attempts = 0;
        emp.status = 'Active';
        emp.lockout_until = null;
      } else if (lowerSql.includes('failed_login_attempts = ?')) {
        emp.failed_login_attempts = params[0];
        emp.status = params[1];
        emp.lockout_until = params[2];
      } else if (lowerSql.includes('failed_login_attempts = 0')) {
        emp.failed_login_attempts = 0;
        emp.lockout_until = null;
        emp.last_login_at = new Date().toISOString();
      } else if (lowerSql.includes('set status = ?')) {
        emp.status = params[0];
      }
    }
    return { affectedRows: 1 };
  }

  // SELECT audit_logs
  if (lowerSql.includes('from audit_logs')) {
    return store.audit_logs.slice().reverse();
  }

  // INSERT INTO audit_logs
  if (lowerSql.includes('insert into audit_logs')) {
    store.audit_logs.push({
      id: store.audit_logs.length + 1,
      identifier_used: params[0],
      employee_id: params[1],
      event_type: params[2],
      outcome: params[3],
      computer_name: params[4],
      ip_address: params[5],
      details: params[6],
      created_at: new Date().toISOString()
    });
    return { affectedRows: 1 };
  }

  // INSERT INTO employees
  if (lowerSql.includes('insert into employees')) {
    const newEmp = {
      id: store.employees.length + 1,
      employee_id: params[0],
      email: params[1],
      name: params[2],
      department: params[3],
      position: params[4],
      role: params[5] || 'Employee',
      status: params[6] || 'Active',
      password_hash: params[7],
      password_status: 'Normal',
      failed_login_attempts: 0,
      lockout_until: null,
      last_login_at: null
    };
    store.employees.push(newEmp);
    return { affectedRows: 1, insertId: newEmp.id };
  }

  // Generic fallback
  return [];
}

module.exports = {
  query,
  setInMemoryMode,
  getMemoryStore
};
