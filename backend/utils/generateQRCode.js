const QRCode = require('qrcode');

/**
 * Generate QR code for event ticket
 * @param {String} eventId - Event ID
 * @param {String} participantId - Participant ID
 * @param {String} ticketId - Ticket ID
 * @returns {String} Base64 encoded QR code image
 * 
 * QR Code Format: TICKET:{ticketId}|EVENT:{eventId}|PARTICIPANT:{participantId}
 * This format allows scanning devices to quickly identify:
 * - The ticket ID for verification
 * - The associated event
 * - The participant who owns the ticket
 */
const generateQRCode = async (eventId, participantId, ticketId) => {
  try {
    // Create data string in the specified format
    const qrData = `TICKET:${ticketId}|EVENT:${eventId}|PARTICIPANT:${participantId}`;

    // Generate QR code as base64 data URL
    // Options:
    // - errorCorrectionLevel: 'H' for high error correction (can still be read if 30% is damaged)
    // - type: 'image/png' for PNG format
    // - quality: 0.92 for good quality
    // - margin: 1 for minimal white border
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',  // Black dots
        light: '#FFFFFF'  // White background
      }
    });

    return qrCodeBase64;

  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

module.exports = generateQRCode;
