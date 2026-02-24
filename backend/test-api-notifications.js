const request = require('supertest');
const mongoose = require('mongoose');
const User = require('./models/User');
const app = require('./server');

async function testApi() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity');
  
  // Find a participant
  const user = await User.findOne({ role: 'participant' });
  if (!user) {
    console.log('No participant found');
    process.exit(0);
  }

  // Generate a token for this user
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

  console.log(`Testing notifications for user: ${user.firstName} ${user.lastName}`);
  
  const res = await request(app)
    .get('/api/messages/notifications/unread')
    .set('Authorization', `Bearer ${token}`);
    
  console.log('Response Status:', res.status);
  console.log('Response Body:', JSON.stringify(res.body, null, 2));

  process.exit(0);
}

testApi();
