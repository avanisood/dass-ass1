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
    required: function () { return this.status !== 'draft'; }
  },
  type: {
    type: String,
    enum: ['normal', 'merchandise'],
    required: function () { return this.status !== 'draft'; }
  },
  eligibility: {
    type: String,
    required: function () { return this.status !== 'draft'; }
  },
  registrationDeadline: {
    type: Date,
    required: function () { return this.status !== 'draft'; }
  },
  eventStartDate: {
    type: Date,
    required: function () { return this.status !== 'draft'; }
  },
  eventEndDate: {
    type: Date,
    required: function () { return this.status !== 'draft'; }
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
