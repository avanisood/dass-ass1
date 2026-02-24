const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');
const eventController = require('./controllers/eventController');
require('dotenv').config();

// Mock Express request and response
const createMockReq = (body, user) => ({ body, user });
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

async function testCreateEvent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Create a test organizer
    await User.deleteOne({ email: 'testorganizer@felicity.com' });
    const organizer = new User({
      email: 'testorganizer@felicity.com',
      password: 'Test@123',
      role: 'organizer',
      organizerName: 'Test Organizer',
      category: 'Technical'
    });
    await organizer.save();
    console.log('✓ Test organizer created\n');

    // Test 1: Create valid event
    console.log('Test 1: Create valid event');
    const validEventData = {
      name: 'Tech Workshop',
      description: 'A workshop on web development',
      type: 'normal',
      eligibility: 'All students',
      registrationDeadline: new Date('2026-03-01'),
      eventStartDate: new Date('2026-03-15'),
      eventEndDate: new Date('2026-03-16'),
      registrationLimit: 50,
      registrationFee: 100,
      tags: ['tech', 'workshop'],
      customForm: [
        { fieldType: 'text', label: 'Why do you want to attend?', required: true }
      ]
    };
    const req1 = createMockReq(validEventData, { id: organizer._id, role: 'organizer' });
    const res1 = createMockRes();
    
    await eventController.createEvent(req1, res1);
    console.log(`Status: ${res1.statusCode}`);
    console.log(`Success: ${res1.data.success}`);
    console.log(`Event created: ${res1.data.event?.name}`);
    console.log(`Status: ${res1.data.event?.status}`);
    console.log(`OrganizerId: ${res1.data.event?.organizerId}\n`);

    // Test 2: Missing required fields
    console.log('Test 2: Missing required fields');
    const req2 = createMockReq(
      { name: 'Incomplete Event' },
      { id: organizer._id, role: 'organizer' }
    );
    const res2 = createMockRes();
    
    await eventController.createEvent(req2, res2);
    console.log(`Status: ${res2.statusCode}`);
    console.log(`Success: ${res2.data.success}`);
    console.log(`Message: ${res2.data.message}\n`);

    // Test 3: Invalid date logic (registration deadline after start date)
    console.log('Test 3: Invalid date logic');
    const invalidDateData = {
      name: 'Invalid Event',
      description: 'Test',
      type: 'normal',
      eligibility: 'All',
      registrationDeadline: new Date('2026-03-20'),
      eventStartDate: new Date('2026-03-15'),
      eventEndDate: new Date('2026-03-16')
    };
    const req3 = createMockReq(invalidDateData, { id: organizer._id, role: 'organizer' });
    const res3 = createMockRes();
    
    await eventController.createEvent(req3, res3);
    console.log(`Status: ${res3.statusCode}`);
    console.log(`Success: ${res3.data.success}`);
    console.log(`Message: ${res3.data.message}\n`);

    // Test 4: Create merchandise event with item details
    console.log('Test 4: Create merchandise event');
    const merchEventData = {
      name: 'College Merch',
      description: 'Official college merchandise',
      type: 'merchandise',
      eligibility: 'All',
      registrationDeadline: new Date('2026-03-01'),
      eventStartDate: new Date('2026-03-15'),
      eventEndDate: new Date('2026-03-30'),
      registrationFee: 500,
      itemDetails: {
        variants: [
          { size: 'M', color: 'Blue', stock: 100 },
          { size: 'L', color: 'Blue', stock: 80 }
        ],
        purchaseLimit: 2
      }
    };
    const req4 = createMockReq(merchEventData, { id: organizer._id, role: 'organizer' });
    const res4 = createMockRes();
    
    await eventController.createEvent(req4, res4);
    console.log(`Status: ${res4.statusCode}`);
    console.log(`Success: ${res4.data.success}`);
    console.log(`Event type: ${res4.data.event?.type}`);
    console.log(`Has item details: ${!!res4.data.event?.itemDetails}\n`);

    // Clean up
    await Event.deleteMany({ organizerId: organizer._id });
    await User.deleteOne({ email: 'testorganizer@felicity.com' });
    console.log('✓ Test data cleaned up');

    mongoose.disconnect();
    console.log('\n✓ All createEvent tests completed!');

  } catch (error) {
    console.error('Test error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

testCreateEvent();
