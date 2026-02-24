const mongoose = require('mongoose');

// Password Reset Request Schema (for Tier B feature)
const passwordResetRequestSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  resolvedDate: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reason: {
    type: String,
    trim: true
  },
  newPassword: {
    type: String // Will be hashed after generation
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
