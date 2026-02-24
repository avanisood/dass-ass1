require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await mongoose.connection.collection('users').updateMany(
    {},
    { $unset: { lastNotificationCheck: "" } }
  );
  console.log(`Unset lastNotificationCheck for ${result.modifiedCount} users.`);
  await mongoose.disconnect();
}
fix();
