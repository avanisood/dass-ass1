const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const User = require('./models/User');

/**
 * Initialize Socket.IO handler
 * @param {import('socket.io').Server} io
 */
module.exports = (io) => {
    // Authentication middleware: verify JWT token on connect
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        // Register event listeners synchronously to avoid race conditions!

        // Join an event room
        socket.on('join_event', (eventId) => {
            console.log(`Socket ${socket.id} user ${socket.userId} joining event:${eventId}`);
            socket.join(`event:${eventId}`);
            socket.currentEvent = eventId;
        });

        // Leave an event room
        socket.on('leave_event', (eventId) => {
            socket.leave(`event:${eventId}`);
            socket.currentEvent = null;
        });

        // Typing indicator
        socket.on('typing', (eventId) => {
            socket.to(`event:${eventId}`).emit('user_typing', {
                userId: socket.userId,
                userName: socket.userName || 'Someone',
            });
        });

        // Stop typing indicator
        socket.on('stop_typing', (eventId) => {
            socket.to(`event:${eventId}`).emit('user_stop_typing', {
                userId: socket.userId,
            });
        });

        socket.on('disconnect', () => {
            // Clean up typing indicators
            if (socket.currentEvent) {
                socket.to(`event:${socket.currentEvent}`).emit('user_stop_typing', {
                    userId: socket.userId,
                });
            }
        });

        // Fetch user info for display asynchronously (won't block event registrations)
        (async () => {
            try {
                const user = await User.findById(socket.userId).select('firstName lastName organizerName role').lean();
                socket.userName = user?.role === 'organizer'
                    ? user.organizerName
                    : `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
                socket.userRole = user?.role;
            } catch (e) {
                socket.userName = 'Unknown';
            }
        })();
    });

    return io;
};
