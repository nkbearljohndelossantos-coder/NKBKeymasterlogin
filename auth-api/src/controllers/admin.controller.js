const EmployeeService = require('../services/employee.service');
const AuditService = require('../services/audit.service');
const ADIdentityService = require('../services/adIdentity.service');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class AdminController {
  /**
   * Create Employee Account
   * POST /api/v1/admin/employees
   */
  static async createEmployee(req, res, next) {
    try {
      const { employee_id, email, name, department, position, role, password } = req.body;

      if (!employee_id || !email || !name || !password) {
        return res.status(400).json({
          success: false,
          error_code: 'MISSING_FIELDS',
          message: 'Employee ID, Email, Name, and Password are required.'
        });
      }

      const newEmp = await EmployeeService.createEmployee({
        employee_id,
        email,
        name,
        department: department || 'General',
        position: position || 'Staff',
        role: role || 'Employee',
        password
      });

      await AuditService.logEvent({
        identifierUsed: email,
        employeeId: employee_id,
        eventType: 'ADMIN_CREATE_EMPLOYEE',
        outcome: 'SUCCESS',
        details: `Created employee account ${employee_id} (${email})`
      });

      return res.status(201).json({
        success: true,
        message: 'Employee login account created successfully.',
        employee: newEmp
      });
    } catch (err) {
      if (err.statusCode === 400) {
        return res.status(400).json({
          success: false,
          error_code: 'DUPLICATE_IDENTIFIER',
          message: err.message
        });
      }
      next(err);
    }
  }

  /**
   * Update Account Status (Activate / Disable / Lock)
   * PATCH /api/v1/admin/employees/:id/status
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params; // employee_id
      const { status } = req.body;

      await EmployeeService.updateStatus(id, status);

      // Delegate to AD Identity Service to sync Active Directory account status
      const winMapping = await EmployeeService.getWindowsMapping(id);
      if (status === 'Disabled') {
        await ADIdentityService.disableAccount(winMapping.windows_username, req.user ? req.user.employee_id : 'IT_ADMIN');
      } else if (status === 'Active') {
        await ADIdentityService.enableAccount(winMapping.windows_username, req.user ? req.user.employee_id : 'IT_ADMIN');
      }

      await AuditService.logEvent({
        identifierUsed: id,
        employeeId: id,
        eventType: 'ADMIN_UPDATE_STATUS',
        outcome: 'SUCCESS',
        details: `Updated account status to ${status} in NKB and Active Directory`
      });

      return res.status(200).json({
        success: true,
        message: `Employee ${id} account status set to ${status}.`
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reset Password
   * POST /api/v1/admin/employees/:id/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { new_password, force_change } = req.body;

      if (!new_password) {
        return res.status(400).json({
          success: false,
          error_code: 'MISSING_PASSWORD',
          message: 'New password is required.'
        });
      }

      const passwordHash = await bcrypt.hash(new_password, 10);
      const passwordStatus = force_change ? 'MustChange' : 'Normal';

      const sql = `
        UPDATE employees 
        SET password_hash = ?, password_status = ?, failed_login_attempts = 0, status = 'Active', lockout_until = NULL
        WHERE employee_id = ?
      `;
      await db.query(sql, [passwordHash, passwordStatus, id]);

      // Delegate password reset to AD Identity Service over LDAPS (Port 636)
      const winMapping = await EmployeeService.getWindowsMapping(id);
      await ADIdentityService.resetPassword(winMapping.windows_username, new_password, req.user ? req.user.employee_id : 'IT_ADMIN');

      await AuditService.logEvent({
        identifierUsed: id,
        employeeId: id,
        eventType: 'ADMIN_RESET_PASSWORD',
        outcome: 'SUCCESS',
        details: `Reset password for employee ${id} in NKB DB and Active Directory`
      });

      return res.status(200).json({
        success: true,
        message: `Password for employee ${id} reset successfully.`
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Assign Workstation Computer
   * POST /api/v1/admin/employees/:id/computers
   */
  static async assignComputer(req, res, next) {
    try {
      const { id } = req.params;
      const { computer_hostname } = req.body;

      if (!computer_hostname) {
        return res.status(400).json({
          success: false,
          error_code: 'MISSING_HOSTNAME',
          message: 'Computer hostname is required.'
        });
      }

      const cleanHostname = computer_hostname.trim().toUpperCase();
      
      // Ensure computer exists
      await db.query(`INSERT IGNORE INTO computers (hostname, status) VALUES (?, 'Active')`, [cleanHostname]);
      await db.query(`INSERT IGNORE INTO employee_computers (employee_id, computer_hostname) VALUES (?, ?)`, [id, cleanHostname]);

      await AuditService.logEvent({
        identifierUsed: id,
        employeeId: id,
        eventType: 'ADMIN_ASSIGN_COMPUTER',
        outcome: 'SUCCESS',
        details: `Assigned computer ${cleanHostname} to employee ${id}`
      });

      return res.status(200).json({
        success: true,
        message: `Computer ${cleanHostname} assigned to employee ${id}.`
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Administrative Identity Reconciliation
   * POST /api/v1/admin/reconcile
   */
  static async reconcileIdentities(req, res, next) {
    try {
      const employees = await db.query(`SELECT * FROM employees`);
      const mappings = await db.query(`SELECT * FROM windows_account_mappings`);
      const computers = await db.query(`SELECT * FROM employee_computers`);

      const result = await ADIdentityService.reconcileIdentities(employees, mappings, computers);

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * View Audit Logs
   * GET /api/v1/admin/audit-logs
   */
  static async getAuditLogs(req, res, next) {
    try {
      const logs = await AuditService.getRecentLogs(100);
      return res.status(200).json({
        success: true,
        logs
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;
