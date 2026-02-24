const bcrypt = require('bcrypt');
const User = require('../models/User');
const Event = require('../models/Event');

/**
 * Update user profile
 * PUT /api/users/profile
 * @access Private
 */
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, contactNumber, college, interests } = req.body;

        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update allowed fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (contactNumber !== undefined) user.contactNumber = contactNumber;
        if (college !== undefined) user.college = college;
        if (interests && Array.isArray(interests)) user.interests = interests;

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({ success: true, message: 'Profile updated successfully', user: userResponse });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
};

/**
 * Update password
 * PUT /api/users/password
 * @access Private
 */
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }

        // Save new password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ success: false, message: 'Failed to update password', error: error.message });
    }
};

/**
 * Toggle follow/unfollow an organizer
 * POST /api/users/organizers/:id/follow
 * @access Private (Participants only)
 */
exports.toggleFollowOrganizer = async (req, res) => {
    try {
        const { id: organizerId } = req.params;

        // Verify target is actually an organizer
        const organizer = await User.findById(organizerId);
        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({ success: false, message: 'Organizer not found' });
        }

        const user = await User.findById(req.user.id);

        // Check if already following
        const isFollowing = user.followedOrganizers && user.followedOrganizers.includes(organizerId);

        if (isFollowing) {
            // Unfollow
            user.followedOrganizers = user.followedOrganizers.filter(id => id.toString() !== organizerId.toString());
        } else {
            // Follow
            if (!user.followedOrganizers) user.followedOrganizers = [];
            user.followedOrganizers.push(organizerId);
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
            isFollowing: !isFollowing
        });
    } catch (error) {
        console.error('Toggle follow error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle follow status', error: error.message });
    }
};

/**
 * Get an organizer's public profile and their events
 * GET /api/users/organizers/:id
 * @access Public/Private
 */
exports.getOrganizerById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid organizer ID format' 
            });
        }

        const organizer = await User.findById(id).select('organizerName category description contactEmail createdAt role');

        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({ success: false, message: 'Organizer not found' });
        }

        // Get published events by this organizer
        const events = await Event.find({ organizerId: id, status: 'published' })
            .select('name type eventStartDate eventEndDate eligibility registrationFee image status')
            .sort({ eventStartDate: 1 })
            .lean();

        const now = new Date();
        const upcomingEvents = events.filter(e => new Date(e.eventStartDate) >= now);
        const pastEvents = events.filter(e => new Date(e.eventStartDate) < now);

        res.status(200).json({
            success: true,
            organizer,
            upcomingEvents,
            pastEvents
        });
    } catch (error) {
        console.error('Get organizer by ID error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch organizer details', error: error.message });
    }
};
