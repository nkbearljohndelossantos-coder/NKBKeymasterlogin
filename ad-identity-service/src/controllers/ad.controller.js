const adUserService = require('../services/adUser.service');
const adAccountService = require('../services/adAccount.service');
const adPasswordService = require('../services/adPassword.service');
const adReconciliationService = require('../services/adReconciliation.service');

class ADController {
  static async lookupUser(req, res, next) {
    try {
      const { windows_username } = req.body;
      if (!windows_username) {
        return res.status(400).json({ success: false, error_code: 'MISSING_USERNAME', message: 'windows_username is required.' });
      }
      const user = await adUserService.lookupUser(windows_username);
      if (!user) {
        return res.status(404).json({ success: false, error_code: 'AD_USER_NOT_FOUND', message: `AD User ${windows_username} not found.` });
      }
      return res.status(200).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  static async getStatus(req, res, next) {
    try {
      const { windows_username } = req.body;
      if (!windows_username) {
        return res.status(400).json({ success: false, error_code: 'MISSING_USERNAME', message: 'windows_username is required.' });
      }
      const status = await adUserService.getAccountStatus(windows_username);
      if (!status) {
        return res.status(404).json({ success: false, error_code: 'AD_USER_NOT_FOUND', message: `AD User ${windows_username} not found.` });
      }
      return res.status(200).json({ success: true, windows_username, status });
    } catch (err) {
      next(err);
    }
  }

  static async enableAccount(req, res, next) {
    try {
      const { windows_username } = req.body;
      if (!windows_username) {
        return res.status(400).json({ success: false, error_code: 'MISSING_USERNAME', message: 'windows_username is required.' });
      }
      const result = await adAccountService.enableAccount(windows_username);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async disableAccount(req, res, next) {
    try {
      const { windows_username } = req.body;
      if (!windows_username) {
        return res.status(400).json({ success: false, error_code: 'MISSING_USERNAME', message: 'windows_username is required.' });
      }
      const result = await adAccountService.disableAccount(windows_username);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { windows_username, new_password } = req.body;
      if (!windows_username || !new_password) {
        return res.status(400).json({ success: false, error_code: 'MISSING_FIELDS', message: 'windows_username and new_password are required.' });
      }
      const result = await adPasswordService.resetPassword(windows_username, new_password);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async reconcile(req, res, next) {
    try {
      const { employees, mappings, computers } = req.body;
      const result = await adReconciliationService.reconcile(employees || [], mappings || [], computers || []);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ADController;
