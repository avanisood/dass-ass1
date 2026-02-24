const request = require('supertest');
const app = require('../server');
const { setupDB, createAdmin, createOrganizer, createParticipant } = require('./setup');
const PasswordResetRequest = require('../models/PasswordResetRequest');

setupDB();

describe('Password Reset API', () => {

    // ─── SUBMIT REQUEST ───────────────────────────────────────────────────

    describe('POST /api/password-reset/request', () => {
        it('should submit a password reset request as organizer', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${token}`)
                .send({ reason: 'Forgot my password' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.request.status).toBe('pending');
        });

        it('should reject duplicate pending request', async () => {
            const { token } = await createOrganizer();

            // First request
            await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${token}`)
                .send({ reason: 'First request' });

            // Duplicate
            const res = await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${token}`)
                .send({ reason: 'Second request' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already have a pending/i);
        });

        it('should reject password reset request from participant', async () => {
            const { token } = await createParticipant();

            const res = await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${token}`)
                .send({ reason: 'Not allowed' });

            expect(res.status).toBe(403);
        });

        it('should reject password reset request from admin', async () => {
            const { token } = await createAdmin();

            const res = await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${token}`)
                .send({ reason: 'Admin should not request' });

            expect(res.status).toBe(403);
        });
    });

    // ─── GET MY REQUEST ───────────────────────────────────────────────────

    describe('GET /api/password-reset/my-request', () => {
        it('should return pending request for organizer', async () => {
            const { token } = await createOrganizer();

            await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${token}`)
                .send({ reason: 'Need reset' });

            const res = await request(app)
                .get('/api/password-reset/my-request')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.request.status).toBe('pending');
        });

        it('should return null if no pending request', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .get('/api/password-reset/my-request')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.request).toBeNull();
        });
    });

    // ─── LIST REQUESTS (ADMIN) ────────────────────────────────────────────

    describe('GET /api/password-reset/requests', () => {
        it('should list all pending requests for admin', async () => {
            const { token: adminToken } = await createAdmin();
            const { token: orgToken } = await createOrganizer();

            await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${orgToken}`)
                .send({ reason: 'Reset needed' });

            const res = await request(app)
                .get('/api/password-reset/requests')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.requests.length).toBeGreaterThanOrEqual(1);
        });

        it('should reject listing by non-admin', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .get('/api/password-reset/requests')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    // ─── APPROVE REQUEST ──────────────────────────────────────────────────

    describe('POST /api/password-reset/approve/:id', () => {
        it('should approve request and generate new password', async () => {
            const { token: adminToken } = await createAdmin();
            const { token: orgToken } = await createOrganizer();

            const reqRes = await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${orgToken}`)
                .send({ reason: 'Forgot password' });

            const requestId = reqRes.body.request._id;

            const res = await request(app)
                .post(`/api/password-reset/approve/${requestId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.newCredentials.password).toBeDefined();
            expect(res.body.newCredentials.email).toBeDefined();
        });

        it('should allow organizer to login with new password after approval', async () => {
            const { token: adminToken } = await createAdmin();
            const { token: orgToken, user: org } = await createOrganizer();

            const reqRes = await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${orgToken}`)
                .send({ reason: 'Forgot' });

            const approveRes = await request(app)
                .post(`/api/password-reset/approve/${reqRes.body.request._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            const newPassword = approveRes.body.newCredentials.password;

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: org.email, password: newPassword });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body.success).toBe(true);
        });

        it('should reject approval by non-admin', async () => {
            const { token: orgToken } = await createOrganizer();

            const reqRes = await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${orgToken}`)
                .send({ reason: 'Reset' });

            const res = await request(app)
                .post(`/api/password-reset/approve/${reqRes.body.request._id}`)
                .set('Authorization', `Bearer ${orgToken}`);

            expect(res.status).toBe(403);
        });
    });

    // ─── REJECT REQUEST ───────────────────────────────────────────────────

    describe('POST /api/password-reset/reject/:id', () => {
        it('should reject a password reset request', async () => {
            const { token: adminToken } = await createAdmin();
            const { token: orgToken } = await createOrganizer();

            const reqRes = await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${orgToken}`)
                .send({ reason: 'Forgot' });

            const res = await request(app)
                .post(`/api/password-reset/reject/${reqRes.body.request._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/rejected/i);

            // Verify status updated in DB
            const updated = await PasswordResetRequest.findById(reqRes.body.request._id);
            expect(updated.status).toBe('rejected');
        });

        it('should reject rejection by non-admin', async () => {
            const { token: orgToken } = await createOrganizer();

            const reqRes = await request(app)
                .post('/api/password-reset/request')
                .set('Authorization', `Bearer ${orgToken}`)
                .send({ reason: 'Reset' });

            const res = await request(app)
                .post(`/api/password-reset/reject/${reqRes.body.request._id}`)
                .set('Authorization', `Bearer ${orgToken}`);

            expect(res.status).toBe(403);
        });

        it('should return 404 for non-existent request', async () => {
            const { token } = await createAdmin();

            const res = await request(app)
                .post('/api/password-reset/reject/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });
});
