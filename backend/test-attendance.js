require('dotenv').config();
const mongoose = require('mongoose');
const { markAttendance } = require('./controllers/registrationController');
const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

/**
 * Test Attendance Marking Function
 */
const testMarkAttendance = async () => {
  let organizer;
  let otherOrganizer;
  let participant;
  let event;
  let registration;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Setup: Create test organizer
    organizer = await User.create({
      firstName: 'Event',
      lastName: 'Organizer',
      email: 'eventorg@felicity.com',
      password: 'Test@123',
      organizerName: 'Event Org',
      organizerCategory: 'Technical',
      role: 'organizer'
    });

    // Setup: Create another organizer
    otherOrganizer = await User.create({
      firstName: 'Other',
      lastName: 'Organizer',
      email: 'otherorg@felicity.com',
      password: 'Test@123',
      organizerName: 'Other Org',
      organizerCategory: 'Cultural',
      role: 'organizer'
    });

    // Setup: Create test participant
    participant = await User.create({
      firstName: 'Test',
      lastName: 'Participant',
      email: 'testpart@iiit.ac.in',
      password: 'Test@123',
      rollNo: 'TEST001',
      phoneNo: '9876543210',
      participantType: 'iiit',
      role: 'participant'
    });

    // Setup: Create test event
    event = await Event.create({
      name: 'Attendance Test Event',
      description: 'Testing attendance marking',
      type: 'normal',
      eligibility: 'all',
      organizerId: organizer._id,
      eventStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      eventEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'published'
    });

    // Setup: Create test registration
    registration = await Registration.create({
      participantId: participant._id,
      eventId: event._id,
      formData: {},
      ticketId: 'TEST-TICKET-123456',
      qrCode: 'test-qr-code',
      status: 'registered',
      paymentStatus: 'paid'
    });

    console.log('\n=== Test 1: Successful Attendance Marking ===');
    const req1 = {
      body: { ticketId: registration.ticketId },
      user: { id: organizer._id }
    };
    const res1 = createMockResponse();
    await markAttendance(req1, res1);
    console.log('Status:', res1.status_code);
    console.log('Success:', res1.json_data.success);
    console.log('Message:', res1.json_data.message);
    if (res1.json_data.participant) {
      console.log('Participant:', res1.json_data.participant.name);
      console.log('Email:', res1.json_data.participant.email);
      console.log('Event:', res1.json_data.participant.eventName);
      console.log('Attendance Time:', res1.json_data.participant.attendanceTime);
    }

    console.log('\n=== Test 2: Duplicate Attendance Marking ===');
    const req2 = {
      body: { ticketId: registration.ticketId },
      user: { id: organizer._id }
    };
    const res2 = createMockResponse();
    await markAttendance(req2, res2);
    console.log('Status:', res2.status_code);
    console.log('Message:', res2.json_data.message);
    if (res2.json_data.details) {
      console.log('Already marked at:', res2.json_data.details.attendanceTime);
    }

    console.log('\n=== Test 3: Missing Ticket ID ===');
    const req3 = {
      body: {},
      user: { id: organizer._id }
    };
    const res3 = createMockResponse();
    await markAttendance(req3, res3);
    console.log('Status:', res3.status_code);
    console.log('Message:', res3.json_data.message);

    console.log('\n=== Test 4: Invalid Ticket ID ===');
    const req4 = {
      body: { ticketId: 'INVALID-TICKET-999' },
      user: { id: organizer._id }
    };
    const res4 = createMockResponse();
    await markAttendance(req4, res4);
    console.log('Status:', res4.status_code);
    console.log('Message:', res4.json_data.message);

    console.log('\n=== Test 5: Unauthorized Organizer ===');
    const req5 = {
      body: { ticketId: registration.ticketId },
      user: { id: otherOrganizer._id }
    };
    const res5 = createMockResponse();
    await markAttendance(req5, res5);
    console.log('Status:', res5.status_code);
    console.log('Message:', res5.json_data.message);

    // Create a new registration for Test 6
    const registration2 = await Registration.create({
      participantId: participant._id,
      eventId: event._id,
      formData: {},
      ticketId: 'TEST-TICKET-789012',
      qrCode: 'test-qr-code-2',
      status: 'registered',
      paymentStatus: 'paid'
    });

    console.log('\n=== Test 6: Mark Attendance for Second Ticket ===');
    const req6 = {
      body: { ticketId: registration2.ticketId },
      user: { id: organizer._id }
    };
    const res6 = createMockResponse();
    await markAttendance(req6, res6);
    console.log('Status:', res6.status_code);
    console.log('Success:', res6.json_data.success);
    if (res6.json_data.participant) {
      console.log('Ticket ID:', res6.json_data.participant.ticketId);
      console.log('Attendance Time:', res6.json_data.participant.attendanceTime);
    }

    console.log('\n=== Test Summary ===');
    const totalTests = 6;
    const passedTests = [
      res1.status_code === 200 && res1.json_data.success,
      res2.status_code === 400 && res2.json_data.message.includes('already marked'),
      res3.status_code === 400 && res3.json_data.message.includes('required'),
      res4.status_code === 404 && res4.json_data.message.includes('not found'),
      res5.status_code === 403 && res5.json_data.message.includes('Unauthorized'),
      res6.status_code === 200 && res6.json_data.success
    ].filter(Boolean).length;

    console.log(`Tests passed: ${passedTests}/${totalTests}`);

    // Verify database updates
    const updatedReg1 = await Registration.findById(registration._id);
    const updatedReg2 = await Registration.findById(registration2._id);
    console.log('\nDatabase Verification:');
    console.log('Registration 1 attended:', updatedReg1.attended, '| Time:', updatedReg1.attendanceTimestamp);
    console.log('Registration 2 attended:', updatedReg2.attended, '| Time:', updatedReg2.attendanceTimestamp);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Cleanup
    if (organizer) await User.deleteOne({ _id: organizer._id });
    if (otherOrganizer) await User.deleteOne({ _id: otherOrganizer._id });
    if (participant) await User.deleteOne({ _id: participant._id });
    if (event) await Event.deleteOne({ _id: event._id });
    await Registration.deleteMany({ ticketId: { $regex: /^TEST-TICKET/ } });
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

testMarkAttendance();
