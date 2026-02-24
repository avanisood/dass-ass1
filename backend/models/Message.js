const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    type: {
        type: String,
        enum: ['message', 'announcement'],
        default: 'message'
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    reactions: {
        type: Map,
        of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        default: {}
    },
    pinned: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient querying
messageSchema.index({ eventId: 1, createdAt: -1 });
messageSchema.index({ eventId: 1, pinned: -1 });

module.exports = mongoose.model('Message', messageSchema);
