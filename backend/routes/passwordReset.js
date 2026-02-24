const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const bcrypt = require('bcrypt');

// GET /api/password-reset/my-request - Get current organizer's pending reset request
router.get('/my-request', authenticate, authorize('organizer'), async (req, res) => {
    try {
        const request = await PasswordResetRequest.findOne({
            organizerId: req.user.id,
            status: 'pending'
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, request });
    } catch (error) {
        console.error('Get my request error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch request', error: error.message });
    }
});

// POST /api/password-reset/request - Organizer submits password reset request
router.post('/request', authenticate, authorize('organizer'), async (req, res) => {
    try {
        // Check for existing pending request
        const existing = await PasswordResetRequest.findOne({
            organizerId: req.user.id,
            status: 'pending'
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending password reset request'
            });
        }

        const { reason } = req.body;
        const newRequest = await PasswordResetRequest.create({
            organizerId: req.user.id,
            status: 'pending',
            reason: reason || ''
        });

        res.status(201).json({
            success: true,
            message: 'Password reset request submitted. Admin will process it shortly.',
            request: newRequest
        });
    } catch (error) {
        console.error('Submit request error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit request', error: error.message });
    }
});

// GET /api/password-reset/requests - Admin: list all pending reset requests
router.get('/requests', authenticate, authorize('admin'), async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find({ status: 'pending' })
            .populate('organizerId', 'organizerName email')
            .sort({ createdAt: 1 });

        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error('Get all requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requests', error: error.message });
    }
});

// POST /api/password-reset/approve/:id - Admin: approve and generate new password
router.post('/approve/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const request = await PasswordResetRequest.findById(id).populate('organizerId');
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Generate new password
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let newPassword = '';
        for (let i = 0; i < 12; i++) {
            newPassword += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Update organizer's password
        const organizer = await User.findById(request.organizerId._id);
        organizer.password = newPassword; // pre-save hook hashes it
        await organizer.save();

        request.status = 'approved';
        request.resolvedDate = new Date();
        request.resolvedBy = req.user.id;
        await request.save();

        res.status(200).json({
            success: true,
            message: 'Password reset approved',
            organizerName: organizer.organizerName,
            newCredentials: {
                email: organizer.email,
                password: newPassword,
                note: 'Share these credentials with the organizer. Password will not be shown again.'
            }
        });
    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({ success: false, message: 'Failed to approve request', error: error.message });
    }
});

// POST /api/password-reset/reject/:id - Admin: reject request
router.post('/reject/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const request = await PasswordResetRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        request.status = 'rejected';
        request.resolvedDate = new Date();
        request.resolvedBy = req.user.id;
        await request.save();

        res.status(200).json({ success: true, message: 'Password reset request rejected' });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject request', error: error.message });
    }
});

module.exports = router;
