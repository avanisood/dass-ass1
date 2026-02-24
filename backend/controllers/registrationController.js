const Registration = require('../models/Registration');
const Event = require('../models/Event');
const generateQRCode = require('../utils/generateQRCode');
const sendRegistrationConfirmation = require('../utils/sendRegistrationConfirmation');
const User = require('../models/User');

/**
 * Register for an event
 * POST /api/registrations
 * @access Private (Participant only)
 */
exports.registerForEvent = async (req, res) => {
  try {
    // Get eventId, formData, variant, and quantity from request body
    const { eventId, formData, variant, quantity } = req.body;

    // Get participantId from authenticated user
    const participantId = req.user.id;

    // Validate eventId
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Find event by ID
    const event = await Event.findById(eventId);

    // Validate: Event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Validate: Event is published
    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Event is not open for registration'
      });
    }

    // Validate: Registration deadline hasn't passed
    const now = new Date();
    if (now > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Validate: Registration limit not reached
    if (event.type !== 'merchandise' && event.registrationCount >= event.registrationLimit) {
      return res.status(400).json({
        success: false,
        message: 'Registration limit reached'
      });
    }

    // Validate: User hasn't already registered
    const existingRegistration = await Registration.findOne({
      participantId,
      eventId,
      status: { $ne: 'cancelled' }
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this event'
      });
    }

    // Check if merchandise event and validate stock
    if (event.type === 'merchandise' && event.itemDetails) {
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: 'Please select a variant for this merchandise'
        });
      }

      // Find the selected variant in itemDetails
      const selectedVariant = event.itemDetails.variants?.find(
        v => v.size === variant.size && v.color === variant.color
      );

      if (!selectedVariant) {
        return res.status(400).json({
          success: false,
          message: 'Selected variant not available'
        });
      }

      // Validate stock
      const requestedQuantity = quantity || 1;
      if (selectedVariant.stock < requestedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${selectedVariant.stock} items available in stock`
        });
      }

      // Validate purchase limit
      if (event.itemDetails.purchaseLimit && requestedQuantity > event.itemDetails.purchaseLimit) {
        return res.status(400).json({
          success: false,
          message: `Maximum purchase limit is ${event.itemDetails.purchaseLimit} items`
        });
      }
    }

    // Generate unique ticketId (format: TICKET-{timestamp}-{random})
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ticketId = `TICKET-${timestamp}-${randomString}`;

    // Generate QR code image (base64) using the dedicated utility
    // Format: TICKET:{ticketId}|EVENT:{eventId}|PARTICIPANT:{participantId}
    const qrCode = await generateQRCode(eventId, participantId, ticketId);

    // Create registration document
    const registrationData = {
      participantId,
      eventId,
      formData: formData || {},
      ticketId,
      qrCode,
      status: 'registered',
      paymentStatus: 'paid' // Assuming payment is handled separately
    };

    // Add variant and quantity for merchandise events
    if (event.type === 'merchandise') {
      registrationData.variant = variant;
      registrationData.quantity = quantity || 1;
    }

    const registration = await Registration.create(registrationData);

    // If merchandise, decrement stock atomically
    if (event.type === 'merchandise' && variant) {
      await Event.updateOne(
        {
          _id: eventId,
          'itemDetails.variants': {
            $elemMatch: {
              size: variant.size,
              color: variant.color,
              stock: { $gte: quantity || 1 }
            }
          }
        },
        {
          $inc: {
            'itemDetails.variants.$[elem].stock': -(quantity || 1)
          }
        },
        {
          arrayFilters: [
            { 'elem.size': variant.size, 'elem.color': variant.color }
          ]
        }
      );
    }

    // Increment event registrationCount and revenue
    await Event.findByIdAndUpdate(eventId, {
      $inc: {
        registrationCount: 1,
        revenue: event.registrationFee || 0
      }
    });

    // Populate event and participant details for response
    const populatedRegistration = await Registration.findById(registration._id)
      .populate('eventId', 'name type eventStartDate eventEndDate registrationFee')
      .populate('participantId', 'firstName lastName email');

    // Send confirmation email asynchronously in the background
    // Don't wait for email - registration should succeed even if email fails
    console.log('[REGISTRATION] Attempting to send confirmation email...');
    sendRegistrationConfirmation(
      populatedRegistration.participantId.email,
      populatedRegistration.eventId,
      populatedRegistration
    ).then(result => {
      if (result.success) {
        console.log('[REGISTRATION] ✓ Confirmation email sent successfully');
      } else {
        console.error('[REGISTRATION] ✗ Confirmation email failed:', result.error);
        // Email failure should not affect registration success
      }
    }).catch(err => {
      console.error('[REGISTRATION] ✗ Background email failed:', err.message);
      console.error('[REGISTRATION] Error details:', err);
      // Email failure should not affect registration success
    });

    // Return registration with success message immediately
    // Don't wait for email to complete
    res.status(201).json({
      success: true,
      message: 'Registration successful! Check your email for ticket details.',
      registration: populatedRegistration,
      note: 'If you don\'t receive an email within 5 minutes, please check your spam folder or contact support.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: error.message
    });
  }
};

/**
 * Mark attendance for an event
 * POST /api/attendance/mark
 * @access Private (Organizer only)
 */
exports.markAttendance = async (req, res) => {
  try {
    // Get ticketId from request body
    const { ticketId } = req.body;

    // Get organizerId from authenticated user
    const organizerId = req.user.id;

    // Validate ticketId
    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required'
      });
    }

    // Find registration by ticketId and populate event and participant details
    const registration = await Registration.findOne({ ticketId })
      .populate('eventId', 'name organizerId eventStartDate')
      .populate('participantId', 'firstName lastName email');

    // Validate: Registration exists
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket ID. Registration not found.'
      });
    }

    // Validate: Event belongs to this organizer
    if (registration.eventId.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. This event does not belong to you.'
      });
    }

    // Validate: Not already marked attended
    if (registration.attended) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked',
        details: {
          participantName: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
          attendanceTime: registration.attendanceTimestamp,
          eventId: registration.eventId._id
        }
      });
    }

    // Update registration: set attended=true, attendanceTimestamp=now
    registration.attended = true;
    registration.attendanceTimestamp = new Date();
    await registration.save();

    // Return success message with participant details
    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      participant: {
        name: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
        email: registration.participantId.email,
        ticketId: registration.ticketId,
        eventName: registration.eventId.name,
        eventId: registration.eventId._id,
        attendanceTime: registration.attendanceTimestamp
      }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

/**
 * Get user's registrations
 * GET /api/registrations/my-registrations
 * @access Private (Participant only)
 */
exports.getMyRegistrations = async (req, res) => {
  try {
    const participantId = req.user.id;

    // Find all registrations for this participant
    const registrations = await Registration.find({ participantId })
      .populate('eventId', 'name type eventStartDate eventEndDate organizerId registrationFee')
      .populate({
        path: 'eventId',
        populate: {
          path: 'organizerId',
          select: 'organizerName'
        }
      })
      .sort({ registrationDate: -1 }) // Most recent first
      .lean();

    // Return registrations
    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations
    });

  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: error.message
    });
  }
};

/**
 * Check if user is registered for an event
 * GET /api/registrations/check/:eventId
 * @access Private
 */
exports.checkRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;
    const participantId = req.user.id;

    // Check if registration exists
    const registration = await Registration.findOne({
      participantId,
      eventId,
      status: { $ne: 'cancelled' } // Not cancelled
    });

    res.status(200).json({
      success: true,
      isRegistered: !!registration,
      registration: registration || null
    });

  } catch (error) {
    console.error('Check registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check registration status',
      error: error.message
    });
  }
};

// Additional controller functions will be added here
