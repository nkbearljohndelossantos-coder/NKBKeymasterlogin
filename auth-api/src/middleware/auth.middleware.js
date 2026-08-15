const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

/**
 * Admin API JWT Authentication Middleware
 */
function authenticateAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Allow dev API key header in dev/test mode
    if ((!process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && req.headers['x-admin-key'] === 'nkb-admin-dev-key') {
      req.user = { role: 'IT Admin', employee_id: 'EMP-000001' };
      return next();
    }
    return res.status(401).json({
      success: false,
      error_code: 'UNAUTHORIZED',
      message: 'Access token required for IT Admin endpoints.'
    });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error_code: 'FORBIDDEN',
        message: 'Invalid or expired administrative access token.'
      });
    }
    req.user = user;
    next();
  });
}

module.exports = {
  authenticateAdminToken
};
