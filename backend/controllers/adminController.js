const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const bcrypt = require('bcrypt');

/**
 * Create a new organizer account
 * POST /api/organizers
 * @access Private (Admin only)
 */
exports.createOrganizer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { organizerName, category, description, contactEmail } = req.body;

    if (!organizerName || !category) {
      return res.status(400).json({ success: false, message: 'Organizer name and category are required' });
    }

    const loginEmail = organizerName.toLowerCase().replace(/\s+/g, '') + '@felicity.com';

    const existingOrganizer = await User.findOne({ email: loginEmail });
    if (existingOrganizer) {
      return res.status(400).json({ success: false, message: 'An organizer with this name already exists' });
    }

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let plainPassword = '';
    for (let i = 0; i < 12; i++) {
      plainPassword += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const organizer = await User.create({
      email: loginEmail,
      password: plainPassword,
      role: 'organizer',
      organizerName,
      category,
      description: description || '',
      contactEmail: contactEmail || loginEmail,
    });

    res.status(201).json({
      success: true,
      message: 'Organizer created successfully',
      organizer: {
        _id: organizer._id,
        organizerName: organizer.organizerName,
        category: organizer.category,
        description: organizer.description,
        email: organizer.email,
        contactEmail: organizer.contactEmail,
        createdAt: organizer.createdAt
      },
      credentials: {
        email: loginEmail,
        password: plainPassword,
        note: 'Save these credentials! The password will not be shown again.'
      }
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    res.status(500).json({ success: false, message: 'Failed to create organizer', error: error.message });
  }
};

/**
 * Get all organizers
 * GET /api/organizers
 * @access Private (Admin only)
 */
exports.getOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: organizers.length,
      organizers
    });
  } catch (error) {
    console.error('Get organizers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch organizers', error: error.message });
  }
};

/**
 * Update an organizer account
 * PUT /api/organizers/:id
 * @access Private (Admin only)
 */
exports.updateOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizerName, category, description, contactEmail } = req.body;

    const organizer = await User.findById(id);
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    if (organizerName) organizer.organizerName = organizerName;
    if (category) organizer.category = category;
    if (description !== undefined) organizer.description = description;
    if (contactEmail) organizer.contactEmail = contactEmail;

    await organizer.save();

    const organizerResponse = organizer.toObject();
    delete organizerResponse.password;

    res.status(200).json({ success: true, message: 'Organizer updated successfully', organizer: organizerResponse });
  } catch (error) {
    console.error('Update organizer error:', error);
    res.status(500).json({ success: false, message: 'Failed to update organizer', error: error.message });
  }
};

/**
 * Delete an organizer account
 * DELETE /api/organizers/:id
 * @access Private (Admin only)
 */
exports.deleteOrganizer = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await User.findById(id);
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    // Cascade delete: remove all events by this organizer
    const Event = require('../models/Event');
    const Registration = require('../models/Registration');

    // Find all events by this organizer
    const organizerEvents = await Event.find({ organizerId: id }).select('_id');
    const eventIds = organizerEvents.map(e => e._id);

    // Delete all registrations for those events
    if (eventIds.length > 0) {
      await Registration.deleteMany({ eventId: { $in: eventIds } });
    }

    // Delete all events
    await Event.deleteMany({ organizerId: id });

    // Delete the organizer
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Organizer removed successfully along with ${eventIds.length} event(s) and their registrations`
    });
  } catch (error) {
    console.error('Delete organizer error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove organizer', error: error.message });
  }
};

/**
 * Get all users (with optional role filter)
 * GET /api/admin/users?role=participant
 * @access Private (Admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

/**
 * Get admin dashboard stats
 * GET /api/admin/stats
 * @access Private (Admin only)
 */
exports.getStats = async (req, res) => {
  try {
    const [totalParticipants, totalOrganizers, totalEvents, totalRegistrations] = await Promise.all([
      User.countDocuments({ role: 'participant' }),
      User.countDocuments({ role: 'organizer' }),
      Event.countDocuments({}),
      Registration.countDocuments({})
    ]);

    // Recent events for activity feed
    const recentEvents = await Event.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name status createdAt')
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalParticipants,
        totalOrganizers,
        totalEvents,
        totalRegistrations
      },
      recentEvents
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
};
