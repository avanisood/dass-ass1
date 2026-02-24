const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const registrationController = require('../controllers/registrationController');

// POST /api/registrations - Register for event
router.post('/', authenticate, authorize('participant'), registrationController.registerForEvent);

// GET /api/registrations/my-registrations - Get user's registrations
router.get('/my-registrations', authenticate, registrationController.getMyRegistrations);

// GET /api/registrations/check/:eventId - Check if user is registered for event
router.get('/check/:eventId', authenticate, registrationController.checkRegistration);

// POST /api/registrations/attendance/mark - Mark attendance for event (Organizer only)
router.post('/attendance/mark', authenticate, authorize('organizer'), registrationController.markAttendance);

module.exports = router;
