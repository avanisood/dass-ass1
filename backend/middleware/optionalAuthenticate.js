const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Optional Authentication Middleware
 * Validates JWT token if present, but doesn't throw 401 if missing.
 * Attaches user to req object for personalized data (like event sorting).
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(); // Proceed without req.user
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Try to find user
        const user = await User.findById(decoded.id);

        if (user) {
            req.user = user;
        }

        next();
    } catch (error) {
        // If token is invalid/expired, just proceed as unauthenticated
        // instead of throwing an error for public routes
        next();
    }
};

module.exports = optionalAuthenticate;
