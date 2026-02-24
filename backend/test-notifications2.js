require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Registration = require('./models/Registration');
const Message = require('./models/Message');

async function test() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);

        // Find all users
        const users = await User.find({});
        console.log(`Found ${users.length} total users.`);

        for (const user of users) {
            console.log(`\n--- User: ${user.firstName} ${user.lastName} (${user._id}) [Role: ${user.role}] ---`);
            console.log(`lastNotificationCheck: ${user.lastNotificationCheck}`);

            const regs = await Registration.find({ participantId: user._id }).lean();
            const eventIds = regs.map(r => r.eventId);
            console.log(`Registered for ${eventIds.length} events: ${eventIds.join(', ')}`);

            if (eventIds.length > 0) {
                const announcements = await Message.find({
                    eventId: { $in: eventIds },
                    type: 'announcement',
                    createdAt: { $gt: user.lastNotificationCheck || new Date(0) },
                    deleted: false
                }).lean();

                console.log(`Unread announcements count: ${announcements.length}`);
                if (announcements.length > 0) {
                    console.log('Unread announcements:', announcements.map(a => a.content));
                }

                const allAnnouncements = await Message.find({
                    eventId: { $in: eventIds },
                    type: 'announcement',
                    deleted: false
                }).lean();
                console.log(`Total announcements count for these events (regardless of read status): ${allAnnouncements.length}`);
                if (allAnnouncements.length > 0) {
                    console.log('All announcements:', allAnnouncements.map(a => ({ content: a.content, createdAt: a.createdAt })));
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
test();
