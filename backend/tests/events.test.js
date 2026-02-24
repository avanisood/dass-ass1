const request = require('supertest');
const app = require('../server');
const { setupDB, createOrganizer, createParticipant, createAdmin, createTestEvent } = require('./setup');
const Event = require('../models/Event');

setupDB();

describe('Events API', () => {

    // ─── CREATE EVENT ─────────────────────────────────────────────────────

    describe('POST /api/events', () => {
        it('should create a draft event as organizer', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Hackathon 2026',
                    description: 'Annual hackathon',
                    type: 'normal',
                    eligibility: 'All',
                    registrationDeadline: '2026-03-01',
                    eventStartDate: '2026-03-10',
                    eventEndDate: '2026-03-11',
                    registrationLimit: 50,
                    registrationFee: 100,
                    tags: ['tech', 'coding']
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.event.name).toBe('Hackathon 2026');
            expect(res.body.event.status).toBe('draft');
            expect(res.body.event.type).toBe('normal');
        });

        it('should create a merchandise event with item details', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Fest T-Shirts',
                    description: 'Official fest merchandise',
                    type: 'merchandise',
                    eligibility: 'All',
                    registrationDeadline: '2026-03-01',
                    eventStartDate: '2026-03-10',
                    eventEndDate: '2026-03-11',
                    itemDetails: {
                        variants: [
                            { size: 'M', color: 'Black', stock: 50 },
                            { size: 'L', color: 'Black', stock: 30 }
                        ],
                        purchaseLimit: 3
                    }
                });

            expect(res.status).toBe(201);
            expect(res.body.event.type).toBe('merchandise');
            expect(res.body.event.itemDetails.variants).toHaveLength(2);
        });

        it('should reject event creation with missing required fields', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Incomplete Event' });

            expect(res.status).toBe(400);
        });

        it('should reject event creation with missing dates', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'No Dates',
                    description: 'Event without dates',
                    type: 'normal',
                    eligibility: 'All'
                });

            expect(res.status).toBe(400);
        });

        it('should reject if registration deadline is after event start', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Bad Dates',
                    description: 'Wrong date ordering',
                    type: 'normal',
                    eligibility: 'All',
                    registrationDeadline: '2026-04-01',
                    eventStartDate: '2026-03-01',
                    eventEndDate: '2026-03-02'
                });

            expect(res.status).toBe(400);
        });

        it('should reject if event start date is after end date', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Bad Dates 2',
                    description: 'Start after end',
                    type: 'normal',
                    eligibility: 'All',
                    registrationDeadline: '2026-02-01',
                    eventStartDate: '2026-04-01',
                    eventEndDate: '2026-03-01'
                });

            expect(res.status).toBe(400);
        });

        it('should reject event creation by participant', async () => {
            const { token } = await createParticipant();

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Participant Event',
                    description: 'Should not work',
                    type: 'normal',
                    eligibility: 'All',
                    registrationDeadline: '2026-03-01',
                    eventStartDate: '2026-03-10',
                    eventEndDate: '2026-03-11'
                });

            expect(res.status).toBe(403);
        });

        it('should accept custom form fields for normal events', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Form Event',
                    description: 'Event with custom form',
                    type: 'normal',
                    eligibility: 'All',
                    registrationDeadline: '2026-03-01',
                    eventStartDate: '2026-03-10',
                    eventEndDate: '2026-03-11',
                    customForm: [
                        { fieldType: 'text', label: 'Team Name', required: true },
                        { fieldType: 'dropdown', label: 'T-Shirt Size', required: false, options: ['S', 'M', 'L'] }
                    ]
                });

            expect(res.status).toBe(201);
            expect(res.body.event.customForm).toHaveLength(2);
        });
    });

    // ─── GET EVENTS (BROWSE) ─────────────────────────────────────────────

    describe('GET /api/events', () => {
        let organizer;

        beforeEach(async () => {
            organizer = await createOrganizer();
            // Create a published event
            await createTestEvent(organizer.user._id, { name: 'Published Event', status: 'published' });
            // Create a draft event
            await createTestEvent(organizer.user._id, { name: 'Draft Event', status: 'draft' });
        });

        it('should return only published events for public access', async () => {
            const res = await request(app).get('/api/events');

            expect(res.status).toBe(200);
            expect(res.body.events.length).toBe(1);
            expect(res.body.events[0].name).toBe('Published Event');
        });

        it('should search events by name', async () => {
            const res = await request(app).get('/api/events?search=Published');

            expect(res.status).toBe(200);
            expect(res.body.events.length).toBe(1);
        });

        it('should return no results for non-matching search', async () => {
            const res = await request(app).get('/api/events?search=nonexistent');

            expect(res.status).toBe(200);
            expect(res.body.events.length).toBe(0);
        });

        it('should filter events by type', async () => {
            await createTestEvent(organizer.user._id, {
                name: 'Merch Event',
                type: 'merchandise',
                status: 'published'
            });

            const res = await request(app).get('/api/events?type=merchandise');

            expect(res.status).toBe(200);
            expect(res.body.events.every(e => e.type === 'merchandise')).toBe(true);
        });

        it('should filter events by eligibility', async () => {
            await createTestEvent(organizer.user._id, {
                name: 'IIIT Only',
                eligibility: 'IIIT Students Only',
                status: 'published'
            });

            const res = await request(app).get('/api/events?eligibility=IIIT');

            expect(res.status).toBe(200);
            expect(res.body.events.length).toBeGreaterThanOrEqual(1);
        });

        it('should filter events by date range', async () => {
            const now = new Date();
            const futureStart = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
            const futureEnd = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

            const res = await request(app)
                .get(`/api/events?startDate=${futureStart.toISOString()}&endDate=${futureEnd.toISOString()}`);

            expect(res.status).toBe(200);
        });
    });

    // ─── GET EVENT BY ID ──────────────────────────────────────────────────

    describe('GET /api/events/:id', () => {
        it('should return event details by ID', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id);

            const res = await request(app).get(`/api/events/${event._id}`);

            expect(res.status).toBe(200);
            expect(res.body.event.name).toBe('Test Event');
        });

        it('should return 404 for non-existent event', async () => {
            const res = await request(app).get('/api/events/507f1f77bcf86cd799439011');

            expect(res.status).toBe(404);
        });
    });

    // ─── UPDATE EVENT ─────────────────────────────────────────────────────

    describe('PUT /api/events/:id', () => {
        it('should update a draft event by its owner', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'draft' });

            const res = await request(app)
                .put(`/api/events/${event._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Updated Event Name', description: 'Updated description' });

            expect(res.status).toBe(200);
            expect(res.body.event.name).toBe('Updated Event Name');
        });

        it('should reject editing a published event', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'published' });

            const res = await request(app)
                .put(`/api/events/${event._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Should Fail' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/cannot edit/i);
        });

        it('should reject editing by non-owner organizer', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'draft' });

            const { token: otherToken } = await createOrganizer({ email: 'other@felicity.com', organizerName: 'Other Club' });

            const res = await request(app)
                .put(`/api/events/${event._id}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ name: 'Stolen Event' });

            expect(res.status).toBe(403);
        });

        it('should return 404 for non-existent event', async () => {
            const { token } = await createOrganizer();

            const res = await request(app)
                .put('/api/events/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Ghost Event' });

            expect(res.status).toBe(404);
        });
    });

    // ─── DELETE EVENT ─────────────────────────────────────────────────────

    describe('DELETE /api/events/:id', () => {
        it('should delete a draft event', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'draft' });

            const res = await request(app)
                .delete(`/api/events/${event._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            const found = await Event.findById(event._id);
            expect(found).toBeNull();
        });

        it('should reject deleting a published event', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'published' });

            const res = await request(app)
                .delete(`/api/events/${event._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
        });

        it('should reject deleting by non-owner', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'draft' });

            const { token: otherToken } = await createOrganizer({ email: 'other@felicity.com', organizerName: 'Other Club' });

            const res = await request(app)
                .delete(`/api/events/${event._id}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
        });

        it('should allow admin to delete a draft event', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'draft' });
            const { token: adminToken } = await createAdmin();

            const res = await request(app)
                .delete(`/api/events/${event._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        });
    });

    // ─── STATUS TRANSITIONS ───────────────────────────────────────────────

    describe('PUT /api/events/:id/status', () => {
        it('should transition from draft to published', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'draft' });

            const res = await request(app)
                .put(`/api/events/${event._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'published' });

            expect(res.status).toBe(200);
            expect(res.body.event.status).toBe('published');
        });

        it('should transition from published to ongoing', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'published' });

            const res = await request(app)
                .put(`/api/events/${event._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'ongoing' });

            expect(res.status).toBe(200);
            expect(res.body.event.status).toBe('ongoing');
        });

        it('should transition from published to closed', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'published' });

            const res = await request(app)
                .put(`/api/events/${event._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'closed' });

            expect(res.status).toBe(200);
            expect(res.body.event.status).toBe('closed');
        });

        it('should transition from ongoing to completed', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'ongoing' });

            const res = await request(app)
                .put(`/api/events/${event._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'completed' });

            expect(res.status).toBe(200);
        });

        it('should reject invalid transition draft -> ongoing', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'draft' });

            const res = await request(app)
                .put(`/api/events/${event._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'ongoing' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/cannot transition/i);
        });

        it('should reject transition from completed to anything', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'completed' });

            const res = await request(app)
                .put(`/api/events/${event._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'published' });

            expect(res.status).toBe(400);
        });

        it('should reject transition from closed to anything', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'closed' });

            const res = await request(app)
                .put(`/api/events/${event._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'ongoing' });

            expect(res.status).toBe(400);
        });

        it('should reject invalid status value', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'draft' });

            const res = await request(app)
                .put(`/api/events/${event._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'invalid_status' });

            expect(res.status).toBe(400);
        });

        it('should reject status change by non-owner', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'draft' });

            const { token: otherToken } = await createOrganizer({ email: 'other@felicity.com', organizerName: 'Other' });

            const res = await request(app)
                .put(`/api/events/${event._id}/status`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ status: 'published' });

            expect(res.status).toBe(403);
        });
    });

    // ─── EVENT REGISTRATIONS (ORGANIZER VIEW) ─────────────────────────────

    describe('GET /api/events/:id/registrations', () => {
        it('should return registrations for event owner', async () => {
            const { user, token } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'published' });

            const res = await request(app)
                .get(`/api/events/${event._id}/registrations`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.registrations).toBeDefined();
        });

        it('should reject registration view by non-owner organizer', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id);

            const { token: otherToken } = await createOrganizer({ email: 'other@felicity.com', organizerName: 'Other' });

            const res = await request(app)
                .get(`/api/events/${event._id}/registrations`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
        });

        it('should reject registration view by participant', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id);

            const { token: partToken } = await createParticipant();

            const res = await request(app)
                .get(`/api/events/${event._id}/registrations`)
                .set('Authorization', `Bearer ${partToken}`);

            expect(res.status).toBe(403);
        });
    });
});
