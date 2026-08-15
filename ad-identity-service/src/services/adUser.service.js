const { getProvider } = require('./adProvider.factory');

class ADUserService {
  async lookupUser(windowsUsername) {
    return getProvider().lookupUser(windowsUsername);
  }

  async getAccountStatus(windowsUsername) {
    return getProvider().getAccountStatus(windowsUsername);
  }
}

module.exports = new ADUserService();
