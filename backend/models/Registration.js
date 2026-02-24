const mongoose = require('mongoose');

// Registration Schema
const registrationSchema = new mongoose.Schema({
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'completed', 'cancelled'],
    default: 'registered'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'paid'
  },
  formData: {
    type: Object,
    default: {}
  },
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  qrCode: {
    type: String // base64 or URL
  },
  attended: {
    type: Boolean,
    default: false
  },
  attendanceTimestamp: {
    type: Date
  },
  // For merchandise events
  variant: {
    type: Object
  },
  quantity: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Pre-save hook to generate unique ticketId if not exists
// Format: EVT-{eventId}-{random 6 chars}
registrationSchema.pre('save', function(next) {
  // Only generate ticketId if it doesn't already exist
  if (!this.ticketId) {
    // Generate random 6 character alphanumeric string
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Create ticketId in format: EVT-{eventId}-{random}
    this.ticketId = `EVT-${this.eventId}-${randomString}`;
  }
  next();
});

module.exports = mongoose.model('Registration', registrationSchema);
