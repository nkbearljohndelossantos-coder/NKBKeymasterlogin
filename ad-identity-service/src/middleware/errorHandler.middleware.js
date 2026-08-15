/**
 * AD Identity Service Error Handling Middleware
 * Ensures error responses never expose credentials, secrets, or raw exception tracebacks.
 */
function errorHandler(err, req, res, next) {
  console.error('[AD Identity Service Error]:', err.message || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error_code: err.code || 'AD_SERVICE_ERROR',
    message: err.message || 'An error occurred during Active Directory identity operation.'
  });
}

module.exports = errorHandler;
