const db = require('../config/database');
const bcrypt = require('bcryptjs');

class EmployeeService {
  /**
   * Find employee by either Employee ID or NKB Email (case-insensitive).
   */
  static async findByIdentifier(identifier) {
    if (!identifier || typeof identifier !== 'string') return null;
    const cleanIdentifier = identifier.trim();

    const sql = `
      SELECT * FROM employees 
      WHERE LOWER(email) = LOWER(?) OR UPPER(employee_id) = UPPER(?)
      LIMIT 1
    `;
    const rows = await db.query(sql, [cleanIdentifier, cleanIdentifier]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find Windows account mapping for a given employee ID.
   */
  static async getWindowsMapping(employeeId) {
    const sql = `SELECT * FROM windows_account_mappings WHERE employee_id = ? LIMIT 1`;
    const rows = await db.query(sql, [employeeId]);
    if (rows.length > 0) {
      return rows[0];
    }
    // Fallback: Default domain mapping matching Employee ID
    return {
      employee_id: employeeId,
      windows_username: employeeId,
      windows_domain: 'NKB'
    };
  }

  /**
   * Verify whether an employee is authorized for a specific workstation hostname.
   */
  static async isAuthorizedForComputer(employeeId, computerHostname) {
    if (!computerHostname) return true; // If hostname is not passed, allow or bypass check based on policy
    
    // Check if computer hostname is registered in employee_computers table
    const sql = `
      SELECT * FROM employee_computers 
      WHERE employee_id = ? AND UPPER(computer_hostname) = UPPER(?)
      LIMIT 1
    `;
    const rows = await db.query(sql, [employeeId, computerHostname.trim()]);
    
    // If no specific assignment restriction exists for this employee, allow default
    if (rows.length > 0) return true;

    // Check if employee has any workstation restrictions configured
    const allAssignmentsSql = `SELECT COUNT(*) as cnt FROM employee_computers WHERE employee_id = ?`;
    const checkRows = await db.query(allAssignmentsSql, [employeeId]);
    const totalAssigned = checkRows[0] ? checkRows[0].cnt : 0;

    // If employee has assigned PCs, but NOT this PC, reject
    if (totalAssigned > 0) {
      return false;
    }
    // Default open access if no computer restriction registered
    return true;
  }

  /**
   * Increment failed login attempts and handle automated lockout.
   */
  static async recordFailedAttempt(employeeId, maxAttempts = 5, lockoutMinutes = 15) {
    const emp = await this.findByIdentifier(employeeId);
    if (!emp) return;

    const newFailedCount = (emp.failed_login_attempts || 0) + 1;
    let newStatus = emp.status;
    let lockoutUntil = emp.lockout_until;

    if (newFailedCount >= maxAttempts) {
      newStatus = 'Locked';
      const lockoutDate = new Date();
      lockoutDate.setMinutes(lockoutDate.getMinutes() + lockoutMinutes);
      lockoutUntil = lockoutDate.toISOString();
    }

    const sql = `
      UPDATE employees 
      SET failed_login_attempts = ?, status = ?, lockout_until = ?
      WHERE employee_id = ?
    `;
    await db.query(sql, [newFailedCount, newStatus, lockoutUntil, emp.employee_id]);
  }

  /**
   * Reset failed attempts upon successful login.
   */
  static async resetFailedAttempts(employeeId) {
    const now = new Date().toISOString();
    const sql = `
      UPDATE employees 
      SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = ?
      WHERE employee_id = ?
    `;
    await db.query(sql, [now, employeeId]);
  }

  /**
   * Create a new employee record with uniqueness check on employee_id and email.
   */
  static async createEmployee({ employee_id, email, name, department, position, role = 'Employee', password }) {
    const cleanId = employee_id.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Uniqueness validation
    const checkSql = `SELECT * FROM employees WHERE employee_id = ? OR LOWER(email) = LOWER(?) LIMIT 1`;
    const existing = await db.query(checkSql, [cleanId, cleanEmail]);
    if (existing.length > 0) {
      const isIdMatch = existing[0].employee_id.toUpperCase() === cleanId.toUpperCase();
      const err = new Error(isIdMatch ? 'Employee ID already exists' : 'Email address already exists');
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertSql = `
      INSERT INTO employees 
        (employee_id, email, name, department, position, role, status, password_hash, password_status)
      VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, 'Normal')
    `;
    await db.query(insertSql, [cleanId, cleanEmail, name, department, position, role, passwordHash]);

    // Create default Windows account mapping
    const mapSql = `
      INSERT INTO windows_account_mappings (employee_id, windows_username, windows_domain)
      VALUES (?, ?, 'NKB')
    `;
    await db.query(mapSql, [cleanId, cleanId]);

    return this.findByIdentifier(cleanId);
  }

  /**
   * Update employee status (Active / Disabled / Locked).
   */
  static async updateStatus(employeeId, status) {
    const validStatuses = ['Active', 'Disabled', 'Locked'];
    if (!validStatuses.includes(status)) {
      const err = new Error('Invalid account status');
      err.statusCode = 400;
      throw err;
    }

    const sql = `UPDATE employees SET status = ?, failed_login_attempts = 0, lockout_until = NULL WHERE employee_id = ?`;
    await db.query(sql, [status, employeeId]);
  }
}

module.exports = EmployeeService;
