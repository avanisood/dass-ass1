const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const messageController = require('../controllers/messageController');

// Get unread announcements for the logged-in user
router.get('/messages/notifications/unread', authenticate, messageController.getUnreadAnnouncements);
router.put('/messages/notifications/read', authenticate, messageController.markNotificationsRead);

// Get messages for an event
router.get('/events/:eventId/messages', authenticate, messageController.getMessages);

// Post a message to an event
router.post('/events/:eventId/messages', authenticate, messageController.createMessage);

// Delete a message
router.delete('/messages/:id', authenticate, messageController.deleteMessage);

// Pin/unpin a message
router.put('/messages/:id/pin', authenticate, messageController.togglePin);

// Toggle reaction on a message
router.put('/messages/:id/react', authenticate, messageController.toggleReaction);

module.exports = router;
