// Validation utility functions

// Validate IIIT email domain
const isIIITEmail = (email) => {
  return email.endsWith('@iiit.ac.in') || /@[a-z]+\.iiit\.ac\.in$/.test(email);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate random password for organizers
const generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Generate unique ticket ID
const generateTicketId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `TICKET-${timestamp}-${randomStr}`.toUpperCase();
};

module.exports = {
  isIIITEmail,
  isValidEmail,
  generatePassword,
  generateTicketId
};
