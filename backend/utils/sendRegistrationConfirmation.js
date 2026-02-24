const sendEmail = require('./sendEmail');

/**
 * Send registration confirmation email with ticket and QR code
 * @param {String} userEmail - Participant email
 * @param {Object} event - Event object
 * @param {Object} registration - Registration object with QR code
 * @returns {Object} Success/failure status
 */
const sendRegistrationConfirmation = async (userEmail, event, registration) => {
  try {
    const isMerch = event.type === 'merchandise';
    const actionNoun = isMerch ? 'Order' : 'Registration';
    const subject = `${actionNoun} Confirmed - ${event.name}`;

    // Plain text version
    const text = `
Dear Participant,

Your ${isMerch ? 'order' : 'registration'} for ${event.name} has been confirmed!

Event Details:
- Event: ${event.name}
- Date: ${new Date(event.eventStartDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })}
- Time: ${new Date(event.eventStartDate).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    })}

Your ${isMerch ? 'Order' : 'Ticket'} Details:
- ${isMerch ? 'Order' : 'Ticket'} ID: ${registration.ticketId}
- Total Price: ₹${event.registrationFee || 0}
${isMerch && registration.variant ? `- Variant: ${registration.variant.color} | Size: ${registration.variant.size}
- Quantity: ${registration.quantity || 1}` : ''}

Please save this email for your records. Show the QR code attached below ${isMerch ? 'to collect your merchandise' : 'at the event entrance'}.

See you at the event!

Best regards,
Felicity Event Management Team
`;

    // HTML version with styling
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .ticket-box { background: white; padding: 20px; margin: 20px 0; border: 2px dashed #667eea; border-radius: 8px; text-align: center; }
    .ticket-id { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
    .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #667eea; }
    .qr-section { text-align: center; margin: 20px 0; }
    .qr-code { max-width: 200px; margin: 20px auto; }
    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ${actionNoun} Confirmed!</h1>
      <p>Felicity Event Management</p>
    </div>
    
    <div class="content">
      <h2>Dear Participant,</h2>
      <p>Your ${isMerch ? 'order' : 'registration'} for <strong>${event.name}</strong> has been successfully confirmed!</p>
      
      <div class="ticket-box">
        <p style="margin: 0; color: #666;">Your ${isMerch ? 'Order' : 'Ticket'} ID</p>
        <div class="ticket-id">${registration.ticketId}</div>
      </div>
      
      <div class="event-details">
        <h3 style="color: #667eea; margin-top: 0;">Event Details</h3>
        <div class="detail-row">
          <span class="detail-label">Event Name:</span> ${event.name}
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span> ${new Date(event.eventStartDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })}
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span> ${new Date(event.eventStartDate).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    })}
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Price:</span> ₹${event.registrationFee || 0}
        </div>
        ${isMerch && registration.variant ? `
        <div class="detail-row">
          <span class="detail-label">Variant Name:</span> ${registration.variant.color}
        </div>
        <div class="detail-row">
          <span class="detail-label">Size:</span> ${registration.variant.size}
        </div>
        <div class="detail-row">
          <span class="detail-label">Quantity:</span> ${registration.quantity || 1}
        </div>
        ` : ''}
      </div>
      
      <div class="qr-section">
        <h3 style="color: #667eea;">Your ${isMerch ? 'Order QR' : 'Event Pass'}</h3>
        <p>Show this QR code ${isMerch ? 'to collect your merchandise' : 'at the event entrance'}:</p>
        <img src="cid:qrcode" alt="QR Code" class="qr-code" />
        <p style="color: #666; font-size: 12px;">Please save this email or download the QR code</p>
      </div>
      
      <p><strong>Important:</strong></p>
      <ul>
        <li>Keep this ticket safe - you'll need it for entry</li>
        <li>Arrive 15 minutes before the event start time</li>
        <li>Bring a valid ID for verification</li>
      </ul>
      
      <p>If you have any questions, please contact the organizers.</p>
      
      <p>See you at the event!</p>
    </div>
    
    <div class="footer">
      <p>© 2026 Felicity Event Management</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

    // Prepare QR code as inline attachment
    const attachments = [
      {
        filename: 'qrcode.png',
        content: registration.qrCode.split('base64,')[1],
        encoding: 'base64',
        cid: 'qrcode' // Content ID for embedding in HTML
      }
    ];

    // Send email
    const result = await sendEmail(userEmail, subject, text, html, attachments);
    return result;

  } catch (error) {
    console.error('Error sending registration confirmation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = sendRegistrationConfirmation;
