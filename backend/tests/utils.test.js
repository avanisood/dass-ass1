const { isIIITEmail, isValidEmail, generatePassword, generateTicketId } = require('../utils/validation');
const generateQRCode = require('../utils/generateQRCode');

describe('Validation Utilities', () => {

    describe('isIIITEmail', () => {
        it('should return true for @iiit.ac.in email', () => {
            expect(isIIITEmail('student@iiit.ac.in')).toBe(true);
        });

        it('should return false for non-IIIT email', () => {
            expect(isIIITEmail('user@gmail.com')).toBe(false);
        });

        it('should return false for similar but different domain', () => {
            expect(isIIITEmail('user@iiit.com')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isIIITEmail('')).toBe(false);
        });
    });

    describe('isValidEmail', () => {
        it('should return true for valid email', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
        });

        it('should return true for email with subdomain', () => {
            expect(isValidEmail('user@mail.iiit.ac.in')).toBe(true);
        });

        it('should return false for email without @', () => {
            expect(isValidEmail('notanemail')).toBe(false);
        });

        it('should return false for email without domain', () => {
            expect(isValidEmail('user@')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isValidEmail('')).toBe(false);
        });
    });

    describe('generatePassword', () => {
        it('should generate password of default length (12)', () => {
            const pwd = generatePassword();
            expect(pwd.length).toBe(12);
        });

        it('should generate password of custom length', () => {
            const pwd = generatePassword(20);
            expect(pwd.length).toBe(20);
        });

        it('should generate different passwords on each call', () => {
            const pwd1 = generatePassword();
            const pwd2 = generatePassword();
            expect(pwd1).not.toBe(pwd2);
        });
    });

    describe('generateTicketId', () => {
        it('should generate ticket ID with TICKET- prefix', () => {
            const id = generateTicketId();
            expect(id).toMatch(/^TICKET-/);
        });

        it('should generate uppercase ticket ID', () => {
            const id = generateTicketId();
            expect(id).toBe(id.toUpperCase());
        });

        it('should generate unique ticket IDs', () => {
            const ids = new Set();
            for (let i = 0; i < 100; i++) {
                ids.add(generateTicketId());
            }
            expect(ids.size).toBe(100);
        });
    });
});

describe('QR Code Generation', () => {
    it('should generate a base64 data URL', async () => {
        const qr = await generateQRCode('event123', 'participant456', 'TICKET-ABC-123');

        expect(qr).toBeDefined();
        expect(qr).toMatch(/^data:image\/png;base64,/);
    });

    it('should encode ticket, event, and participant IDs', async () => {
        const qr = await generateQRCode('evt1', 'part1', 'TKT1');

        // QR is base64 encoded image, but we can verify it's not empty
        expect(qr.length).toBeGreaterThan(100);
    });

    it('should generate different QR codes for different inputs', async () => {
        const qr1 = await generateQRCode('evt1', 'part1', 'TKT1');
        const qr2 = await generateQRCode('evt2', 'part2', 'TKT2');

        expect(qr1).not.toBe(qr2);
    });
});
