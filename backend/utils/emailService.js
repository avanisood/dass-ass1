const nodemailer = require('nodemailer');

// Email service utility for sending emails
// Will be used for:
// - Sending registration confirmation with ticket
// - Sending organizer credentials
// - Sending password reset notifications

// Create transporter (will be configured with environment variables)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Function to send registration confirmation email
const sendRegistrationEmail = async (to, eventName, ticketId, qrCode) => {
  // Implementation will be added later
};

// Function to send organizer credentials
const sendOrganizerCredentials = async (to, email, password) => {
  // Implementation will be added later
};

module.exports = {
  sendRegistrationEmail,
  sendOrganizerCredentials
};
