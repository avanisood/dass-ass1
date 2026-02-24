const Message = require('../models/Message');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');

/**
 * Get unread announcements for the logged-in user
 * GET /api/messages/notifications/unread
 */
exports.getUnreadAnnouncements = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get all events the user is registered for
        const registrations = await Registration.find({ participantId: userId }).select('eventId').lean();
        const registeredEventIds = registrations.map(reg => reg.eventId);

        if (registeredEventIds.length === 0) {
            return res.status(200).json({ success: true, count: 0, announcements: [] });
        }

        // Find announcements in these events created after lastNotificationCheck
        const unreadAnnouncements = await Message.find({
            eventId: { $in: registeredEventIds },
            type: 'announcement',
            createdAt: { $gt: user.lastNotificationCheck || new Date(0) },
            deleted: false
        })
            .populate('eventId', 'name')
            .populate('userId', 'organizerName firstName lastName')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: unreadAnnouncements.length,
            announcements: unreadAnnouncements
        });
    } catch (error) {
        console.error('Get unread announcements error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unread announcements', error: error.message });
    }
};

/**
 * Mark notifications as read for the logged-in user (updates lastNotificationCheck)
 * PUT /api/messages/notifications/read
 */
exports.markNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await User.findByIdAndUpdate(userId, {
            lastNotificationCheck: Date.now()
        });

        res.status(200).json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Mark notifications read error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark notifications as read', error: error.message });
    }
};

/**
 * Get messages for an event (paginated)
 * GET /api/events/:eventId/messages
 */
exports.getMessages = async (req, res) => {
    try {
        const { eventId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Get top-level messages (not replies)
        const messages = await Message.find({
            eventId,
            parentId: null,
            deleted: false
        })
            .sort({ pinned: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'firstName lastName organizerName role email')
            .lean();

        // Get replies for these messages
        const messageIds = messages.map(m => m._id);
        const replies = await Message.find({
            parentId: { $in: messageIds },
            deleted: false
        })
            .sort({ createdAt: 1 })
            .populate('userId', 'firstName lastName organizerName role email')
            .lean();

        // Group replies by parentId
        const repliesByParent = {};
        replies.forEach(reply => {
            const pid = reply.parentId.toString();
            if (!repliesByParent[pid]) repliesByParent[pid] = [];
            repliesByParent[pid].push(reply);
        });

        // Attach replies to messages
        const messagesWithReplies = messages.map(msg => ({
            ...msg,
            replies: repliesByParent[msg._id.toString()] || []
        }));

        const total = await Message.countDocuments({ eventId, parentId: null, deleted: false });

        res.json({
            success: true,
            messages: messagesWithReplies,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, message: 'Failed to load messages' });
    }
};

/**
 * Post a new message
 * POST /api/events/:eventId/messages
 */
exports.createMessage = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { content, type, parentId } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        // Check if user is organizer for this event or registered participant
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const isOrganizer = event.organizerId.toString() === req.user.id;

        if (!isOrganizer) {
            // Check if participant is registered
            const registration = await Registration.findOne({
                eventId,
                participantId: req.user.id,
                status: { $ne: 'cancelled' }
            });
            if (!registration) {
                return res.status(403).json({
                    success: false,
                    message: 'You must be registered for this event to post messages'
                });
            }
        }

        // Only organizers can post announcements
        const messageType = (type === 'announcement' && isOrganizer) ? 'announcement' : 'message';

        const message = await Message.create({
            eventId,
            userId: req.user.id,
            content: content.trim(),
            type: messageType,
            parentId: parentId || null
        });

        // Populate user info for the response
        const populated = await Message.findById(message._id)
            .populate('userId', 'firstName lastName organizerName role email')
            .lean();

        // Emit via Socket.IO
        const io = req.app.get('io');
        if (io) {
            console.log(`Emitting new_message to event:${eventId}`);
            io.to(`event:${eventId}`).emit('new_message', {
                ...populated,
                replies: []
            });
        } else {
            console.log('Socket IO instance not found on req.app');
        }

        res.status(201).json({ success: true, message: populated });
    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({ success: false, message: 'Failed to post message' });
    }
};

/**
 * Delete a message (organizer or author)
 * DELETE /api/messages/:id
 */
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Check permission: author or event organizer
        const event = await Event.findById(message.eventId);
        const isOrganizer = event && event.organizerId.toString() === req.user.id;
        const isAuthor = message.userId.toString() === req.user.id;

        if (!isOrganizer && !isAuthor) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
        }

        message.deleted = true;
        await message.save();

        // Emit via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(`event:${message.eventId}`).emit('delete_message', {
                messageId: message._id,
                parentId: message.parentId
            });
        }

        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
};

/**
 * Pin/unpin a message (organizer only)
 * PUT /api/messages/:id/pin
 */
exports.togglePin = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const event = await Event.findById(message.eventId);
        if (!event || event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the event organizer can pin messages' });
        }

        message.pinned = !message.pinned;
        await message.save();

        // Emit via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(`event:${message.eventId}`).emit('pin_message', {
                messageId: message._id,
                pinned: message.pinned
            });
        }

        res.json({ success: true, pinned: message.pinned });
    } catch (error) {
        console.error('Toggle pin error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle pin' });
    }
};

/**
 * Toggle reaction on a message
 * PUT /api/messages/:id/react
 */
exports.toggleReaction = async (req, res) => {
    try {
        const { emoji } = req.body;
        if (!emoji) {
            return res.status(400).json({ success: false, message: 'Emoji is required' });
        }

        const allowedEmoji = ['👍', '❤️', '😂', '🎉', '🤔'];
        if (!allowedEmoji.includes(emoji)) {
            return res.status(400).json({ success: false, message: 'Invalid emoji' });
        }

        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Get current users who reacted with this emoji
        const currentReactions = message.reactions.get(emoji) || [];
        const userIndex = currentReactions.findIndex(id => id.toString() === req.user.id);

        if (userIndex > -1) {
            // Remove reaction
            currentReactions.splice(userIndex, 1);
        } else {
            // Add reaction
            currentReactions.push(req.user.id);
        }

        message.reactions.set(emoji, currentReactions);
        await message.save();

        // Build reactions object for response
        const reactionsObj = {};
        message.reactions.forEach((users, key) => {
            reactionsObj[key] = users;
        });

        // Emit via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(`event:${message.eventId}`).emit('reaction_update', {
                messageId: message._id,
                reactions: reactionsObj
            });
        }

        res.json({ success: true, reactions: reactionsObj });
    } catch (error) {
        console.error('Toggle reaction error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle reaction' });
    }
};
