require('dotenv').config();
const mongoose = require('mongoose');
const { createOrganizer } = require('./controllers/adminController');
const User = require('./models/User');

/**
 * Test Admin Controller - Create Organizer
 */
const testCreateOrganizer = async () => {
  let adminUser;
  let nonAdminUser;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test admin user
    adminUser = await User.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'testadmin@felicity.com',
      password: 'Admin@123',
      role: 'admin'
    });

    // Create test non-admin user
    nonAdminUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@iiit.ac.in',
      password: 'Test@123',
      role: 'participant',
      participantType: 'iiit'
    });

    console.log('\n=== Test 1: Successful Organizer Creation ===');
    const req1 = {
      body: {
        organizerName: 'Tech Club',
        category: 'Technical',
        description: 'Technical club for coding events',
        contactEmail: 'techclub@contact.com'
      },
      user: { id: adminUser._id, role: 'admin' }
    };
    const res1 = createMockResponse();
    await createOrganizer(req1, res1);
    console.log('Status:', res1.status_code);
    console.log('Success:', res1.json_data.success);
    console.log('Message:', res1.json_data.message);
    if (res1.json_data.organizer) {
      console.log('Organizer:', res1.json_data.organizer.organizerName);
      console.log('Login Email:', res1.json_data.credentials.email);
      console.log('Password:', res1.json_data.credentials.password);
      console.log('Password Length:', res1.json_data.credentials.password.length);
    }

    console.log('\n=== Test 2: Non-Admin User Attempting Creation ===');
    const req2 = {
      body: {
        organizerName: 'Cultural Club',
        category: 'Cultural'
      },
      user: { id: nonAdminUser._id, role: 'participant' }
    };
    const res2 = createMockResponse();
    await createOrganizer(req2, res2);
    console.log('Status:', res2.status_code);
    console.log('Message:', res2.json_data.message);

    console.log('\n=== Test 3: Missing Required Fields ===');
    const req3 = {
      body: {
        category: 'Sports'
        // Missing organizerName
      },
      user: { id: adminUser._id, role: 'admin' }
    };
    const res3 = createMockResponse();
    await createOrganizer(req3, res3);
    console.log('Status:', res3.status_code);
    console.log('Message:', res3.json_data.message);

    console.log('\n=== Test 4: Duplicate Organizer Name ===');
    const req4 = {
      body: {
        organizerName: 'Tech Club', // Same as Test 1
        category: 'Technical'
      },
      user: { id: adminUser._id, role: 'admin' }
    };
    const res4 = createMockResponse();
    await createOrganizer(req4, res4);
    console.log('Status:', res4.status_code);
    console.log('Message:', res4.json_data.message);

    console.log('\n=== Test 5: Organizer Name with Spaces ===');
    const req5 = {
      body: {
        organizerName: 'Music And Arts Society',
        category: 'Cultural',
        description: 'For music and arts events'
      },
      user: { id: adminUser._id, role: 'admin' }
    };
    const res5 = createMockResponse();
    await createOrganizer(req5, res5);
    console.log('Status:', res5.status_code);
    console.log('Success:', res5.json_data.success);
    if (res5.json_data.organizer) {
      console.log('Organizer:', res5.json_data.organizer.organizerName);
      console.log('Login Email:', res5.json_data.credentials.email);
      console.log('Expected: musicandartssociety@felicity.com');
    }

    console.log('\n=== Test 6: Minimal Data (Only Required Fields) ===');
    const req6 = {
      body: {
        organizerName: 'Sports',
        category: 'Athletics'
      },
      user: { id: adminUser._id, role: 'admin' }
    };
    const res6 = createMockResponse();
    await createOrganizer(req6, res6);
    console.log('Status:', res6.status_code);
    console.log('Success:', res6.json_data.success);
    if (res6.json_data.credentials) {
      console.log('Generated Email:', res6.json_data.credentials.email);
      console.log('Password Length:', res6.json_data.credentials.password.length);
      console.log('Password contains letters and numbers:', 
        /[A-Za-z]/.test(res6.json_data.credentials.password) && 
        /[0-9]/.test(res6.json_data.credentials.password));
    }

    console.log('\n=== Test Summary ===');
    const totalTests = 6;
    const passedTests = [
      res1.status_code === 201 && res1.json_data.success,
      res2.status_code === 403 && res2.json_data.message.includes('Admin'),
      res3.status_code === 400 && res3.json_data.message.includes('required'),
      res4.status_code === 400 && res4.json_data.message.includes('already exists'),
      res5.status_code === 201 && res5.json_data.credentials.email === 'musicandartssociety@felicity.com',
      res6.status_code === 201 && res6.json_data.credentials.password.length === 12
    ].filter(Boolean).length;

    console.log(`Tests passed: ${passedTests}/${totalTests}`);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Cleanup
    if (adminUser) await User.deleteOne({ _id: adminUser._id });
    if (nonAdminUser) await User.deleteOne({ _id: nonAdminUser._id });
    await User.deleteMany({ email: { $regex: /@felicity\.com$/, $ne: 'admin@felicity.com' } });
    await mongoose.connection.close();
    console.log('\nCleaned up test data and closed connection');
  }
};

function createMockResponse() {
  return {
    status_code: null,
    json_data: null,
    status: function(code) {
      this.status_code = code;
      return this;
    },
    json: function(data) {
      this.json_data = data;
      return this;
    }
  };
}

testCreateOrganizer();
