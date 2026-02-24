const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const adminController = require('../controllers/adminController');

// GET /api/admin/stats - Get dashboard stats (Admin only)
router.get('/stats', authenticate, authorize('admin'), adminController.getStats);

// GET /api/admin/users - Get all users with optional role filter (Admin only)
router.get('/users', authenticate, authorize('admin'), adminController.getAllUsers);

module.exports = router;
