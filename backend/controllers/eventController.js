const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const User = require('../models/User');

/**
 * Send a Discord webhook notification when an event is published
 */
const sendDiscordWebhook = async (organizerId, event) => {
  try {
    const organizer = await User.findById(organizerId);
    if (!organizer || !organizer.discordWebhook || !organizer.discordWebhook.trim()) return;

    const webhookUrl = organizer.discordWebhook.trim();

    const payload = {
      content: `🎉 A new event has been published by **${organizer.organizerName || 'Organizer'}**!`,
      embeds: [{
        title: event.name || 'New Event',
        description: event.description?.substring(0, 2048) || 'No description',
        color: event.type === 'normal' ? 0x6B9BC3 : 0xE8C17C,
        fields: [
          { name: 'Type', value: event.type === 'normal' ? 'Normal Event' : 'Merchandise', inline: true },
          { name: 'Eligibility', value: event.eligibility || 'Open to All', inline: true },
          { name: 'Fee', value: event.registrationFee ? `₹${event.registrationFee}` : 'Free', inline: true },
          { name: 'Date', value: new Date(event.eventStartDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), inline: true },
        ],
        footer: { text: `Felicity Events` },
        timestamp: new Date().toISOString(),
      }]
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Discord webhook failed with status ${res.status}:`, errorText);
    }
  } catch (err) {
    console.error('Discord webhook error (non-fatal):', err.message);
  }
};

/**
 * Create new event
 * POST /api/events
 * @access Private (Organizer only)
 */
exports.createEvent = async (req, res) => {
  try {
    const {
      name, description, type, eligibility,
      registrationDeadline, eventStartDate, eventEndDate,
      registrationLimit, registrationFee, tags, customForm, itemDetails
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least a name and type to save a draft'
      });
    }

    if (req.body.status !== 'draft') {
      if (!description || !eligibility) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields: name, description, type, and eligibility to publish'
        });
      }

      if (!registrationDeadline || !eventStartDate || !eventEndDate) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required dates: registrationDeadline, eventStartDate, and eventEndDate to publish'
        });
      }

      const regDeadline = new Date(registrationDeadline);
      const startDate = new Date(eventStartDate);
      const endDate = new Date(eventEndDate);

      // Only enforce strict date ordering for normal events
      if (type !== 'merchandise') {
        if (regDeadline >= startDate) {
          return res.status(400).json({ success: false, message: 'Registration deadline must be before event start date' });
        }

        if (startDate >= endDate) {
          return res.status(400).json({ success: false, message: 'Event start date must be before event end date' });
        }
      }
    }

    const eventData = {
      name, description, type, eligibility,
      registrationDeadline, eventStartDate, eventEndDate,
      organizerId: req.user.id,
      status: req.body.status || 'draft'
    };

    if (registrationLimit) eventData.registrationLimit = registrationLimit;
    if (registrationFee !== undefined) eventData.registrationFee = registrationFee;
    if (tags && Array.isArray(tags)) eventData.tags = tags;
    if (customForm && Array.isArray(customForm)) eventData.customForm = customForm;
    if (itemDetails) eventData.itemDetails = itemDetails;

    const event = await Event.create(eventData);

    // Send Discord webhook if event is published immediately
    if (event.status === 'published') {
      sendDiscordWebhook(req.user.id, event);
    }

    res.status(201).json({ success: true, message: 'Event created successfully', event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Failed to create event', error: error.message });
  }
};

/**
 * Get all events with search and filters
 * GET /api/events?search=&type=&eligibility=&startDate=&endDate=&organizerId=
 * @access Public
 */
exports.getEvents = async (req, res) => {
  try {
    const { search, type, eligibility, startDate, endDate, organizerId } = req.query;

    const query = {};

    if (search) {
      // Find organizers matching the search query
      const matchingOrganizers = await User.find({
        role: 'organizer',
        organizerName: { $regex: search, $options: 'i' }
      }).select('_id');

      const organizerIds = matchingOrganizers.map(org => org._id);

      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { organizerId: { $in: organizerIds } }
      ];
    }

    if (type) query.type = type;

    if (eligibility) query.eligibility = { $regex: eligibility, $options: 'i' };

    if (startDate || endDate) {
      query.eventStartDate = {};
      if (startDate) query.eventStartDate.$gte = new Date(startDate);
      if (endDate) query.eventStartDate.$lte = new Date(endDate);
    }

    if (organizerId) {
      query.organizerId = organizerId;
      // If this is the organizer viewing their own events, skip status filter
      const isOwner = req.user && req.user._id.toString() === organizerId;
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        query.status = 'published';
      }
    } else {
      // No organizerId filter - only public published events unless admin
      if (!req.user || req.user.role === 'participant') {
        query.status = 'published';
      }
    }

    const events = await Event.find(query)
      .populate('organizerId', 'organizerName category email')
      .sort({ eventStartDate: 1 })
      .lean();

    // Recommendation logic if user is logged in
    if (req.user && req.user.role === 'participant') {
      const user = await User.findById(req.user.id);
      if (user && (user.interests.length > 0 || user.followedOrganizers.length > 0)) {
        // Boost events based on interests matches and followed organizers
        events.forEach(event => {
          let score = 0;

          // Interest match
          if (event.tags && user.interests) {
            const matches = event.tags.filter(tag =>
              user.interests.some(interest => interest.toLowerCase() === tag.toLowerCase())
            );
            score += matches.length * 2;
          }

          // Followed organizer match
          if (user.followedOrganizers && event.organizerId && user.followedOrganizers.some(
            orgId => orgId.toString() === (event.organizerId._id || event.organizerId).toString()
          )) {
            score += 5;
          }

          event.recommendationScore = score;
        });

        // Sort by score (descending), then by date
        events.sort((a, b) => {
          if (b.recommendationScore !== a.recommendationScore) {
            return b.recommendationScore - a.recommendationScore;
          }
          return new Date(a.eventStartDate) - new Date(b.eventStartDate);
        });
      }
    }

    res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events', error: error.message });
  }
};

/**
 * Get trending events (Top 5 created/updated in the last 24h with highest registrations)
 * GET /api/events/trending
 * @access Public
 */
exports.getTrendingEvents = async (req, res) => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Aggregate registrations created in the last 24 hours
    const trendingAggregation = await Registration.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$eventId',
          recentRegistrations: { $sum: 1 }
        }
      },
      {
        $sort: { recentRegistrations: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // If no registrations in the last 24h, return empty
    if (trendingAggregation.length === 0) {
      return res.status(200).json({ success: true, count: 0, events: [] });
    }

    // Fetch the full event details for these trending event IDs
    const eventIds = trendingAggregation.map(item => item._id);
    const events = await Event.find({
      _id: { $in: eventIds },
      status: 'published'
    })
      .populate('organizerId', 'organizerName category')
      .lean();

    // Map the recent registration count back to the event objects and sort them correctly
    const formattedTrendingEvents = events.map(event => {
      const aggItem = trendingAggregation.find(a => a._id.toString() === event._id.toString());
      return {
        ...event,
        trendingScore: aggItem ? aggItem.recentRegistrations : 0
      };
    }).sort((a, b) => b.trendingScore - a.trendingScore);

    res.status(200).json({ success: true, count: formattedTrendingEvents.length, events: formattedTrendingEvents });
  } catch (error) {
    console.error('Get trending events error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending events', error: error.message });
  }
};

/**
 * Get event by ID
 * GET /api/events/:id
 * @access Public
 */
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('organizerId', 'organizerName category email contactEmail')
      .lean();

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event', error: error.message });
  }
};

/**
 * Update event
 * PUT /api/events/:id
 * @access Private (Organizer only - must own the event)
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only the organizer who created the event can update it
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only edit your own events.' });
    }

    // Cannot edit published/completed/closed events (except via status endpoint)
    const editableStatuses = ['draft'];
    if (!editableStatuses.includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit event with status '${event.status}'. Only draft events can be edited.`
      });
    }

    // Lock custom form after first registration
    if (req.body.customForm && event.registrationCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify the registration form after registrations have been received.'
      });
    }

    const allowedFields = [
      'name', 'description', 'type', 'eligibility',
      'registrationDeadline', 'eventStartDate', 'eventEndDate',
      'registrationLimit', 'registrationFee', 'tags', 'customForm', 'itemDetails'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updatedEvent = await Event.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('organizerId', 'organizerName category email');

    res.status(200).json({ success: true, message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event', error: error.message });
  }
};

/**
 * Delete event
 * DELETE /api/events/:id
 * @access Private (Organizer only - must own the event, only drafts can be deleted)
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only delete your own events.' });
    }

    if (event.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft events can be deleted. Published events cannot be removed.'
      });
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event', error: error.message });
  }
};

/**
 * Update event status
 * PUT /api/events/:id/status
 * @access Private (Organizer only)
 */
exports.updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['draft', 'published', 'ongoing', 'completed', 'closed'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Valid transitions
    const validTransitions = {
      draft: ['published'],
      published: ['ongoing', 'closed'],
      ongoing: ['completed', 'closed'],
      completed: [],
      closed: []
    };

    if (!validTransitions[event.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${event.status}' to '${status}'`
      });
    }

    event.status = status;
    await event.save();

    // Send Discord webhook when event is published
    if (status === 'published') {
      sendDiscordWebhook(event.organizerId, event);
    }

    res.status(200).json({ success: true, message: `Event status updated to '${status}'`, event });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event status', error: error.message });
  }
};

