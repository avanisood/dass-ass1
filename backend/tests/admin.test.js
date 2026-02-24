const request = require('supertest');
const app = require('../server');
const { setupDB, createAdmin, createOrganizer, createParticipant, createTestEvent } = require('./setup');
const User = require('../models/User');

setupDB();

describe('Admin API', () => {

    // ─── CREATE ORGANIZER ─────────────────────────────────────────────────

    describe('POST /api/organizers', () => {
        it('should create organizer with auto-generated credentials', async () => {
            const { token } = await createAdmin();

            const res = await request(app)
                .post('/api/organizers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    organizerName: 'Music Club',
                    category: 'Cultural',
                    description: 'College music club',
                    contactEmail: 'music@iiit.ac.in'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.credentials.email).toMatch(/@felicity\.com$/);
            expect(res.body.credentials.password).toBeDefined();
            expect(res.body.credentials.password.length).toBeGreaterThanOrEqual(12);
            expect(res.body.organizer.organizerName).toBe('Music Club');
        });

        it('should generate correct login email from organizer name', async () => {
            const { token } = await createAdmin();

            const res = await request(app)
                .post('/api/organizers')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizerName: 'Drama Club', category: 'Cultural' });

            expect(res.body.credentials.email).toBe('dramaclub@felicity.com');
        });

        it('should allow new organizer to login with generated credentials', async () => {
            const { token: adminToken } = await createAdmin();

            const createRes = await request(app)
                .post('/api/organizers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ organizerName: 'Login Test Club', category: 'Tech' });

            const { email, password } = createRes.body.credentials;

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email, password });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body.user.role).toBe('organizer');
        });

        it('should reject organizer creation with missing fields', async () => {
            const { token } = await createAdmin();

            const res = await request(app)
                .post('/api/organizers')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizerName: 'No Category' });

            expect(res.status).toBe(400);
        });

        it('should reject duplicate organizer name', async () => {
            const { token } = await createAdmin();

            await request(app)
                .post('/api/organizers')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizerName: 'Duplicate Club', category: 'Tech' });

            const res = await request(app)
                .post('/api/organizers')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizerName: 'Duplicate Club', category: 'Cultural' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already exists/i);
        });

        it('should reject organizer creation by non-admin', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .post('/api/organizers')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizerName: 'Hacker Club', category: 'Tech' });

            expect(res.status).toBe(403);
        });

        it('should reject organizer creation by participant', async () => {
            const { token } = await createParticipant();

            const res = await request(app)
                .post('/api/organizers')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizerName: 'Participant Club', category: 'Tech' });

            expect(res.status).toBe(403);
        });
    });

    // ─── GET ORGANIZERS ───────────────────────────────────────────────────

    describe('GET /api/organizers', () => {
        it('should list all organizers (admin only)', async () => {
            const { token } = await createAdmin();
            await createOrganizer();

            const res = await request(app)
                .get('/api/organizers')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.organizers.length).toBeGreaterThanOrEqual(1);
            // Ensure no passwords are returned
            res.body.organizers.forEach(org => {
                expect(org.password).toBeUndefined();
            });
        });

        it('should reject organizer listing by non-admin', async () => {
            const { token } = await createParticipant();

            const res = await request(app)
                .get('/api/organizers')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    // ─── DELETE ORGANIZER ─────────────────────────────────────────────────

    describe('DELETE /api/organizers/:id', () => {
        it('should delete an organizer', async () => {
            const { token } = await createAdmin();
            const { user: org } = await createOrganizer();

            const res = await request(app)
                .delete(`/api/organizers/${org._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);

            // Verify organizer is actually deleted
            const found = await User.findById(org._id);
            expect(found).toBeNull();
        });

        it('should return 404 for non-existent organizer', async () => {
            const { token } = await createAdmin();

            const res = await request(app)
                .delete('/api/organizers/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('should reject organizer deletion by non-admin', async () => {
            const { user: org, token } = await createOrganizer();

            const res = await request(app)
                .delete(`/api/organizers/${org._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    // ─── ADMIN STATS ──────────────────────────────────────────────────────

    describe('GET /api/admin/stats', () => {
        it('should return dashboard stats', async () => {
            const { token } = await createAdmin();
            await createOrganizer();
            await createParticipant();

            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.stats.totalParticipants).toBeGreaterThanOrEqual(1);
            expect(res.body.stats.totalOrganizers).toBeGreaterThanOrEqual(1);
            expect(res.body.stats.totalEvents).toBeDefined();
            expect(res.body.stats.totalRegistrations).toBeDefined();
        });

        it('should reject stats access by non-admin', async () => {
            const { token } = await createParticipant();

            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    // ─── GET ALL USERS ────────────────────────────────────────────────────

    describe('GET /api/admin/users', () => {
        it('should list all users', async () => {
            const { token } = await createAdmin();
            await createParticipant();
            await createOrganizer();

            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.users.length).toBeGreaterThanOrEqual(3); // admin + participant + organizer
        });

        it('should filter users by role', async () => {
            const { token } = await createAdmin();
            await createParticipant();
            await createOrganizer();

            const res = await request(app)
                .get('/api/admin/users?role=participant')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.users.every(u => u.role === 'participant')).toBe(true);
        });

        it('should reject user listing by non-admin', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });
});
