import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
} from '@mui/material';

// Login Page Component
const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);

  // If already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'organizer') {
        navigate('/organizer/dashboard', { replace: true });
      } else if (user.role === 'participant') {
        navigate('/participant/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // Form data state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call login function from AuthContext
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Login successful - redirect based on user role
        const user = result.user;

        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'organizer') {
          navigate('/organizer/dashboard');
        } else if (user.role === 'participant') {
          navigate('/participant/dashboard');
        } else {
          navigate('/');
        }
      } else {
        // Login failed - display error message
        setError(result.error || 'Login failed. Please try again.');
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
            LOGIN.EXE
          </Typography>
          <div className="window-controls"></div>
        </div>

        {/* Window Body */}
        <div className="window-body" style={{ padding: '2rem', position: 'relative' }}>
          {/* Sparkle decorations */}
          <span className="sparkle" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>✦</span>
          <span className="sparkle" style={{ position: 'absolute', bottom: '2rem', left: '1rem' }}>✦</span>
          <span className="sparkle" style={{ position: 'absolute', top: '50%', right: '2rem' }}>✦</span>

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
            Welcome Back
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
            Enter your credentials
          </Typography>

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

          {/* Login form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Email field */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />

            {/* Password field */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />

            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              className="window-button window-button-gold"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            {/* Link to register page */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#2C2C2C' }}>
                Don't have an account?{' '}
                <MuiLink
                  component={Link}
                  to="/register"
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
                  Register here
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </div>
      </Box>
    </Box>
  );
};

export default Login;
