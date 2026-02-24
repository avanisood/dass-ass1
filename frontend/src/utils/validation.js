// Validation utility functions

// Validate IIIT email domain
export const isIIITEmail = (email) => {
  return email.endsWith('@iiit.ac.in') || /@[a-z]+\.iiit\.ac\.in$/.test(email);
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength (minimum 8 characters)
export const isValidPassword = (password) => {
  return password.length >= 8;
};

// Validate phone number (basic)
export const isValidPhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};
