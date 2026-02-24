const mongoose = require('mongoose');
const User = require('./models/User');
const Registration = require('./models/Registration');
const Message = require('./models/Message');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/felicity');
  
  // Find a participant
  const users = await User.find({ role: 'participant' });
  for (const user of users) {
    console.log(`\n--- User: ${user.firstName} ${user.lastName} (${user._id}) ---`);
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
  
  mongoose.disconnect();
}
test();
