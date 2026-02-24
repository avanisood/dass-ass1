const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User Schema - Single collection for all roles
const userSchema = new mongoose.Schema({
  // Common fields
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['participant', 'organizer', 'admin'],
    default: 'participant'
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  lastNotificationCheck: {
    type: Date
  },

  // Participant-specific fields
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  participantType: {
    type: String,
    enum: ['iiit', 'non-iiit']
  },
  college: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  interests: [{
    type: String
  }],
  followedOrganizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Organizer-specific fields
  organizerName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  description: {
    type: String
  },
  contactEmail: {
    type: String,
    trim: true
  },
  discordWebhook: {
    type: String
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password before saving to database
// Only hashes if password is new or modified
userSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt with 10 rounds
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare provided password with hashed password in database
// Returns true if passwords match, false otherwise
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = mongoose.model('User', userSchema);
