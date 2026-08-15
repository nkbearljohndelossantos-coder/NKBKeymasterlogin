const { getProvider } = require('./adProvider.factory');

class ADPasswordService {
  /**
   * Reset Active Directory Account Password over LDAPS (Port 636)
   * The password parameter is wiped from memory after transmission.
   * Passwords are NEVER returned, logged, or recorded in audit logs.
   */
  async resetPassword(windowsUsername, newPassword) {
    return getProvider().resetPassword(windowsUsername, newPassword);
  }
}

module.exports = new ADPasswordService();
