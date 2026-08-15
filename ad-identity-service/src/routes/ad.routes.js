const express = require('express');
const router = express.Router();
const ADController = require('../controllers/ad.controller');
const { authenticateServiceToken } = require('../middleware/serviceAuth.middleware');

// Protect all internal AD Identity Service endpoints with service-to-service token authentication
router.use(authenticateServiceToken);

/**
 * @route POST /internal/ad/user/lookup
 * @desc Lookup Active Directory user account
 */
router.post('/user/lookup', ADController.lookupUser);

/**
 * @route POST /internal/ad/user/status
 * @desc Query Active Directory user status (Enabled / Disabled / Locked)
 */
router.post('/user/status', ADController.getStatus);

/**
 * @route POST /internal/ad/user/enable
 * @desc Enable Active Directory user account
 */
router.post('/user/enable', ADController.enableAccount);

/**
 * @route POST /internal/ad/user/disable
 * @desc Disable Active Directory user account
 */
router.post('/user/disable', ADController.disableAccount);

/**
 * @route POST /internal/ad/user/password-reset
 * @desc Reset Active Directory user password over LDAPS (Port 636)
 */
router.post('/user/password-reset', ADController.resetPassword);

/**
 * @route POST /internal/ad/reconcile
 * @desc Perform reconciliation audit between NKB MySQL and Active Directory DS
 */
router.post('/reconcile', ADController.reconcile);

module.exports = router;
