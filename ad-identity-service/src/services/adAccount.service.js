const { getProvider } = require('./adProvider.factory');

class ADAccountService {
  async enableAccount(windowsUsername) {
    return getProvider().enableAccount(windowsUsername);
  }

  async disableAccount(windowsUsername) {
    return getProvider().disableAccount(windowsUsername);
  }
}

module.exports = new ADAccountService();
