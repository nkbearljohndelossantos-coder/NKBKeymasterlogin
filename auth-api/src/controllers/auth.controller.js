const AuthService = require('../services/auth.service');

class AuthController {
  /**
   * Credential Provider Authentication Verification Endpoint
   * POST /api/v1/auth/verify
   * Request Body: { identifier, password, computer_name }
   */
  static async verify(req, res, next) {
    try {
      const { identifier, password, computer_name } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';

      const result = await AuthService.verifyCredentials({
        identifier,
        password,
        computer_name,
        ip_address: clientIp
      });

      if (!result.success) {
        return res.status(401).json(result);
      }

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
