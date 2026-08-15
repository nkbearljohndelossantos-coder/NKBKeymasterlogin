const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { authenticateAdminToken } = require('../middleware/auth.middleware');

// Protect all Admin management routes
router.use(authenticateAdminToken);

/**
 * @route POST /api/v1/admin/employees
 * @desc Create new employee login account
 */
router.post('/employees', AdminController.createEmployee);

/**
 * @route PATCH /api/v1/admin/employees/:id/status
 * @desc Update account status (Activate / Disable / Lock)
 */
router.patch('/employees/:id/status', AdminController.updateStatus);

/**
 * @route POST /api/v1/admin/employees/:id/reset-password
 * @desc Reset password and optionally force password change
 */
router.post('/employees/:id/reset-password', AdminController.resetPassword);

/**
 * @route POST /api/v1/admin/employees/:id/computers
 * @desc Assign employee to workstation
 */
router.post('/employees/:id/computers', AdminController.assignComputer);

/**
 * @route POST /api/v1/admin/reconcile
 * @desc Run Administrative Identity Reconciliation across NKB MySQL and Active Directory
 */
router.post('/reconcile', AdminController.reconcileIdentities);

/**
 * @route GET /api/v1/admin/audit-logs
 * @desc Retrieve authentication audit logs
 */
router.get('/audit-logs', AdminController.getAuditLogs);

module.exports = router;
