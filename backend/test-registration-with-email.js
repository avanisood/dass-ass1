require('dotenv').config();
const mongoose = require('mongoose');
const { registerForEvent } = require('./controllers/registrationController');
const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

/**
 * Test full registration flow with email sending
 */
const testRegistrationWithEmail = async () => {
  let testUser;
  let testOrganizer;
  let testEvent;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test organizer
    testOrganizer = await User.create({
      firstName: 'Test',
      lastName: 'Organizer',
      email: 'testorg@felicity.com',
      password: 'Test@123',
      organizerName: 'Test Org',
      organizerCategory: 'Technical',
      role: 'organizer'
    });

    // Create test participant with YOUR email
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: process.env.EMAIL_USER, // Use your email to receive test email
      password: 'Test@123',
      rollNo: 'TEST001',
      phoneNo: '9876543210',
      participantType: 'iiit',
      role: 'participant'
    });

    // Create test event
    testEvent = await Event.create({
      name: 'Email Test Event',
      description: 'Testing email functionality with registration',
      type: 'normal',
      eligibility: 'all',
      organizerId: testOrganizer._id,
      eventStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      eventEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      registrationLimit: 100,
      registrationFee: 500,
      status: 'published'
    });

    console.log('\n=== Testing Registration with Email ===');
    console.log('Event:', testEvent.name);
    console.log('Participant:', testUser.email);

    // Mock request and response
    const req = {
      body: {
        eventId: testEvent._id,
        formData: { notes: 'Testing email functionality' }
      },
      user: {
        id: testUser._id,
        email: testUser.email
      }
    };

    const res = {
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

    // Register for event (this will send email)
    await registerForEvent(req, res);

    console.log('\nRegistration Status:', res.status_code);
    console.log('Success:', res.json_data.success);
    console.log('Message:', res.json_data.message);

    if (res.json_data.registration) {
      console.log('\nRegistration Details:');
      console.log('- Ticket ID:', res.json_data.registration.ticketId);
      console.log('- QR Code generated:', !!res.json_data.registration.qrCode);
      console.log('- Event:', res.json_data.registration.eventId.name);
      console.log('- Fee:', res.json_data.registration.eventId.registrationFee);
    }

    console.log('\n✓ Check your email inbox:', process.env.EMAIL_USER);
    console.log('  (Check spam folder if you don\'t see it)');
    console.log('\nEmail should contain:');
    console.log('- Event details');
    console.log('- Ticket ID');
    console.log('- QR code image');
    console.log('- Professional HTML formatting');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Cleanup
    if (testUser) await User.deleteOne({ _id: testUser._id });
    if (testOrganizer) await User.deleteOne({ _id: testOrganizer._id });
    if (testEvent) await Event.deleteOne({ _id: testEvent._id });
    await Registration.deleteMany({ participantId: testUser?._id });
    await mongoose.connection.close();
    console.log('\nCleaned up test data and closed connection');
  }
};

testRegistrationWithEmail();
