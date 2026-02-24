const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');
const eventController = require('./controllers/eventController');
require('dotenv').config();

// Mock Express request and response
const createMockReq = (query, user) => ({ query: query || {}, user });
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

async function testGetEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Clean up and create test organizers
    await User.deleteMany({ email: /testorg.*@felicity.com/ });
    await Event.deleteMany({ name: /Test Event.*/ });

    const organizer1 = await User.create({
      email: 'testorg1@felicity.com',
      password: 'Test@123',
      role: 'organizer',
      organizerName: 'Tech Club',
      category: 'Technical'
    });

    const organizer2 = await User.create({
      email: 'testorg2@felicity.com',
      password: 'Test@123',
      role: 'organizer',
      organizerName: 'Cultural Club',
      category: 'Cultural'
    });

    console.log('✓ Test organizers created\n');

    // Create test events with different statuses and types
    const events = await Event.create([
      {
        name: 'Test Event - Tech Workshop',
        description: 'Published technical event',
        type: 'normal',
        eligibility: 'All students',
        registrationDeadline: new Date('2026-03-01'),
        eventStartDate: new Date('2026-03-15'),
        eventEndDate: new Date('2026-03-16'),
        organizerId: organizer1._id,
        status: 'published',
        tags: ['tech', 'workshop']
      },
      {
        name: 'Test Event - Dance Competition',
        description: 'Published cultural event',
        type: 'normal',
        eligibility: 'All',
        registrationDeadline: new Date('2026-03-10'),
        eventStartDate: new Date('2026-03-20'),
        eventEndDate: new Date('2026-03-21'),
        organizerId: organizer2._id,
        status: 'published'
      },
      {
        name: 'Test Event - Merch Sale',
        description: 'Published merchandise',
        type: 'merchandise',
        eligibility: 'All',
        registrationDeadline: new Date('2026-02-28'),
        eventStartDate: new Date('2026-03-05'),
        eventEndDate: new Date('2026-03-10'),
        organizerId: organizer1._id,
        status: 'published'
      },
      {
        name: 'Test Event - Draft Event',
        description: 'Draft event not visible to public',
        type: 'normal',
        eligibility: 'IIIT students only',
        registrationDeadline: new Date('2026-04-01'),
        eventStartDate: new Date('2026-04-15'),
        eventEndDate: new Date('2026-04-16'),
        organizerId: organizer1._id,
        status: 'draft'
      }
    ]);

    console.log('✓ Test events created\n');

    // Test 1: Get all published events (public view)
    console.log('Test 1: Get all published events (public view)');
    const req1 = createMockReq({}, null);
    const res1 = createMockRes();
    await eventController.getEvents(req1, res1);
    console.log(`Status: ${res1.statusCode}`);
    console.log(`Success: ${res1.data.success}`);
    console.log(`Events count: ${res1.data.count} (should be 3, no drafts)`);
    console.log(`Events: ${res1.data.events.map(e => e.name).join(', ')}\n`);

    // Test 2: Search by name
    console.log('Test 2: Search by event name');
    const req2 = createMockReq({ search: 'workshop' }, null);
    const res2 = createMockRes();
    await eventController.getEvents(req2, res2);
    console.log(`Status: ${res2.statusCode}`);
    console.log(`Events count: ${res2.data.count}`);
    console.log(`Found: ${res2.data.events.map(e => e.name).join(', ')}\n`);

    // Test 3: Filter by type
    console.log('Test 3: Filter by type (merchandise)');
    const req3 = createMockReq({ type: 'merchandise' }, null);
    const res3 = createMockRes();
    await eventController.getEvents(req3, res3);
    console.log(`Status: ${res3.statusCode}`);
    console.log(`Events count: ${res3.data.count}`);
    console.log(`Event type: ${res3.data.events[0]?.type}\n`);

    // Test 4: Filter by eligibility
    console.log('Test 4: Filter by eligibility');
    const req4 = createMockReq({ eligibility: 'students' }, null);
    const res4 = createMockRes();
    await eventController.getEvents(req4, res4);
    console.log(`Status: ${res4.statusCode}`);
    console.log(`Events count: ${res4.data.count}\n`);

    // Test 5: Filter by date range
    console.log('Test 5: Filter by date range');
    const req5 = createMockReq({ 
      startDate: '2026-03-01',
      endDate: '2026-03-16'
    }, null);
    const res5 = createMockRes();
    await eventController.getEvents(req5, res5);
    console.log(`Status: ${res5.statusCode}`);
    console.log(`Events count: ${res5.data.count}`);
    console.log(`Events in range: ${res5.data.events.map(e => e.name).join(', ')}\n`);

    // Test 6: Filter by organizerId
    console.log('Test 6: Filter by organizerId');
    const req6 = createMockReq({ organizerId: organizer1._id.toString() }, null);
    const res6 = createMockRes();
    await eventController.getEvents(req6, res6);
    console.log(`Status: ${res6.statusCode}`);
    console.log(`Events count: ${res6.data.count} (should be 2 published by organizer1)`);
    console.log(`Organizer name: ${res6.data.events[0]?.organizerId?.organizerName}\n`);

    // Test 7: Organizer viewing own events (should see drafts)
    console.log('Test 7: Organizer viewing own events (including drafts)');
    const req7 = createMockReq(
      { organizerId: organizer1._id.toString() },
      { id: organizer1._id.toString(), role: 'organizer' }
    );
    const res7 = createMockRes();
    await eventController.getEvents(req7, res7);
    console.log(`Status: ${res7.statusCode}`);
    console.log(`Events count: ${res7.data.count} (should be 3, includes draft)`);
    console.log(`Statuses: ${res7.data.events.map(e => e.status).join(', ')}\n`);

    // Test 8: Combined filters
    console.log('Test 8: Combined filters (type + search)');
    const req8 = createMockReq({ search: 'event', type: 'normal' }, null);
    const res8 = createMockRes();
    await eventController.getEvents(req8, res8);
    console.log(`Status: ${res8.statusCode}`);
    console.log(`Events count: ${res8.data.count}`);
    console.log(`All normal type: ${res8.data.events.every(e => e.type === 'normal')}\n`);

    // Clean up
    await Event.deleteMany({ name: /Test Event.*/ });
    await User.deleteMany({ email: /testorg.*@felicity.com/ });
    console.log('✓ Test data cleaned up');

    mongoose.disconnect();
    console.log('\n✓ All getEvents tests completed!');

  } catch (error) {
    console.error('Test error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

testGetEvents();
