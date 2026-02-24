const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const eventController = require('../controllers/eventController');

// GET /api/events - Browse events (with filters, search) - Public access
router.get('/', eventController.getEvents);

// GET /api/events/:id - Event details - Public access
router.get('/:id', eventController.getEventById);

// GET /api/events/:id/registrations - Get event registrations (Organizer only)
router.get('/:id/registrations', authenticate, authorize(['organizer', 'admin']), eventController.getEventRegistrations);

// Team Management Routes (Participant)
router.post('/:id/teams', authenticate, eventController.createTeam);
router.post('/:id/teams/join', authenticate, eventController.joinTeam);
router.get('/:id/team', authenticate, eventController.getTeam);

// POST /api/events - Create event (Organizer only)
router.post('/', authenticate, authorize('organizer'), eventController.createEvent);

// PUT /api/events/:id - Update event (Organizer only)
router.put('/:id', authenticate, authorize(['organizer', 'admin']), eventController.updateEvent);

// PUT /api/events/:id/status - Update event status (Organizer only)
router.put('/:id/status', authenticate, authorize(['organizer', 'admin']), eventController.updateEventStatus);

// DELETE /api/events/:id - Delete event (Organizer only)
router.delete('/:id', authenticate, authorize(['organizer', 'admin']), eventController.deleteEvent);

module.exports = router;
