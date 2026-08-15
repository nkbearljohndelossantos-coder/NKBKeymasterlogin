const db = require('../config/database');

class AuditService {
  /**
   * Log an authentication or administration security event.
   */
  static async logEvent({ identifierUsed, employeeId, eventType, outcome, computerName, ipAddress, details }) {
    try {
      const sql = `
        INSERT INTO audit_logs 
          (identifier_used, employee_id, event_type, outcome, computer_name, ip_address, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      await db.query(sql, [
        identifierUsed || 'UNKNOWN',
        employeeId || null,
        eventType || 'LOGIN_ATTEMPT',
        outcome || 'FAILURE',
        computerName || 'UNKNOWN',
        ipAddress || '127.0.0.1',
        typeof details === 'object' ? JSON.stringify(details) : (details || '')
      ]);
    } catch (err) {
      console.error('Audit Log Error:', err.message);
    }
  }

  /**
   * Query recent audit logs.
   */
  static async getRecentLogs(limit = 100) {
    const sql = `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`;
    return db.query(sql, [limit]);
  }
}

module.exports = AuditService;
