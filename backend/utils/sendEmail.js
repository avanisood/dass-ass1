const nodemailer = require('nodemailer');

/**
 * Send email using nodemailer
 * @param {String} to - Recipient email address
 * @param {String} subject - Email subject
 * @param {String} text - Plain text content
 * @param {String} html - HTML content
 * @param {Array} attachments - Array of attachment objects
 * @returns {Object} Success/failure status
 */
const sendEmail = async (to, subject, text, html, attachments = []) => {
  try {
    // Log email attempt (helpful for debugging on production)
    console.log(`[EMAIL] Attempting to send email to: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] EMAIL_USER configured: ${!!process.env.EMAIL_USER}`);
    console.log(`[EMAIL] EMAIL_PASS configured: ${!!process.env.EMAIL_PASS}`);

    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER or EMAIL_PASS not configured in environment variables');
    }

    // Create transporter with Gmail SMTP configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use TLS (port 465)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: false,           // Don't pool connections — create a fresh conn each time
      connectionTimeout: 10000, // 10 seconds (fail fast if SMTP unreachable)
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 15000,     // 15 seconds
    });

    // Email options
    const mailOptions = {
      from: `"Felicity Event Management" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
      attachments: attachments
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('[EMAIL] ✓ Email sent successfully!');
    console.log('[EMAIL] Message ID:', info.messageId);
    console.log('[EMAIL] Recipient:', to);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('[EMAIL] ✗ Email sending error:', error.message);
    console.error('[EMAIL] Error code:', error.code);
    console.error('[EMAIL] To:', to);
    console.error('[EMAIL] Subject:', subject);

    // Provide helpful error messages
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('[EMAIL] HINT: Authentication failed - Check if using App Password (not regular password)');
    } else if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('[EMAIL] HINT: EMAIL_USER or EMAIL_PASS not set in environment variables');
    }

    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

module.exports = sendEmail;
