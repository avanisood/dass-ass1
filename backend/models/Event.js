const mongoose = require('mongoose');

// Event Schema
const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['normal', 'merchandise'],
    required: true
  },
  eligibility: {
    type: String,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  eventStartDate: {
    type: Date,
    required: true
  },
  eventEndDate: {
    type: Date,
    required: true
  },
  registrationLimit: {
    type: Number,
    default: 100
  },
  registrationFee: {
    type: Number,
    default: 0
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'closed'],
    default: 'draft'
  },
  // For Normal Events - custom registration form
  customForm: [{
    fieldType: {
      type: String,
      enum: ['text', 'email', 'number', 'dropdown', 'checkbox', 'file']
    },
    label: String,
    required: Boolean,
    options: [String] // for dropdowns
  }],
  // For Merchandise Events - item details
  itemDetails: {
    variants: [{
      size: String,
      color: String,
      stock: Number
    }],
    purchaseLimit: Number
  },
  // Analytics
  registrationCount: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
