const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');

let mongoServer;
const TEST_JWT_SECRET = 'test-jwt-secret-key-for-testing';

// We test middleware directly by importing and calling them
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Helper to create mock req/res/next
const mockReq = (overrides = {}) => ({
    header: jest.fn().mockReturnValue(overrides.authHeader || null),
    user: overrides.user || null,
    ...overrides
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.NODE_ENV = 'test';

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);
});

afterEach(async () => {
    jest.clearAllMocks();
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
});

describe('Authentication Middleware', () => {
    it('should reject request with no Authorization header', async () => {
        const req = mockReq();
        const res = mockRes();

        await authenticate(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: expect.stringContaining('No token') })
        );
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed Authorization header', async () => {
        const req = mockReq({ authHeader: 'NotBearer token' });
        const res = mockRes();

        await authenticate(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid/expired token', async () => {
        const req = mockReq({ authHeader: 'Bearer invalidtoken123' });
        const res = mockRes();

        await authenticate(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach user to req and call next() with valid token', async () => {
        // Create user in test DB
        const user = await User.create({
            email: 'middleware@test.com',
            password: 'password123',
            role: 'participant',
            firstName: 'MW',
            lastName: 'Test'
        });

        const token = jwt.sign({ id: user._id, role: 'participant' }, TEST_JWT_SECRET, { expiresIn: '1h' });

        const req = mockReq({ authHeader: `Bearer ${token}` });
        const res = mockRes();
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.email).toBe('middleware@test.com');
    });

    it('should reject if user ID in token does not exist in DB', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const token = jwt.sign({ id: fakeId, role: 'participant' }, TEST_JWT_SECRET, { expiresIn: '1h' });

        const req = mockReq({ authHeader: `Bearer ${token}` });
        const res = mockRes();
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('Authorization Middleware', () => {
    it('should allow access when user has the required role', () => {
        const req = mockReq({ user: { role: 'admin' } });
        const res = mockRes();
        const next = jest.fn();

        authorize('admin')(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should deny access when user has wrong role', () => {
        const req = mockReq({ user: { role: 'participant' } });
        const res = mockRes();
        const next = jest.fn();

        authorize('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should accept multiple allowed roles (spread)', () => {
        const req = mockReq({ user: { role: 'organizer' } });
        const res = mockRes();
        const next = jest.fn();

        authorize('organizer', 'admin')(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should accept an array of allowed roles', () => {
        const req = mockReq({ user: { role: 'admin' } });
        const res = mockRes();
        const next = jest.fn();

        authorize(['organizer', 'admin'])(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should deny if user is not set on request', () => {
        const req = mockReq({ user: null });
        const res = mockRes();
        const next = jest.fn();

        authorize('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});
