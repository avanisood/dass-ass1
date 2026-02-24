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
    // Create transporter with Gmail SMTP configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Gmail address from .env
        pass: process.env.EMAIL_PASS  // Gmail app password from .env
      }
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

    console.log('Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = sendEmail;
