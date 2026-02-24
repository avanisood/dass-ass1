require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB Connection Failed:');
  console.error('Error:', error.message);
  console.error('Error Name:', error.name);
  if (error.reason) {
    console.error('Reason:', error.reason);
  }
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Connection timeout - taking too long');
  process.exit(1);
}, 10000);
