const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header (format: "Bearer <token>")
    const authHeader = req.header('Authorization');
    
    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
    }
    
    // Extract token (remove "Bearer " prefix)
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from decoded token (exclude password field)
    const user = await User.findById(decoded.id).select('-password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found, authorization denied' 
      });
    }
    
    // Attach user to request object (password already excluded)
    req.user = user;
    
    // Continue to next middleware/route handler
    next();
    
  } catch (error) {
    // Handle JWT verification errors or other errors
    console.error('Authentication error:', error.message);
    res.status(401).json({ 
      success: false,
      message: 'Invalid token, authorization denied' 
    });
  }
};

module.exports = authenticate;
