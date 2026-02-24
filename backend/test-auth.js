const mongoose = require('mongoose');
const User = require('./models/User');
const authController = require('./controllers/authController');
require('dotenv').config();

// Mock Express request and response objects
const createMockReq = (body) => ({ body });
const createMockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function testAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Clean up test user if exists
    await User.deleteOne({ email: 'test@iiit.ac.in' });
    await User.deleteOne({ email: 'test@example.com' });

    // Test 1: Register IIIT user
    console.log('Test 1: Register IIIT user');
    const req1 = createMockReq({
      email: 'test@iiit.ac.in',
      password: 'Test@123',
      firstName: 'Test',
      lastName: 'User',
      college: 'IIIT',
      contactNumber: '1234567890'
    });
    const res1 = createMockRes();
    await authController.register(req1, res1);
    console.log(`Status: ${res1.statusCode}`);
    console.log(`Success: ${res1.data.success}`);
    console.log(`Participant Type: ${res1.data.user?.participantType}`);
    console.log(`Token Generated: ${!!res1.data.token}\n`);

    // Test 2: Register non-IIIT user
    console.log('Test 2: Register non-IIIT user');
    const req2 = createMockReq({
      email: 'test@example.com',
      password: 'Test@123',
      firstName: 'External',
      lastName: 'User',
      college: 'Other College',
      contactNumber: '9876543210'
    });
    const res2 = createMockRes();
    await authController.register(req2, res2);
    console.log(`Status: ${res2.statusCode}`);
    console.log(`Success: ${res2.data.success}`);
    console.log(`Participant Type: ${res2.data.user?.participantType}\n`);

    // Test 3: Login with correct credentials
    console.log('Test 3: Login with correct credentials');
    const req3 = createMockReq({
      email: 'test@iiit.ac.in',
      password: 'Test@123'
    });
    const res3 = createMockRes();
    await authController.login(req3, res3);
    console.log(`Status: ${res3.statusCode}`);
    console.log(`Success: ${res3.data.success}`);
    console.log(`Token Generated: ${!!res3.data.token}\n`);

    // Test 4: Login with wrong password
    console.log('Test 4: Login with wrong password');
    const req4 = createMockReq({
      email: 'test@iiit.ac.in',
      password: 'WrongPassword'
    });
    const res4 = createMockRes();
    await authController.login(req4, res4);
    console.log(`Status: ${res4.statusCode}`);
    console.log(`Success: ${res4.data.success}`);
    console.log(`Message: ${res4.data.message}\n`);

    // Test 5: Prevent admin self-registration
    console.log('Test 5: Prevent admin self-registration');
    const req5 = createMockReq({
      email: 'admin@test.com',
      password: 'Test@123',
      role: 'admin'
    });
    const res5 = createMockRes();
    await authController.register(req5, res5);
    console.log(`Status: ${res5.statusCode}`);
    console.log(`Success: ${res5.data.success}`);
    console.log(`Message: ${res5.data.message}\n`);

    // Clean up
    await User.deleteOne({ email: 'test@iiit.ac.in' });
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✓ Test users cleaned up');

    mongoose.disconnect();
    console.log('\n✓ All auth controller tests completed!');

  } catch (error) {
    console.error('Test error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

testAuth();
