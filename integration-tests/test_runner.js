const http = require('http');
const crypto = require('crypto');

// Set test environment configuration before loading apps
process.env.NODE_ENV = 'test';
process.env.AD_PROVIDER = 'mock';
process.env.AUTH_API_AD_SERVICE_TOKEN = 'test-only-secret-2026-isolated-fixture';
process.env.AD_SERVICE_EXPECTED_TOKEN = 'test-only-secret-2026-isolated-fixture';

const app = require('../auth-api/src/app');
const adApp = require('../ad-identity-service/src/app');
const db = require('../auth-api/src/config/database');
const adClient = require('../auth-api/src/services/adIdentity.service');
const fixtures = require('./fixtures/test_data');

db.setInMemoryMode(true);

const AUTH_PORT = parseInt(process.env.AUTH_API_TEST_PORT || '3099', 10);
const AD_PORT = parseInt(process.env.AD_SERVICE_TEST_PORT || '3100', 10);

adClient.setServicePort(AD_PORT);
adClient.setServiceToken(fixtures.testServiceToken);

const authServer = http.createServer(app);
const adServer = http.createServer(adApp);

function request(port, path, method = 'POST', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': crypto.randomUUID(),
        ...headers
      }
    };
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAll34Tests() {
  console.log('\n======================================================');
  console.log(' NKB MANUFACTURING INTEGRATION TEST SUITE (34 CASES)');
  console.log(' Isolated Test Environment (Mock AD Provider)');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function assertCase(num, title, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] Test ${num}: ${title}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] Test ${num}: ${title}\n     Reason: ${err.message}`);
      failed++;
    }
  }

  adServer.listen(AD_PORT, () => {
    authServer.listen(AUTH_PORT, async () => {
      try {
        // 1. Valid Employee ID + password
        await assertCase(1, 'Valid Employee ID + password', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-000123', password: 'Password123!', computer_name: 'NKB-PC-002' });
          if (res.statusCode !== 200 || !res.body.success || res.body.employee_id !== 'EMP-000123') {
            throw new Error(`Expected 200 Success, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 2. Valid NKB Email + password
        await assertCase(2, 'Valid NKB Email + password', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'juan.delacruz@nkbmanufacturing.com', password: 'Password123!', computer_name: 'NKB-PC-002' });
          if (res.statusCode !== 200 || !res.body.success || res.body.employee_id !== 'EMP-000123') {
            throw new Error(`Expected 200 Success for email, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 3. Invalid Employee ID
        await assertCase(3, 'Invalid Employee ID', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-NONEXISTENT', password: 'Password123!', computer_name: 'NKB-PC-001' });
          if (res.statusCode !== 401 || res.body.success || res.body.message !== 'Invalid credentials.') {
            throw new Error(`Expected 401 Generic Error, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 4. Invalid email
        await assertCase(4, 'Invalid email', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'fake.email@nkbmanufacturing.com', password: 'Password123!', computer_name: 'NKB-PC-001' });
          if (res.statusCode !== 401 || res.body.success || res.body.message !== 'Invalid credentials.') {
            throw new Error(`Expected 401 Generic Error, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 5. Correct ID + wrong password
        await assertCase(5, 'Correct ID + wrong password', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-000123', password: 'WrongPassword!', computer_name: 'NKB-PC-002' });
          if (res.statusCode !== 401 || res.body.success || res.body.message !== 'Invalid credentials.') {
            throw new Error(`Expected 401 Generic Error, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 6. Correct email + wrong password
        await assertCase(6, 'Correct email + wrong password', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'earljohn@nkbmanufacturing.com', password: 'WrongPassword!', computer_name: 'NKB-PC-001' });
          if (res.statusCode !== 401 || res.body.success || res.body.message !== 'Invalid credentials.') {
            throw new Error(`Expected 401 Generic Error, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 7. Disabled employee
        await assertCase(7, 'Disabled employee', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-000999', password: 'Password123!', computer_name: 'NKB-PC-001' });
          if (res.statusCode !== 401 || res.body.error_code !== 'ACCOUNT_DISABLED') {
            throw new Error(`Expected 401 ACCOUNT_DISABLED, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 8. Locked employee
        await assertCase(8, 'Locked employee', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-000888', password: 'Password123!', computer_name: 'NKB-PC-001' });
          if (res.statusCode !== 401 || res.body.error_code !== 'ACCOUNT_LOCKED') {
            throw new Error(`Expected 401 ACCOUNT_LOCKED, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 9. Unauthorized computer
        await assertCase(9, 'Unauthorized computer', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-000123', password: 'Password123!', computer_name: 'NKB-PC-UNASSIGNED' });
          if (res.statusCode !== 401 || res.body.error_code !== 'UNAUTHORIZED_COMPUTER') {
            throw new Error(`Expected 401 UNAUTHORIZED_COMPUTER, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 10. Email case-insensitivity
        await assertCase(10, 'Email case-insensitivity', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EARLJOHN@NKBMANUFACTURING.COM', password: 'Password123!', computer_name: 'NKB-PC-001' });
          if (res.statusCode !== 200 || !res.body.success || res.body.employee_id !== 'EMP-000001') {
            throw new Error(`Expected 200 Success for UPPERCASE email, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 11. Duplicate email
        await assertCase(11, 'Duplicate email', async () => {
          const res = await request(AUTH_PORT, '/api/v1/admin/employees', 'POST', { 'x-admin-key': 'nkb-admin-dev-key' }, {
            employee_id: 'EMP-NEW001',
            email: 'earljohn@nkbmanufacturing.com',
            name: 'New Test Employee',
            password: 'Password123!'
          });
          if (res.statusCode !== 400 || res.body.error_code !== 'DUPLICATE_IDENTIFIER') {
            throw new Error(`Expected 400 DUPLICATE_IDENTIFIER for duplicate email, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 12. Duplicate Employee ID
        await assertCase(12, 'Duplicate Employee ID', async () => {
          const res = await request(AUTH_PORT, '/api/v1/admin/employees', 'POST', { 'x-admin-key': 'nkb-admin-dev-key' }, {
            employee_id: 'EMP-000001',
            email: 'unique.email@nkbmanufacturing.com',
            name: 'New Test Employee',
            password: 'Password123!'
          });
          if (res.statusCode !== 400 || res.body.error_code !== 'DUPLICATE_IDENTIFIER') {
            throw new Error(`Expected 400 DUPLICATE_IDENTIFIER for duplicate ID, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 13. Successful login audit log
        await assertCase(13, 'Successful login audit log', async () => {
          const res = await request(AUTH_PORT, '/api/v1/admin/audit-logs', 'GET', { 'x-admin-key': 'nkb-admin-dev-key' });
          if (res.statusCode !== 200 || !res.body.success || !Array.isArray(res.body.logs)) {
            throw new Error(`Expected audit logs array, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
          const hasSuccessLog = res.body.logs.some(l => l.outcome === 'SUCCESS');
          if (!hasSuccessLog) throw new Error('Audit log did not record SUCCESS outcome');
        });

        // 14. Failed login audit log
        await assertCase(14, 'Failed login audit log', async () => {
          const res = await request(AUTH_PORT, '/api/v1/admin/audit-logs', 'GET', { 'x-admin-key': 'nkb-admin-dev-key' });
          if (res.statusCode !== 200 || !res.body.success) throw new Error(`Expected audit logs, got ${res.statusCode}`);
          const hasFailureLog = res.body.logs.some(l => l.outcome === 'FAILURE');
          if (!hasFailureLog) throw new Error('Audit log did not record FAILURE outcome');
        });

        // 15. Account lockout threshold
        await assertCase(15, 'Account lockout threshold', async () => {
          for (let i = 0; i < 4; i++) {
            await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-000123', password: 'BadPassword!', computer_name: 'NKB-PC-002' });
          }
          const lockRes = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-000123', password: 'Password123!', computer_name: 'NKB-PC-002' });
          if (lockRes.statusCode !== 401 || lockRes.body.error_code !== 'ACCOUNT_LOCKED') {
            throw new Error(`Expected ACCOUNT_LOCKED after 5 failures, got ${lockRes.statusCode}: ${JSON.stringify(lockRes.body)}`);
          }
        });

        // 16. Password reset
        await assertCase(16, 'Password reset', async () => {
          const resetRes = await request(AUTH_PORT, '/api/v1/admin/employees/EMP-000123/reset-password', 'POST', { 'x-admin-key': 'nkb-admin-dev-key' }, { new_password: 'NewPassword123!', force_change: false });
          if (resetRes.statusCode !== 200 || !resetRes.body.success) {
            throw new Error(`Expected password reset 200, got ${resetRes.statusCode}: ${JSON.stringify(resetRes.body)}`);
          }
          const loginRes = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-000123', password: 'NewPassword123!', computer_name: 'NKB-PC-002' });
          if (loginRes.statusCode !== 200 || !loginRes.body.success) {
            throw new Error(`Expected successful login after password reset, got ${loginRes.statusCode}`);
          }
        });

        // 17. Disabled account cannot log in
        await assertCase(17, 'Disabled account cannot log in', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'disabled.user@nkbmanufacturing.com', password: 'Password123!', computer_name: 'NKB-PC-001' });
          if (res.statusCode !== 401 || res.body.error_code !== 'ACCOUNT_DISABLED') {
            throw new Error(`Expected ACCOUNT_DISABLED, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 18. Unauthorized computer cannot log in
        await assertCase(18, 'Unauthorized computer cannot log in', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'earljohn@nkbmanufacturing.com', password: 'Password123!', computer_name: 'NKB-PC-UNAUTHORIZED' });
          if (res.statusCode !== 401 || res.body.error_code !== 'UNAUTHORIZED_COMPUTER') {
            throw new Error(`Expected UNAUTHORIZED_COMPUTER, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 19. AD user lookup
        await assertCase(19, 'AD user lookup', async () => {
          const res = await adClient.lookupUser('EMP-000001');
          if (!res.success || res.user.windows_username !== 'EMP-000001') {
            throw new Error(`AD User lookup failed: ${JSON.stringify(res)}`);
          }
        });

        // 20. AD account status lookup
        await assertCase(20, 'AD account status lookup', async () => {
          const res = await adClient.getAccountStatus('EMP-000001');
          if (!res.success || res.status !== 'Enabled') {
            throw new Error(`AD account status lookup failed: ${JSON.stringify(res)}`);
          }
        });

        // 21. Delegated account disable
        await assertCase(21, 'Delegated account disable', async () => {
          const res = await adClient.disableAccount('EMP-000123');
          if (!res.success || res.status !== 'Disabled') {
            throw new Error(`AD delegated account disable failed: ${JSON.stringify(res)}`);
          }
        });

        // 22. Delegated account enable
        await assertCase(22, 'Delegated account enable', async () => {
          const res = await adClient.enableAccount('EMP-000123');
          if (!res.success || res.status !== 'Enabled') {
            throw new Error(`AD delegated account enable failed: ${JSON.stringify(res)}`);
          }
        });

        // 23. Password reset operation
        await assertCase(23, 'Password reset operation', async () => {
          const res = await adClient.resetPassword('EMP-000123', 'StrongADPassword2026!');
          if (!res.success) {
            throw new Error(`AD password reset operation failed: ${JSON.stringify(res)}`);
          }
        });

        // 24. Unauthorized caller rejected (missing/invalid service token)
        await assertCase(24, 'Unauthorized caller rejected', async () => {
          const res = await request(AD_PORT, '/internal/ad/user/lookup', 'POST', { 'x-service-token': 'INVALID_TOKEN_TEST' }, { windows_username: 'EMP-000001' });
          if (res.statusCode !== 401 || res.body.error_code !== 'UNAUTHORIZED_SERVICE_CALL') {
            throw new Error(`Expected 401 UNAUTHORIZED_SERVICE_CALL, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 25. Insufficient privilege rejected
        await assertCase(25, 'Insufficient privilege rejected', async () => {
          const res = await request(AD_PORT, '/internal/ad/user/disable', 'POST', {}, { windows_username: 'EMP-000001' });
          if (res.statusCode !== 401 || res.body.error_code !== 'UNAUTHORIZED_SERVICE_CALL') {
            throw new Error(`Expected 401 UNAUTHORIZED_SERVICE_CALL for missing header, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 26. AD operation failure handled correctly
        await assertCase(26, 'AD operation failure handled correctly', async () => {
          const res = await adClient.lookupUser('EMP-NONEXISTENT');
          if (res.success) {
            throw new Error(`Expected failure for non-existent AD account, got success`);
          }
        });

        // 27. Reconciliation detects missing AD account
        await assertCase(27, 'Reconciliation detects missing AD account', async () => {
          const mockEmployees = [{ employee_id: 'EMP-999999', email: 'missing@nkb.com', status: 'Active' }];
          const res = await adClient.reconcileIdentities(mockEmployees, [], []);
          if (!res.success || !res.discrepancies.some(d => d.type === 'MISSING_AD_ACCOUNT')) {
            throw new Error(`Reconciliation did not detect missing AD account: ${JSON.stringify(res)}`);
          }
        });

        // 28. Reconciliation detects incorrect mapping
        await assertCase(28, 'Reconciliation detects incorrect mapping', async () => {
          const mockEmployees = [{ employee_id: 'EMP-000001', email: 'wrong.email@nkb.com', status: 'Active' }];
          const res = await adClient.reconcileIdentities(mockEmployees, [], []);
          if (!res.success || !res.discrepancies.some(d => d.type === 'EMAIL_MISMATCH')) {
            throw new Error(`Reconciliation did not detect email mismatch: ${JSON.stringify(res)}`);
          }
        });

        // 29. Reconciliation detects disabled NKB + enabled AD
        await assertCase(29, 'Reconciliation detects disabled NKB + enabled AD', async () => {
          const mockEmployees = [{ employee_id: 'EMP-000001', email: 'earljohn@nkbmanufacturing.com', status: 'Disabled' }];
          const res = await adClient.reconcileIdentities(mockEmployees, [], []);
          if (!res.success || !res.discrepancies.some(d => d.type === 'STATUS_MISMATCH_NKB_DISABLED_AD_ENABLED')) {
            throw new Error(`Reconciliation did not detect NKB Disabled + AD Enabled mismatch: ${JSON.stringify(res)}`);
          }
        });

        // 30. Reconciliation detects enabled NKB + disabled AD
        await assertCase(30, 'Reconciliation detects enabled NKB + disabled AD', async () => {
          const mockEmployees = [{ employee_id: 'EMP-000999', email: 'disabled.user@nkbmanufacturing.com', status: 'Active' }];
          const res = await adClient.reconcileIdentities(mockEmployees, [], []);
          if (!res.success || !res.discrepancies.some(d => d.type === 'STATUS_MISMATCH_NKB_ENABLED_AD_DISABLED')) {
            throw new Error(`Reconciliation did not detect NKB Active + AD Disabled mismatch: ${JSON.stringify(res)}`);
          }
        });

        // 31. Computer assignment mismatch detected
        await assertCase(31, 'Computer assignment mismatch detected', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-000123', password: 'NewPassword123!', computer_name: 'NKB-PC-UNASSIGNED' });
          if (res.statusCode !== 401 || res.body.error_code !== 'UNAUTHORIZED_COMPUTER') {
            throw new Error(`Expected UNAUTHORIZED_COMPUTER, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
          }
        });

        // 32. No password appears in logs
        await assertCase(32, 'No password appears in logs', async () => {
          const res = await request(AUTH_PORT, '/api/v1/admin/audit-logs', 'GET', { 'x-admin-key': 'nkb-admin-dev-key' });
          const jsonStr = JSON.stringify(res.body);
          if (jsonStr.includes('NewPassword123!') || jsonStr.includes('Password123!')) {
            throw new Error('Password leak detected in audit logs!');
          }
        });

        // 33. No password appears in API responses
        await assertCase(33, 'No password appears in API responses', async () => {
          const res = await request(AUTH_PORT, '/api/v1/auth/verify', 'POST', {}, { identifier: 'EMP-000001', password: 'Password123!', computer_name: 'NKB-PC-001' });
          if (res.body.password || res.body.password_hash || res.body.ad_password) {
            throw new Error('Password field exposed in API response!');
          }
        });

        // 34. Service authentication failure rejected
        await assertCase(34, 'Service authentication failure rejected', async () => {
          const badRes = await adClient.lookupUser('EMP-000001', 'INVALID_SECRET_TOKEN_REJECTED');
          if (badRes.statusCode !== 401 || badRes.error_code !== 'UNAUTHORIZED_SERVICE_CALL') {
            throw new Error(`Expected 401 UNAUTHORIZED_SERVICE_CALL for bad service token, got: ${JSON.stringify(badRes)}`);
          }
        });

      } catch (e) {
        console.error('Test Suite Fatal Error:', e);
      } finally {
        authServer.close(() => {
          adServer.close(() => {
            console.log(`\n======================================================`);
            console.log(` TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
            console.log(`======================================================\n`);
            process.exit(failed > 0 ? 1 : 0);
          });
        });
      }
    });
  });
}

runAll34Tests();
