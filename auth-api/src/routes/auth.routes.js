const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authRateLimiter } = require('../middleware/rateLimiter.middleware');

/**
 * @route POST /api/v1/auth/verify
 * @desc Verify NKB Credential Provider login request (Email or Employee ID)
 * @access Public / SYSTEM Credential Provider
 */
router.post('/verify', authRateLimiter, AuthController.verify);

module.exports = router;
