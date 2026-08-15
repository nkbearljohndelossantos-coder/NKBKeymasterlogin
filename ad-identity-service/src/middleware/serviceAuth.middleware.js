const crypto = require('crypto');
const config = require('../config/activeDirectory');

/**
 * Service-to-Service Authentication Middleware
 * Enforces constant-time token comparison (crypto.timingSafeEqual) to prevent timing attacks.
 * Propagates correlation ID (x-correlation-id) across requests.
 */
function authenticateServiceToken(req, res, next) {
  const token = req.headers['x-service-token'];
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  const callerId = req.headers['x-caller-id'] || 'UNKNOWN_CALLER';

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return res.status(401).json({
      success: false,
      error_code: 'UNAUTHORIZED_SERVICE_CALL',
      message: 'Unauthorized service request.'
    });
  }

  const expectedToken = config.expectedToken;
  if (!expectedToken || expectedToken.length === 0) {
    console.error('[SECURITY ERROR] Service expected token is unconfigured.');
    return res.status(401).json({
      success: false,
      error_code: 'SERVICE_AUTH_UNAVAILABLE',
      message: 'Unauthorized service request.'
    });
  }

  try {
    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expectedToken);

    // Constant-time comparison
    if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
      return res.status(401).json({
        success: false,
        error_code: 'UNAUTHORIZED_SERVICE_CALL',
        message: 'Unauthorized service request.'
      });
    }
  } catch (err) {
    return res.status(401).json({
      success: false,
      error_code: 'UNAUTHORIZED_SERVICE_CALL',
      message: 'Unauthorized service request.'
    });
  }

  req.serviceCaller = {
    caller_id: callerId,
    correlation_id: correlationId,
    authenticated_at: new Date().toISOString()
  };

  next();
}

module.exports = {
  authenticateServiceToken
};
