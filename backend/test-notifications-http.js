const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity');
  const user = await User.findOne({ role: 'participant' }).sort({ createdAt: -1 });
  if (!user) return console.log('no user');
  
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/messages/notifications/unread',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Has Token:', !!token);
      console.log('User ID:', user._id);
      console.log('User Check:', user.lastNotificationCheck);
      console.log('Data:', data);
      process.exit(0);
    });
  });

  req.on('error', e => console.error(e));
  req.end();
}
test();
