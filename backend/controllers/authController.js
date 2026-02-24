const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Register new user (participants only)
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, college, contactNumber } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }

    if (role && (role === 'organizer' || role === 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Organizers and admins cannot self-register. Contact administrator.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    let participantType = 'non-iiit';
    if (email.endsWith('@iiit.ac.in') || email.match(/@[a-z]+\.iiit\.ac\.in$/)) {
      participantType = 'iiit';
    }

    const user = new User({
      email, password,
      role: 'participant',
      firstName, lastName, college, contactNumber, participantType
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, message: 'Registration successful', token, user: userResponse });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, message: 'Login successful', token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('followedOrganizers', 'organizerName category');
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user data', error: error.message });
  }
};

/**
 * Update organizer profile
 * PUT /api/auth/profile
 * @access Private (Organizer)
 */
exports.updateProfile = async (req, res) => {
  try {
    const {
      // Organizer fields
      organizerName, category, description, contactEmail, discordWebhook,
      // Participant fields
      firstName, lastName, contactNumber, college, interests
    } = req.body;

    const allowedUpdates = {};
    // Organizer fields
    if (organizerName !== undefined) allowedUpdates.organizerName = organizerName;
    if (category !== undefined) allowedUpdates.category = category;
    if (description !== undefined) allowedUpdates.description = description;
    if (contactEmail !== undefined) allowedUpdates.contactEmail = contactEmail;
    if (discordWebhook !== undefined) allowedUpdates.discordWebhook = discordWebhook;
    // Participant fields
    if (firstName !== undefined) allowedUpdates.firstName = firstName;
    if (lastName !== undefined) allowedUpdates.lastName = lastName;
    if (contactNumber !== undefined) allowedUpdates.contactNumber = contactNumber;
    if (college !== undefined) allowedUpdates.college = college;
    if (interests !== undefined && Array.isArray(interests)) allowedUpdates.interests = interests;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

/**
 * Complete onboarding
 * POST /api/auth/onboarding
 * @access Private (Participant)
 */
exports.completeOnboarding = async (req, res) => {
  try {
    const { interests, followedOrganizers } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (interests && Array.isArray(interests)) {
      user.interests = interests;
    }

    if (followedOrganizers && Array.isArray(followedOrganizers)) {
      user.followedOrganizers = followedOrganizers;
    }

    user.onboardingCompleted = true;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, message: 'Onboarding completed', user: userResponse });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete onboarding', error: error.message });
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 * @access Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Re-fetch user with password for comparison
    const user = await User.findById(req.user.id);
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};
