/**
 * Global Express Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error_code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred on the authentication server.'
  });
}

module.exports = errorHandler;
