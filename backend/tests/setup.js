const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Event = require('../models/Event');

let mongoServer;

// JWT secret for tests
const TEST_JWT_SECRET = 'test-jwt-secret-key-for-testing';

/**
 * Connect to in-memory MongoDB before all tests
 */
const setupDB = () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        // Set env vars for the app
        process.env.NODE_ENV = 'test';
        process.env.JWT_SECRET = TEST_JWT_SECRET;
        process.env.MONGODB_URI = uri;

        // Disconnect any existing connection first
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        await mongoose.connect(uri);
    });

    afterEach(async () => {
        // Clear all collections after each test
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    afterAll(async () => {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    });
};

/**
 * Create a test participant user and return { user, token }
 */
const createParticipant = async (overrides = {}) => {
    const data = {
        email: overrides.email || 'participant@iiit.ac.in',
        password: 'password123',
        role: 'participant',
        firstName: 'Test',
        lastName: 'Participant',
        participantType: 'iiit',
        college: 'IIIT Hyderabad',
        contactNumber: '9999999999',
        onboardingCompleted: true,
        ...overrides
    };

    const user = await User.create(data);
    const token = jwt.sign(
        { id: user._id, role: user.role },
        TEST_JWT_SECRET,
        { expiresIn: '7d' }
    );

    return { user, token };
};

/**
 * Create a test organizer user and return { user, token }
 */
const createOrganizer = async (overrides = {}) => {
    const data = {
        email: overrides.email || 'techclub@felicity.com',
        password: 'password123',
        role: 'organizer',
        organizerName: 'Tech Club',
        category: 'Technical',
        description: 'A technical club',
        contactEmail: 'tech@iiit.ac.in',
        ...overrides
    };

    const user = await User.create(data);
    const token = jwt.sign(
        { id: user._id, role: user.role },
        TEST_JWT_SECRET,
        { expiresIn: '7d' }
    );

    return { user, token };
};

/**
 * Create a test admin user and return { user, token }
 */
const createAdmin = async (overrides = {}) => {
    const data = {
        email: overrides.email || 'admin@felicity.com',
        password: 'adminpassword123',
        role: 'admin',
        ...overrides
    };

    const user = await User.create(data);
    const token = jwt.sign(
        { id: user._id, role: user.role },
        TEST_JWT_SECRET,
        { expiresIn: '7d' }
    );

    return { user, token };
};

/**
 * Create a test event and return the event document
 */
const createTestEvent = async (organizerId, overrides = {}) => {
    const now = new Date();
    const data = {
        name: 'Test Event',
        description: 'A test event description',
        type: 'normal',
        eligibility: 'All',
        registrationDeadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        eventStartDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        eventEndDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        registrationLimit: 100,
        registrationFee: 0,
        organizerId,
        status: 'published',
        tags: ['tech', 'coding'],
        ...overrides
    };

    return await Event.create(data);
};

module.exports = {
    setupDB,
    createParticipant,
    createOrganizer,
    createAdmin,
    createTestEvent,
    TEST_JWT_SECRET
};
