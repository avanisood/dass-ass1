const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

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

module.exports = router;
