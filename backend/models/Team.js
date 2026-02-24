const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    targetSize: {
        type: Number,
        required: true,
        min: 2,
        max: 6
    },
    leaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    inviteCode: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['forming', 'completed'],
        default: 'forming'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