/**
 * Get registrations for an event (organizer view)
 * GET /api/events/:id/registrations
 * @access Private (Organizer only)
 */
exports.getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only view registrations for your own events.' });
    }

    const registrations = await Registration.find({ eventId: id })
      .populate('participantId', 'firstName lastName email college contactNumber participantType')
      .sort({ registrationDate: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registrations', error: error.message });
  }
};

/**
 * Create a team for an event
 * POST /api/events/:id/teams
 * @access Private (Participant)
 */
exports.createTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetSize } = req.body;

    if (!name || !targetSize) {
      return res.status(400).json({ success: false, message: 'Team name and size are required' });
    }

    if (targetSize < 2 || targetSize > 6) {
      return res.status(400).json({ success: false, message: 'Team size must be between 2 and 6' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is already in a team for this event
    const existingTeam = await Team.findOne({
      eventId: id,
      'members.userId': req.user.id
    });

    if (existingTeam) {
      return res.status(400).json({ success: false, message: 'You are already in a team for this event' });
    }

    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const team = await Team.create({
      name,
      targetSize,
      leaderId: req.user.id,
      eventId: id,
      members: [{ userId: req.user.id, status: 'accepted' }],
      inviteCode
    });

    res.status(201).json({ success: true, message: 'Team created successfully', team });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ success: false, message: 'Failed to create team', error: error.message });
  }
};

