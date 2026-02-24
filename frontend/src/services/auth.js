import api from './api';

// Authentication service functions

// Register new participant
export const register = async (userData) => {
  // Implementation: POST /api/auth/register
  // return api.post('/auth/register', userData);
};

// Login user
export const login = async (email, password) => {
  // Implementation: POST /api/auth/login
  // return api.post('/auth/login', { email, password });
};

// Logout user
export const logout = async () => {
  // Implementation: POST /api/auth/logout
  // return api.post('/auth/logout');
};

// Get current user
export const getCurrentUser = async () => {
  // Implementation: GET /api/auth/me
  // return api.get('/auth/me');
};
