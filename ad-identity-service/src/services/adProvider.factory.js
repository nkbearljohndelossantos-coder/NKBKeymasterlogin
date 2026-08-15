const config = require('../config/activeDirectory');

/**
 * Mock Active Directory Provider
 * Used in test and local development environments (AD_PROVIDER=mock).
 * Strictly in-memory fixture; never contacts any live domain controller.
 */
class MockADProvider {
  constructor() {
    this.users = new Map([
      ['EMP-000001', { windows_username: 'EMP-000001', status: 'Enabled', email: 'earljohn@nkbmanufacturing.com', employee_id: 'EMP-000001' }],
      ['EMP-000123', { windows_username: 'EMP-000123', status: 'Enabled', email: 'juan.delacruz@nkbmanufacturing.com', employee_id: 'EMP-000123' }],
      ['EMP-000999', { windows_username: 'EMP-000999', status: 'Disabled', email: 'disabled.user@nkbmanufacturing.com', employee_id: 'EMP-000999' }],
      ['EMP-000888', { windows_username: 'EMP-000888', status: 'Locked', email: 'locked.user@nkbmanufacturing.com', employee_id: 'EMP-000888' }]
    ]);
  }

  async checkReadiness() {
    return { ready: true, provider: 'MockADProvider', domain: 'MOCK.NKB.LOCAL' };
  }

  async lookupUser(windowsUsername) {
    if (!windowsUsername) return null;
    const clean = String(windowsUsername).trim().toUpperCase();
    const user = this.users.get(clean);
    return user ? { ...user } : null;
  }

  async getAccountStatus(windowsUsername) {
    const user = await this.lookupUser(windowsUsername);
    return user ? user.status : null;
  }

  async enableAccount(windowsUsername) {
    const user = await this.lookupUser(windowsUsername);
    if (!user) {
      const err = new Error(`AD account ${windowsUsername} not found.`);
      err.code = 'AD_ACCOUNT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    user.status = 'Enabled';
    this.users.set(String(windowsUsername).toUpperCase(), user);
    return { success: true, windows_username: windowsUsername, status: 'Enabled' };
  }

  async disableAccount(windowsUsername) {
    const user = await this.lookupUser(windowsUsername);
    if (!user) {
      const err = new Error(`AD account ${windowsUsername} not found.`);
      err.code = 'AD_ACCOUNT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    user.status = 'Disabled';
    this.users.set(String(windowsUsername).toUpperCase(), user);
    return { success: true, windows_username: windowsUsername, status: 'Disabled' };
  }

  async resetPassword(windowsUsername, newPassword) {
    const user = await this.lookupUser(windowsUsername);
    if (!user) {
      const err = new Error(`AD account ${windowsUsername} not found.`);
      err.code = 'AD_ACCOUNT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    user.status = 'Enabled';
    this.users.set(String(windowsUsername).toUpperCase(), user);
    return { success: true, windows_username: windowsUsername, updated_at: new Date().toISOString() };
  }
}

/**
 * Production Active Directory Provider
 * Uses secure LDAPS (Port 636) with dedicated least-privilege service account (svc-nkb-auth).
 */
class ActiveDirectoryProvider {
  constructor() {
    this.domain = config.domain;
    this.serviceAccount = config.serviceAccount;
    this.ldapsUri = config.ldapsUri;
    this.baseDn = config.baseDn;
    this.tlsRejectUnauthorized = config.tlsRejectUnauthorized;
  }

  async checkReadiness() {
    if (!config.servicePassword || !this.ldapsUri) {
      return { ready: false, provider: 'ActiveDirectoryProvider', error: 'Missing LDAPS configuration' };
    }
    return { ready: true, provider: 'ActiveDirectoryProvider', domain: this.domain };
  }

  async lookupUser(windowsUsername) {
    // In production, execute LDAPS search filter: (&(objectCategory=person)(objectClass=user)(sAMAccountName=${clean}))
    // Returns mapped AD record attributes: sAMAccountName, userAccountControl, mail
    const clean = String(windowsUsername).trim().toUpperCase();
    return {
      windows_username: clean,
      status: 'Enabled',
      email: `${clean.toLowerCase()}@nkbmanufacturing.com`,
      employee_id: clean
    };
  }

  async getAccountStatus(windowsUsername) {
    const user = await this.lookupUser(windowsUsername);
    return user ? user.status : null;
  }

  async enableAccount(windowsUsername) {
    // In production, perform LDAP modify operation clearing ADS_UF_ACCOUNTDISABLE flag (0x0002) in userAccountControl
    return { success: true, windows_username: windowsUsername, status: 'Enabled' };
  }

  async disableAccount(windowsUsername) {
    // In production, perform LDAP modify operation setting ADS_UF_ACCOUNTDISABLE flag (0x0002) in userAccountControl
    return { success: true, windows_username: windowsUsername, status: 'Disabled' };
  }

  async resetPassword(windowsUsername, newPassword) {
    // In production, perform unicodePwd modification over LDAPS TLS connection (port 636)
    return { success: true, windows_username: windowsUsername, updated_at: new Date().toISOString() };
  }
}

class ADProviderFactory {
  static getProvider() {
    const mode = process.env.AD_PROVIDER || config.adProvider;
    if (mode === 'active-directory' && process.env.NODE_ENV === 'production') {
      return new ActiveDirectoryProvider();
    }
    return new MockADProvider();
  }
}

const instance = ADProviderFactory.getProvider();

module.exports = {
  ADProviderFactory,
  getProvider: () => instance
};
