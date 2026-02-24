const request = require('supertest');
const app = require('../server');
const { setupDB, createParticipant, createOrganizer, createTestEvent } = require('./setup');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

setupDB();

describe('Registration API', () => {

    // ─── NORMAL EVENT REGISTRATION ────────────────────────────────────────

    describe('POST /api/registrations (Normal Event)', () => {
        let organizer, participant, event;

        beforeEach(async () => {
            organizer = await createOrganizer();
            participant = await createParticipant();
            event = await createTestEvent(organizer.user._id, { status: 'published' });
        });

        it('should register for a normal event successfully', async () => {
            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: event._id, formData: { teamName: 'Alpha' } });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.registration.ticketId).toBeDefined();
            expect(res.body.registration.ticketId).toMatch(/^TICKET-/);
        });

        it('should reject registration for unpublished event', async () => {
            const draftEvent = await createTestEvent(organizer.user._id, { status: 'draft' });

            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: draftEvent._id });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/not open/i);
        });

        it('should reject registration past deadline', async () => {
            const pastEvent = await createTestEvent(organizer.user._id, {
                status: 'published',
                registrationDeadline: new Date('2020-01-01'),
                eventStartDate: new Date('2020-02-01'),
                eventEndDate: new Date('2020-02-02')
            });

            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: pastEvent._id });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/deadline/i);
        });

        it('should reject registration when limit is reached', async () => {
            const fullEvent = await createTestEvent(organizer.user._id, {
                status: 'published',
                registrationLimit: 1,
                registrationCount: 1
            });

            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: fullEvent._id });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/limit/i);
        });

        it('should reject duplicate registration for same event', async () => {
            // First registration
            await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: event._id });

            // Duplicate registration
            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: event._id });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already registered/i);
        });

        it('should reject registration with missing eventId', async () => {
            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should reject registration for non-existent event', async () => {
            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: '507f1f77bcf86cd799439011' });

            expect(res.status).toBe(404);
        });

        it('should increment event registrationCount on success', async () => {
            await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: event._id });

            const updatedEvent = await Event.findById(event._id);
            expect(updatedEvent.registrationCount).toBe(1);
        });
    });

    // ─── MERCHANDISE REGISTRATION ─────────────────────────────────────────

    describe('POST /api/registrations (Merchandise Event)', () => {
        let organizer, participant, merchEvent;

        beforeEach(async () => {
            organizer = await createOrganizer();
            participant = await createParticipant();
            merchEvent = await createTestEvent(organizer.user._id, {
                name: 'Fest Tee',
                type: 'merchandise',
                status: 'published',
                itemDetails: {
                    variants: [
                        { size: 'M', color: 'Black', stock: 10 },
                        { size: 'L', color: 'White', stock: 5 }
                    ],
                    purchaseLimit: 3
                }
            });
        });

        it('should register for merchandise with valid variant', async () => {
            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({
                    eventId: merchEvent._id,
                    variant: { size: 'M', color: 'Black' },
                    quantity: 1
                });

            expect(res.status).toBe(201);
            expect(res.body.registration.variant.size).toBe('M');
        });

        it('should reject merchandise registration without variant', async () => {
            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: merchEvent._id });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/variant/i);
        });

        it('should reject non-existent variant', async () => {
            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({
                    eventId: merchEvent._id,
                    variant: { size: 'XXL', color: 'Pink' }
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/not available/i);
        });

        it('should reject when stock is insufficient', async () => {
            const lowStockEvent = await createTestEvent(organizer.user._id, {
                name: 'Low Stock',
                type: 'merchandise',
                status: 'published',
                itemDetails: {
                    variants: [{ size: 'S', color: 'Red', stock: 1 }],
                    purchaseLimit: 5
                }
            });

            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({
                    eventId: lowStockEvent._id,
                    variant: { size: 'S', color: 'Red' },
                    quantity: 5
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/stock/i);
        });

        it('should reject when purchase limit is exceeded', async () => {
            const res = await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({
                    eventId: merchEvent._id,
                    variant: { size: 'M', color: 'Black' },
                    quantity: 5
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/limit/i);
        });

        it('should decrement stock after successful purchase', async () => {
            await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({
                    eventId: merchEvent._id,
                    variant: { size: 'M', color: 'Black' },
                    quantity: 2
                });

            const updated = await Event.findById(merchEvent._id);
            const mVariant = updated.itemDetails.variants.find(v => v.size === 'M' && v.color === 'Black');
            expect(mVariant.stock).toBe(8); // 10 - 2
        });
    });

    // ─── MY REGISTRATIONS ─────────────────────────────────────────────────

    describe('GET /api/registrations/my-registrations', () => {
        it('should return participant registrations', async () => {
            const organizer = await createOrganizer();
            const participant = await createParticipant();
            const event = await createTestEvent(organizer.user._id, { status: 'published' });

            // Register
            await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: event._id });

            const res = await request(app)
                .get('/api/registrations/my-registrations')
                .set('Authorization', `Bearer ${participant.token}`);

            expect(res.status).toBe(200);
            expect(res.body.registrations).toHaveLength(1);
        });

        it('should return empty array if no registrations', async () => {
            const { token } = await createParticipant();

            const res = await request(app)
                .get('/api/registrations/my-registrations')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.registrations).toHaveLength(0);
        });
    });

    // ─── CHECK REGISTRATION ───────────────────────────────────────────────

    describe('GET /api/registrations/check/:eventId', () => {
        it('should return isRegistered true when registered', async () => {
            const organizer = await createOrganizer();
            const participant = await createParticipant();
            const event = await createTestEvent(organizer.user._id, { status: 'published' });

            await request(app)
                .post('/api/registrations')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ eventId: event._id });

            const res = await request(app)
                .get(`/api/registrations/check/${event._id}`)
                .set('Authorization', `Bearer ${participant.token}`);

            expect(res.status).toBe(200);
            expect(res.body.isRegistered).toBe(true);
        });

        it('should return isRegistered false when not registered', async () => {
            const organizer = await createOrganizer();
            const participant = await createParticipant();
            const event = await createTestEvent(organizer.user._id, { status: 'published' });

            const res = await request(app)
                .get(`/api/registrations/check/${event._id}`)
                .set('Authorization', `Bearer ${participant.token}`);

            expect(res.status).toBe(200);
            expect(res.body.isRegistered).toBe(false);
        });
    });
});
