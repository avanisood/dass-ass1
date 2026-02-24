const request = require('supertest');
const app = require('../server');
const { setupDB, createParticipant, createOrganizer, createTestEvent } = require('./setup');
const Team = require('../models/Team');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

setupDB();

describe('Teams API', () => {

    // ─── CREATE TEAM ──────────────────────────────────────────────────────

    describe('POST /api/events/:id/teams', () => {
        it('should create a team for an event', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'published' });
            const { token } = await createParticipant();

            const res = await request(app)
                .post(`/api/events/${event._id}/teams`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Team Alpha', targetSize: 3 });

            expect(res.status).toBe(201);
            expect(res.body.team.name).toBe('Team Alpha');
            expect(res.body.team.targetSize).toBe(3);
            expect(res.body.team.inviteCode).toBeDefined();
            expect(res.body.team.members).toHaveLength(1);
            expect(res.body.team.status).toBe('forming');
        });

        it('should reject team creation with missing fields', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'published' });
            const { token } = await createParticipant();

            const res = await request(app)
                .post(`/api/events/${event._id}/teams`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Incomplete' });

            expect(res.status).toBe(400);
        });

        it('should reject team size less than 2', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'published' });
            const { token } = await createParticipant();

            const res = await request(app)
                .post(`/api/events/${event._id}/teams`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Solo', targetSize: 1 });

            expect(res.status).toBe(400);
        });

        it('should reject team size greater than 6', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'published' });
            const { token } = await createParticipant();

            const res = await request(app)
                .post(`/api/events/${event._id}/teams`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Big Team', targetSize: 10 });

            expect(res.status).toBe(400);
        });

        it('should reject if user is already in a team for this event', async () => {
            const { user } = await createOrganizer();
            const event = await createTestEvent(user._id, { status: 'published' });
            const { token } = await createParticipant();

            await request(app)
                .post(`/api/events/${event._id}/teams`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'First Team', targetSize: 2 });

            const res = await request(app)
                .post(`/api/events/${event._id}/teams`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Second Team', targetSize: 3 });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already in a team/i);
        });

        it('should return 404 for non-existent event', async () => {
            const { token } = await createParticipant();

            const res = await request(app)
                .post('/api/events/507f1f77bcf86cd799439011/teams')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Ghost Team', targetSize: 2 });

            expect(res.status).toBe(404);
        });
    });

    // ─── JOIN TEAM ────────────────────────────────────────────────────────

    describe('POST /api/events/:id/teams/join', () => {
        let event, team, leaderToken;

        beforeEach(async () => {
            const { user: org } = await createOrganizer();
            event = await createTestEvent(org._id, { status: 'published' });

            const leader = await createParticipant({ email: 'leader@iiit.ac.in' });
            leaderToken = leader.token;

            const teamRes = await request(app)
                .post(`/api/events/${event._id}/teams`)
                .set('Authorization', `Bearer ${leaderToken}`)
                .send({ name: 'Join Test Team', targetSize: 2 });

            team = teamRes.body.team;
        });

        it('should join a team with valid invite code', async () => {
            const member = await createParticipant({ email: 'member@iiit.ac.in' });

            const res = await request(app)
                .post(`/api/events/${event._id}/teams/join`)
                .set('Authorization', `Bearer ${member.token}`)
                .send({ inviteCode: team.inviteCode });

            expect(res.status).toBe(200);
            expect(res.body.team.members).toHaveLength(2);
        });

        it('should reject invalid invite code', async () => {
            const member = await createParticipant({ email: 'member@iiit.ac.in' });

            const res = await request(app)
                .post(`/api/events/${event._id}/teams/join`)
                .set('Authorization', `Bearer ${member.token}`)
                .send({ inviteCode: 'INVALID' });

            expect(res.status).toBe(404);
        });

        it('should reject if already a member of the team', async () => {
            const res = await request(app)
                .post(`/api/events/${event._id}/teams/join`)
                .set('Authorization', `Bearer ${leaderToken}`)
                .send({ inviteCode: team.inviteCode });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already/i);
        });

        it('should reject if already in another team for same event', async () => {
            const member = await createParticipant({ email: 'member@iiit.ac.in' });

            // Create another team
            await request(app)
                .post(`/api/events/${event._id}/teams`)
                .set('Authorization', `Bearer ${member.token}`)
                .send({ name: 'Other Team', targetSize: 3 });

            // Try to join first team
            const res = await request(app)
                .post(`/api/events/${event._id}/teams/join`)
                .set('Authorization', `Bearer ${member.token}`)
                .send({ inviteCode: team.inviteCode });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already in a team/i);
        });

        it('should auto-complete team and register all members when full', async () => {
            const member = await createParticipant({ email: 'member@iiit.ac.in' });

            const res = await request(app)
                .post(`/api/events/${event._id}/teams/join`)
                .set('Authorization', `Bearer ${member.token}`)
                .send({ inviteCode: team.inviteCode });

            expect(res.body.team.status).toBe('completed');

            // Verify registrations were created for all members
            const registrations = await Registration.find({ eventId: event._id });
            expect(registrations).toHaveLength(2);
        });

        it('should reject joining a completed team', async () => {
            // Fill the team
            const member1 = await createParticipant({ email: 'member1@iiit.ac.in' });
            await request(app)
                .post(`/api/events/${event._id}/teams/join`)
                .set('Authorization', `Bearer ${member1.token}`)
                .send({ inviteCode: team.inviteCode });

            // Try joining after completion
            const member2 = await createParticipant({ email: 'member2@iiit.ac.in' });
            const res = await request(app)
                .post(`/api/events/${event._id}/teams/join`)
                .set('Authorization', `Bearer ${member2.token}`)
                .send({ inviteCode: team.inviteCode });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/full|finalized/i);
        });

        it('should reject join without invite code', async () => {
            const member = await createParticipant({ email: 'member@iiit.ac.in' });

            const res = await request(app)
                .post(`/api/events/${event._id}/teams/join`)
                .set('Authorization', `Bearer ${member.token}`)
                .send({});

            expect(res.status).toBe(400);
        });
    });

    // ─── GET TEAM ─────────────────────────────────────────────────────────

    describe('GET /api/events/:id/team', () => {
        it('should return team info for a member', async () => {
            const { user: org } = await createOrganizer();
            const event = await createTestEvent(org._id, { status: 'published' });

            const participant = await createParticipant();

            await request(app)
                .post(`/api/events/${event._id}/teams`)
                .set('Authorization', `Bearer ${participant.token}`)
                .send({ name: 'View Team', targetSize: 3 });

            const res = await request(app)
                .get(`/api/events/${event._id}/team`)
                .set('Authorization', `Bearer ${participant.token}`);

            expect(res.status).toBe(200);
            expect(res.body.team).toBeDefined();
            expect(res.body.team.name).toBe('View Team');
        });

        it('should return null team for non-member', async () => {
            const { user: org } = await createOrganizer();
            const event = await createTestEvent(org._id, { status: 'published' });

            const participant = await createParticipant();

            const res = await request(app)
                .get(`/api/events/${event._id}/team`)
                .set('Authorization', `Bearer ${participant.token}`);

            expect(res.status).toBe(200);
            expect(res.body.team).toBeNull();
        });
    });
});
