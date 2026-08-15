const bcrypt = require('bcryptjs');
const EmployeeService = require('./employee.service');
const AuditService = require('./audit.service');
const config = require('../config/auth.config');

class AuthService {
  /**
   * Main authentication service method for Credential Provider logon requests.
   * Accepts either NKB Email or Employee ID in the `identifier` field.
   */
  static async verifyCredentials({ identifier, password, computer_name, ip_address }) {
    const cleanIdentifier = String(identifier || '').trim();
    const cleanPassword = String(password || '');
    const computerName = String(computer_name || 'UNKNOWN').trim();
    const ip = String(ip_address || '127.0.0.1');

    if (!cleanIdentifier || !cleanPassword) {
      await AuditService.logEvent({
        identifierUsed: cleanIdentifier,
        eventType: 'LOGIN_ATTEMPT',
        outcome: 'FAILURE',
        computerName,
        ipAddress: ip,
        details: 'Missing identifier or password'
      });
      return {
        success: false,
        error_code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials.'
      };
    }

    // 1. Locate employee by Email OR Employee ID
    const employee = await EmployeeService.findByIdentifier(cleanIdentifier);

    if (!employee) {
      await AuditService.logEvent({
        identifierUsed: cleanIdentifier,
        eventType: 'LOGIN_ATTEMPT',
        outcome: 'FAILURE',
        computerName,
        ipAddress: ip,
        details: 'Identifier not found'
      });
      // Generic failure message to prevent account enumeration
      return {
        success: false,
        error_code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials.'
      };
    }

    // 2. Check Account Status & Lockout
    if (employee.status === 'Disabled') {
      await AuditService.logEvent({
        identifierUsed: cleanIdentifier,
        employeeId: employee.employee_id,
        eventType: 'LOGIN_ATTEMPT',
        outcome: 'BLOCKED',
        computerName,
        ipAddress: ip,
        details: 'Account disabled'
      });
      return {
        success: false,
        error_code: 'ACCOUNT_DISABLED',
        message: 'Your NKB account has been disabled. Please contact IT Administration.'
      };
    }

    if (employee.status === 'Locked') {
      // Check if lockout duration expired
      if (employee.lockout_until && new Date(employee.lockout_until) > new Date()) {
        await AuditService.logEvent({
          identifierUsed: cleanIdentifier,
          employeeId: employee.employee_id,
          eventType: 'LOGIN_ATTEMPT',
          outcome: 'LOCKOUT',
          computerName,
          ipAddress: ip,
          details: 'Account currently locked'
        });
        return {
          success: false,
          error_code: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked due to multiple failed login attempts. Try again later.'
        };
      }
    }

    // 3. Verify Password Hash (bcrypt / Argon2)
    const isPasswordValid = await bcrypt.compare(cleanPassword, employee.password_hash);

    if (!isPasswordValid) {
      await EmployeeService.recordFailedAttempt(employee.employee_id, config.maxFailedAttempts, config.lockoutDurationMinutes);
      
      await AuditService.logEvent({
        identifierUsed: cleanIdentifier,
        employeeId: employee.employee_id,
        eventType: 'LOGIN_ATTEMPT',
        outcome: 'FAILURE',
        computerName,
        ipAddress: ip,
        details: 'Invalid password'
      });

      return {
        success: false,
        error_code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials.'
      };
    }

    // 4. Verify Workstation Authorization
    const isComputerAuthorized = await EmployeeService.isAuthorizedForComputer(employee.employee_id, computerName);
    if (!isComputerAuthorized) {
      await AuditService.logEvent({
        identifierUsed: cleanIdentifier,
        employeeId: employee.employee_id,
        eventType: 'LOGIN_ATTEMPT',
        outcome: 'BLOCKED',
        computerName,
        ipAddress: ip,
        details: `Employee not assigned to computer ${computerName}`
      });
      return {
        success: false,
        error_code: 'UNAUTHORIZED_COMPUTER',
        message: `Account is not authorized to sign in on workstation ${computerName}.`
      };
    }

    // 5. Success - Reset failed attempts & resolve Windows Account Mapping
    await EmployeeService.resetFailedAttempts(employee.employee_id);
    const windowsMapping = await EmployeeService.getWindowsMapping(employee.employee_id);

    await AuditService.logEvent({
      identifierUsed: cleanIdentifier,
      employeeId: employee.employee_id,
      eventType: 'LOGIN_ATTEMPT',
      outcome: 'SUCCESS',
      computerName,
      ipAddress: ip,
      details: `Authenticated as ${windowsMapping.windows_domain}\\${windowsMapping.windows_username}`
    });

    return {
      success: true,
      employee_id: employee.employee_id,
      email: employee.email,
      name: employee.name,
      department: employee.department,
      position: employee.position,
      role: employee.role,
      windows_username: windowsMapping.windows_username,
      windows_domain: windowsMapping.windows_domain,
      password_status: employee.password_status,
      authenticated_at: new Date().toISOString()
    };
  }
}

module.exports = AuthService;
