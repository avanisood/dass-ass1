// Middleware to check if user has required role
// Accepts roles as spread args: authorize('admin') or authorize('organizer', 'admin')
// Also handles array args: authorize(['organizer', 'admin']) for convenience
const authorize = (...roles) => {
  // Flatten in case an array was passed as a single argument
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    // Check if user exists (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = authorize;
