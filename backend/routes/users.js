const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');
const userController = require('../controllers/userController');

// GET /api/users/profile - Get current user's own profile
router.get('/profile', authenticate, async (req, res) => {
    try {
        const userObj = req.user.toObject ? req.user.toObject() : req.user;
        delete userObj.password;
        res.status(200).json({ success: true, user: userObj });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get profile', error: error.message });
    }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, userController.updateProfile);

// PUT /api/users/password - Update user password
router.put('/password', authenticate, userController.updatePassword);

// GET /api/users/organizers - List all organizers (requires authentication)
router.get('/organizers', authenticate, async (req, res) => {
    try {
        const User = require('../models/User');
        const organizers = await User.find({ role: 'organizer' })
            .select('organizerName category description contactEmail createdAt')
            .lean();
        res.status(200).json({ success: true, count: organizers.length, organizers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch organizers', error: error.message });
    }
});

// GET /api/users/organizers/:id - Get organizer details
router.get('/organizers/:id', optionalAuthenticate, userController.getOrganizerById);

// POST /api/users/organizers/:id/follow - Toggle follow an organizer (Participants only)
router.post('/organizers/:id/follow', authenticate, userController.toggleFollowOrganizer);

module.exports = router;
