const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authController = require('../controllers/authController');

// POST /api/auth/register - Participant registration
router.post('/register', authController.register);

// POST /api/auth/login - All users login
router.post('/login', authController.login);

// GET /api/auth/me - Get current user (JWT validation)
router.get('/me', authenticate, authController.getMe);

// PUT /api/auth/profile - Update organizer profile
router.put('/profile', authenticate, authController.updateProfile);

// POST /api/auth/onboarding - Complete onboarding
router.post('/onboarding', authenticate, authController.completeOnboarding);

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
