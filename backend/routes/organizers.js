const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const adminController = require('../controllers/adminController');

// GET /api/organizers - List all organizers (Admin only)
router.get('/', authenticate, authorize('admin'), adminController.getOrganizers);

// POST /api/organizers - Create organizer account (Admin only)
router.post('/', authenticate, authorize('admin'), adminController.createOrganizer);

// DELETE /api/organizers/:id - Remove organizer account (Admin only)
router.delete('/:id', authenticate, authorize('admin'), adminController.deleteOrganizer);

// PUT /api/organizers/:id - Update organizer account (Admin only)
router.put('/:id', authenticate, authorize('admin'), adminController.updateOrganizer);

module.exports = router;
