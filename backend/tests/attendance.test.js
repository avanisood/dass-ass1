const request = require('supertest');
const app = require('../server');
const { setupDB, createParticipant, createOrganizer, createTestEvent } = require('./setup');
const Registration = require('../models/Registration');

setupDB();

describe('Attendance API', () => {
    let organizer, participant, event, registration;

    beforeEach(async () => {
        organizer = await createOrganizer();
        participant = await createParticipant();
        event = await createTestEvent(organizer.user._id, { status: 'published' });

        // Register participant for event
        const regRes = await request(app)
            .post('/api/registrations')
            .set('Authorization', `Bearer ${participant.token}`)
            .send({ eventId: event._id });

        registration = regRes.body.registration;
    });

    describe('POST /api/registrations/attendance/mark', () => {
        it('should mark attendance for a valid ticket', async () => {
            const res = await request(app)
                .post('/api/registrations/attendance/mark')
                .set('Authorization', `Bearer ${organizer.token}`)
                .send({ ticketId: registration.ticketId });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.participant.ticketId).toBe(registration.ticketId);
            expect(res.body.participant.attendanceTime).toBeDefined();
        });

        it('should reject duplicate scan (attendance already marked)', async () => {
            // Mark attendance first time
            await request(app)
                .post('/api/registrations/attendance/mark')
                .set('Authorization', `Bearer ${organizer.token}`)
                .send({ ticketId: registration.ticketId });

            // Try marking again
            const res = await request(app)
                .post('/api/registrations/attendance/mark')
                .set('Authorization', `Bearer ${organizer.token}`)
                .send({ ticketId: registration.ticketId });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already marked/i);
            expect(res.body.details.attendanceTime).toBeDefined();
        });

        it('should reject invalid ticket ID', async () => {
            const res = await request(app)
                .post('/api/registrations/attendance/mark')
                .set('Authorization', `Bearer ${organizer.token}`)
                .send({ ticketId: 'INVALID-TICKET-123' });

            expect(res.status).toBe(404);
        });

        it('should reject when organizer does not own the event', async () => {
            const otherOrganizer = await createOrganizer({
                email: 'other@felicity.com',
                organizerName: 'Other Club'
            });

            const res = await request(app)
                .post('/api/registrations/attendance/mark')
                .set('Authorization', `Bearer ${otherOrganizer.token}`)
                .send({ ticketId: registration.ticketId });

            expect(res.status).toBe(403);
        });

        it('should reject when ticketId is not provided', async () => {
            const res = await request(app)
                .post('/api/registrations/attendance/mark')
                .set('Authorization', `Bearer ${organizer.token}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should reject attendance marking by participant', async () => {
            const res = await request(app)
                .post('/api/registrations/attendance/mark')
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ ticketId: registration.ticketId });

            expect(res.status).toBe(403);
        });

        it('should set attended flag and timestamp in database', async () => {
            await request(app)
                .post('/api/registrations/attendance/mark')
                .set('Authorization', `Bearer ${organizer.token}`)
                .send({ ticketId: registration.ticketId });

            const updated = await Registration.findOne({ ticketId: registration.ticketId });
            expect(updated.attended).toBe(true);
            expect(updated.attendanceTimestamp).toBeDefined();
        });

        it('should return participant name and event name in response', async () => {
            const res = await request(app)
                .post('/api/registrations/attendance/mark')
                .set('Authorization', `Bearer ${organizer.token}`)
                .send({ ticketId: registration.ticketId });

            expect(res.body.participant.name).toBeDefined();
            expect(res.body.participant.email).toBeDefined();
            expect(res.body.participant.eventName).toBeDefined();
        });
    });
});
