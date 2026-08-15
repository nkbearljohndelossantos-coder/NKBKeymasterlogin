/**
 * Integration Test Data Fixtures
 * Isolated mock data strictly for automated verification.
 */
module.exports = {
  testServiceToken: 'test-only-secret-2026-isolated-fixture',
  testEmployees: {
    admin: {
      employee_id: 'EMP-000001',
      email: 'earljohn@nkbmanufacturing.com',
      password: 'Password123!',
      computer_name: 'NKB-PC-001'
    },
    lineLead: {
      employee_id: 'EMP-000123',
      email: 'juan.delacruz@nkbmanufacturing.com',
      password: 'Password123!',
      computer_name: 'NKB-PC-002'
    },
    disabled: {
      employee_id: 'EMP-000999',
      email: 'disabled.user@nkbmanufacturing.com',
      password: 'Password123!',
      computer_name: 'NKB-PC-001'
    },
    locked: {
      employee_id: 'EMP-000888',
      email: 'locked.user@nkbmanufacturing.com',
      password: 'Password123!',
      computer_name: 'NKB-PC-001'
    }
  }
};
