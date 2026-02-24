const request = require('supertest');
const app = require('../server');
const { setupDB, createParticipant, createOrganizer, createAdmin } = require('./setup');
const User = require('../models/User');
const bcrypt = require('bcrypt');

setupDB();

describe('Auth API', () => {

    // ─── REGISTRATION ────────────────────────────────────────────────────

    describe('POST /api/auth/register', () => {
        it('should register a participant with IIIT email and set participantType to iiit', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'student@iiit.ac.in',
                    password: 'password123',
                    firstName: 'John',
                    lastName: 'Doe'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.participantType).toBe('iiit');
            expect(res.body.user.role).toBe('participant');
            expect(res.body.user.password).toBeUndefined();
        });

        it('should register a non-IIIT participant and set participantType to non-iiit', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'user@gmail.com',
                    password: 'password123',
                    firstName: 'Jane',
                    lastName: 'Doe'
                });

            expect(res.status).toBe(201);
            expect(res.body.user.participantType).toBe('non-iiit');
        });

        it('should detect IIIT subdomain emails as iiit type', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'student@students.iiit.ac.in',
                    password: 'password123',
                    firstName: 'Sub',
                    lastName: 'Domain'
                });

            expect(res.status).toBe(201);
            expect(res.body.user.participantType).toBe('iiit');
        });

        it('should reject registration with missing required fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@test.com' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject duplicate email registration', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'dup@test.com',
                    password: 'password123',
                    firstName: 'A',
                    lastName: 'B'
                });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'dup@test.com',
                    password: 'password123',
                    firstName: 'C',
                    lastName: 'D'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already exists/i);
        });

        it('should reject organizer self-registration', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'org@test.com',
                    password: 'password123',
                    firstName: 'Org',
                    lastName: 'User',
                    role: 'organizer'
                });

            expect(res.status).toBe(403);
        });

        it('should reject admin self-registration', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'adm@test.com',
                    password: 'password123',
                    firstName: 'Adm',
                    lastName: 'User',
                    role: 'admin'
                });

            expect(res.status).toBe(403);
        });

        it('should hash the password before storing', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'hash@test.com',
                    password: 'plaintext123',
                    firstName: 'Hash',
                    lastName: 'Test'
                });

            const user = await User.findOne({ email: 'hash@test.com' });
            expect(user.password).not.toBe('plaintext123');
            const isMatch = await bcrypt.compare('plaintext123', user.password);
            expect(isMatch).toBe(true);
        });
    });

    // ─── LOGIN ────────────────────────────────────────────────────────────

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await createParticipant({ email: 'login@iiit.ac.in', password: 'password123' });
        });

        it('should login with valid credentials and return JWT', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login@iiit.ac.in', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe('login@iiit.ac.in');
            expect(res.body.user.password).toBeUndefined();
        });

        it('should reject login with wrong email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'wrong@iiit.ac.in', password: 'password123' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should reject login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login@iiit.ac.in', password: 'wrongpassword' });

            expect(res.status).toBe(401);
        });

        it('should reject login with missing fields', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login@iiit.ac.in' });

            expect(res.status).toBe(400);
        });
    });

    // ─── GET ME ───────────────────────────────────────────────────────────

    describe('GET /api/auth/me', () => {
        it('should return current user with valid token', async () => {
            const { token } = await createParticipant();

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBeDefined();
            expect(res.body.user.password).toBeUndefined();
        });

        it('should reject request with no token', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
        });

        it('should reject request with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalidtoken123');

            expect(res.status).toBe(401);
        });
    });

    // ─── PROFILE UPDATE ───────────────────────────────────────────────────

    describe('PUT /api/auth/profile', () => {
        it('should update organizer profile fields', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    organizerName: 'Updated Club',
                    category: 'Cultural',
                    description: 'Updated description'
                });

            expect(res.status).toBe(200);
            expect(res.body.user.organizerName).toBe('Updated Club');
            expect(res.body.user.category).toBe('Cultural');
        });

        it('should update participant profile fields', async () => {
            const { token } = await createParticipant();

            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    firstName: 'Updated',
                    lastName: 'Name',
                    contactNumber: '1234567890',
                    interests: ['tech', 'music']
                });

            expect(res.status).toBe(200);
            expect(res.body.user.firstName).toBe('Updated');
            expect(res.body.user.interests).toEqual(['tech', 'music']);
        });

        it('should not allow profile update without auth', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .send({ firstName: 'Hack' });

            expect(res.status).toBe(401);
        });
    });

    // ─── ONBOARDING ───────────────────────────────────────────────────────

    describe('POST /api/auth/onboarding', () => {
        it('should complete onboarding with interests', async () => {
            const { token } = await createParticipant({ onboardingCompleted: false });

            const res = await request(app)
                .post('/api/auth/onboarding')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    interests: ['coding', 'robotics'],
                    followedOrganizers: []
                });

            expect(res.status).toBe(200);
            expect(res.body.user.onboardingCompleted).toBe(true);
            expect(res.body.user.interests).toContain('coding');
        });

        it('should complete onboarding with followed organizers', async () => {
            const { user: org } = await createOrganizer();
            const { token } = await createParticipant({
                email: 'onboard@iiit.ac.in',
                onboardingCompleted: false
            });

            const res = await request(app)
                .post('/api/auth/onboarding')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    interests: [],
                    followedOrganizers: [org._id]
                });

            expect(res.status).toBe(200);
            expect(res.body.user.followedOrganizers).toHaveLength(1);
        });
    });

    // ─── CHANGE PASSWORD ──────────────────────────────────────────────────

    describe('POST /api/auth/change-password', () => {
        it('should change password with correct current password', async () => {
            const { token } = await createParticipant({ password: 'oldpass123' });

            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'oldpass123', newPassword: 'newpass123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject with wrong current password', async () => {
            const { token } = await createParticipant({ password: 'oldpass123' });

            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'wrongpass', newPassword: 'newpass123' });

            expect(res.status).toBe(401);
        });

        it('should reject if new password is too short', async () => {
            const { token } = await createParticipant({ password: 'oldpass123' });

            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'oldpass123', newPassword: '123' });

            expect(res.status).toBe(400);
        });

        it('should reject with missing fields', async () => {
            const { token } = await createParticipant();

            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'password123' });

            expect(res.status).toBe(400);
        });
    });
});