/**
 * Join a team via invite code
 * POST /api/events/:id/teams/join
 * @access Private (Participant)
 */
exports.joinTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const team = await Team.findOne({ eventId: id, inviteCode });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Invalid invite code or team not found' });
    }

    if (team.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Team is already full or finalized' });
    }

    // Check if already a member
    const isMember = team.members.some(member => member.userId.toString() === req.user.id);
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already in this team' });
    }

    // Check if in another team for same event
    const existingTeam = await Team.findOne({
      eventId: id,
      'members.userId': req.user.id
    });
    if (existingTeam) {
      return res.status(400).json({ success: false, message: 'You are already in a team for this event' });
    }

    team.members.push({ userId: req.user.id, status: 'accepted' });

    // Check if team is now complete
    if (team.members.length >= team.targetSize) {
      team.status = 'completed';

      // Auto-register all members
      const registrations = team.members.map(member => ({
        eventId: id,
        participantId: member.userId,
        registrationDate: new Date(),
        status: 'registered',
        paymentStatus: 'paid',
        ticketId: `EVT-${id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      }));

      // This assumes Registration model exists and works like this.
      // We might need to handle fees if any. For now, assuming free or handled elsewhere.
      await Registration.insertMany(registrations);

      // Also update event registration count
      const event = await Event.findById(id);
      if (event) {
        event.registrationCount += team.members.length;
        await event.save();
      }
    }

    await team.save();

    res.status(200).json({ success: true, message: 'Joined team successfully', team });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ success: false, message: 'Failed to join team', error: error.message });
  }
};

/**
 * Get team details for an event (if user is member)
 * GET /api/events/:id/team
 * @access Private (Participant)
 */
exports.getTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findOne({
      eventId: id,
      'members.userId': req.user.id
    }).populate('members.userId', 'firstName lastName email');

    if (!team) {
      return res.status(200).json({ success: true, team: null });
    }

    res.status(200).json({ success: true, team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ success: false, message: 'Failed to get team', error: error.message });
  }
};
