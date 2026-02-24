const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const authenticate = require('./middleware/authenticate');
require('dotenv').config();

// Mock Express request and response
const createMockReq = (token) => ({
  header: (name) => {
    if (name === 'Authorization' && token) {
      return `Bearer ${token}`;
    }
    return null;
  }
});

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

async function testAuthMiddleware() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Create a test user
    await User.deleteOne({ email: 'middleware-test@iiit.ac.in' });
    const testUser = new User({
      email: 'middleware-test@iiit.ac.in',
      password: 'Test@123',
      firstName: 'Middleware',
      lastName: 'Test',
      role: 'participant',
      participantType: 'iiit'
    });
    await testUser.save();
    console.log('✓ Test user created\n');

    // Test 1: Valid token
    console.log('Test 1: Valid token');
    const validToken = jwt.sign(
      { id: testUser._id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const req1 = createMockReq(validToken);
    const res1 = createMockRes();
    let nextCalled = false;
    const next1 = () => { nextCalled = true; };
    
    await authenticate(req1, res1, next1);
    console.log(`Next called: ${nextCalled}`);
    console.log(`User attached: ${!!req1.user}`);
    console.log(`User email: ${req1.user?.email}`);
    console.log(`Password excluded: ${req1.user?.password === undefined}\n`);

    // Test 2: No token provided
    console.log('Test 2: No token provided');
    const req2 = createMockReq(null);
    const res2 = createMockRes();
    const next2 = () => {};
    
    await authenticate(req2, res2, next2);
    console.log(`Status: ${res2.statusCode}`);
    console.log(`Message: ${res2.data?.message}\n`);

    // Test 3: Invalid token
    console.log('Test 3: Invalid token');
    const req3 = createMockReq('invalid.token.here');
    const res3 = createMockRes();
    const next3 = () => {};
    
    await authenticate(req3, res3, next3);
    console.log(`Status: ${res3.statusCode}`);
    console.log(`Message: ${res3.data?.message}\n`);

    // Test 4: Token with non-existent user
    console.log('Test 4: Token with non-existent user ID');
    const fakeToken = jwt.sign(
      { id: new mongoose.Types.ObjectId(), role: 'participant' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const req4 = createMockReq(fakeToken);
    const res4 = createMockRes();
    const next4 = () => {};
    
    await authenticate(req4, res4, next4);
    console.log(`Status: ${res4.statusCode}`);
    console.log(`Message: ${res4.data?.message}\n`);

    // Test 5: Expired token
    console.log('Test 5: Expired token');
    const expiredToken = jwt.sign(
      { id: testUser._id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    await new Promise(resolve => setTimeout(resolve, 1000));
    const req5 = createMockReq(expiredToken);
    const res5 = createMockRes();
    const next5 = () => {};
    
    await authenticate(req5, res5, next5);
    console.log(`Status: ${res5.statusCode}`);
    console.log(`Message: ${res5.data?.message}\n`);

    // Clean up
    await User.deleteOne({ email: 'middleware-test@iiit.ac.in' });
    console.log('✓ Test user cleaned up');

    mongoose.disconnect();
    console.log('\n✓ All authentication middleware tests completed!');

  } catch (error) {
    console.error('Test error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

testAuthMiddleware();
