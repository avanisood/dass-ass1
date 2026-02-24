import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
} from '@mui/material';

// Register Page Component
const Register = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    contactNumber: '',
  });

  // Loading, error, and validation states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear validation error for this field
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: '',
      });
    }
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.college.trim()) {
      errors.college = 'College name is required';
    }

    if (!formData.contactNumber.trim()) {
      errors.contactNumber = 'Contact number is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    if (!validateForm()) {
      setError('Please fix the errors below');
      return;
    }

    setLoading(true);

    try {
      // Call register function from AuthContext
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        college: formData.college,
        contactNumber: formData.contactNumber,
      });

      if (result.success) {
        // Registration successful - show success message
        setSuccess(true);

        // Redirect to onboarding after 2 seconds
        setTimeout(() => {
          navigate('/participant/onboarding');
        }, 2000);
      } else {
        // Registration failed - display error message
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      {/* Main Window */}
      <Box className="window-box" sx={{ maxWidth: 500, width: '100%', margin: 'auto', position: 'relative' }}>
        {/* Window Header */}
        <div className="window-header">
          <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
            REGISTER.EXE
          </Typography>
          <div className="window-controls"></div>
        </div>

        {/* Window Body */}
        <div className="window-body" style={{ padding: '2rem', position: 'relative' }}>
          {/* Sparkle decorations */}
          <span className="sparkle" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>✦</span>
          <span className="sparkle" style={{ position: 'absolute', bottom: '3rem', left: '1rem' }}>✦</span>
          <span className="sparkle" style={{ position: 'absolute', top: '40%', right: '1.5rem' }}>✦</span>

          {/* Title */}
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              fontFamily: '"DM Serif Display", serif',
              fontWeight: 400,
              color: '#2C2C2C',
              mb: 1
            }}
          >
            Create Account
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{
              mb: 3,
              fontFamily: '"Karla", sans-serif',
              color: '#3D3D3D'
            }}
          >
            Join the event platform
          </Typography>

          {/* Success message display */}
          {success && (
            <Box sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: '#e5f5e5',
              border: '2px solid #6BA368',
              borderRadius: '8px'
            }}>
              <Typography sx={{ fontFamily: '"Karla", sans-serif', fontSize: '0.875rem', color: '#6BA368' }}>
                Registration successful! Redirecting to login...
              </Typography>
            </Box>
          )}

          {/* Error message display */}
          {error && (
            <Box sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: '#ffe5e5',
              border: '2px solid #C65D4F',
              borderRadius: '8px'
            }}>
              <Typography color="error" sx={{ fontFamily: '"Karla", sans-serif', fontSize: '0.875rem' }}>
                {error}
              </Typography>
            </Box>
          )}

          {/* Registration form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Group 1: Personal Info */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', fontWeight: 600, mb: 1, display: 'block' }}>
                PERSONAL INFO
              </Typography>
              <TextField
                required
                fullWidth
                margin="normal"
                id="firstName"
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                autoFocus
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
                error={!!validationErrors.firstName}
                helperText={validationErrors.firstName}
              />
              <TextField
                required
                fullWidth
                margin="normal"
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
                error={!!validationErrors.lastName}
                helperText={validationErrors.lastName}
              />
            </Box>

            {/* Group 2: Contact */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', fontWeight: 600, mb: 1, display: 'block' }}>
                CONTACT
              </Typography>
              <TextField
                required
                fullWidth
                margin="normal"
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                error={!!validationErrors.email}
                helperText={
                  validationErrors.email ||
                  'Use @iiit.ac.in for IIIT students'
                }
              />
              <TextField
                required
                fullWidth
                margin="normal"
                id="contactNumber"
                label="Contact Number"
                name="contactNumber"
                autoComplete="tel"
                value={formData.contactNumber}
                onChange={handleChange}
                disabled={loading}
                error={!!validationErrors.contactNumber}
                helperText={validationErrors.contactNumber}
              />
              <TextField
                required
                fullWidth
                margin="normal"
                id="college"
                label="College/Organization"
                name="college"
                value={formData.college}
                onChange={handleChange}
                disabled={loading}
                error={!!validationErrors.college}
                helperText={validationErrors.college}
              />
            </Box>

            {/* Group 3: Security */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', fontWeight: 600, mb: 1, display: 'block' }}>
                SECURITY
              </Typography>
              <TextField
                required
                fullWidth
                margin="normal"
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                error={!!validationErrors.password}
                helperText={validationErrors.password || 'Minimum 6 characters'}
              />
              <TextField
                required
                fullWidth
                margin="normal"
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                error={!!validationErrors.confirmPassword}
                helperText={validationErrors.confirmPassword}
              />
            </Box>

            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              className="window-button window-button-gold"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || success}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            {/* Link to login page */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#2C2C2C' }}>
                Already have an account?{' '}
                <MuiLink
                  component={Link}
                  to="/login"
                  sx={{
                    color: '#E8C17C',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#D4A574'
                    }
                  }}
                >
                  Login here
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </div>
      </Box>
    </Box>
  );
};

export default Register;
