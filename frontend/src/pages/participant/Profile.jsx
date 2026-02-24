import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  Snackbar,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon, VpnKey as PasswordIcon } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const CATEGORY_LIST = ['Cultural', 'Technical', 'Sports', 'Literary', 'Arts', 'Other'];

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    college: '',
    interests: []
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        contactNumber: user.contactNumber || '',
        college: user.college || '',
        interests: user.interests || []
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const toggleInterest = (interest) => {
    setFormData(prev => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests };
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put('/users/profile', formData);
      if (response.data.success) {
        updateUser(response.data.user);
        showSnackbar('Profile updated successfully!', 'success');
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showSnackbar('New passwords do not match', 'error');
    }

    try {
      setPasswordLoading(true);
      const response = await api.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (response.data.success) {
        showSnackbar('Password changed successfully!', 'success');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  if (!user) return null;

  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: '100vh', position: 'relative' }}>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Typography variant="h4" sx={{ fontFamily: '"DM Serif Display", serif', mb: 4, color: '#2C2C2C' }}>
        My Profile
      </Typography>

      <Grid container spacing={4}>
        {/* Profile Edit Section */}
        <Grid item xs={12} md={7}>
          <Paper className="window-box" sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Space Mono", monospace', mb: 2, fontWeight: 700 }}>
              PROFILE_DETAILS.EXE
            </Typography>

            <form onSubmit={handleSaveProfile}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} required fullWidth />
                <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} required fullWidth />
              </Box>

              <TextField label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required fullWidth sx={{ mb: 3 }} />
              <TextField label="College/Organization" name="college" value={formData.college} onChange={handleInputChange} required fullWidth sx={{ mb: 3 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: '"Karla", sans-serif', fontWeight: 700 }}>Selected Interests</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {CATEGORY_LIST.map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      onClick={() => toggleInterest(category)}
                      sx={{
                        backgroundColor: formData.interests.includes(category) ? '#E8C17C' : 'transparent',
                        borderColor: '#E8C17C',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        fontWeight: formData.interests.includes(category) ? 700 : 400
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                className="window-button window-button-gold"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* Read-Only & Security Section */}
        <Grid item xs={12} md={5}>
          <Paper className="window-box" sx={{ p: 4, mb: 4, backgroundColor: '#f9f9f9' }}>
            <Typography variant="h6" sx={{ fontFamily: '"Space Mono", monospace', mb: 2, fontWeight: 700 }}>
              ACCOUNT_INFO.EXE
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">Email Address</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{user.email}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Participant Type</Typography>
              <Chip label={user.participantType === 'iiit' ? 'IIIT Student' : 'Non-IIIT Participant'} size="small" color="primary" sx={{ mt: 0.5 }} />
            </Box>
          </Paper>

          <Paper className="window-box" sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Space Mono", monospace', mb: 2, fontWeight: 700 }}>
              SECURITY.EXE
            </Typography>
            <form onSubmit={handleSavePassword}>
              <TextField
                label="Current Password" type="password" name="currentPassword"
                value={passwordData.currentPassword} onChange={handlePasswordChange}
                required fullWidth size="small" sx={{ mb: 2 }}
              />
              <TextField
                label="New Password" type="password" name="newPassword"
                value={passwordData.newPassword} onChange={handlePasswordChange}
                required fullWidth size="small" sx={{ mb: 2 }}
              />
              <TextField
                label="Confirm New Password" type="password" name="confirmPassword"
                value={passwordData.confirmPassword} onChange={handlePasswordChange}
                required fullWidth size="small" sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                variant="outlined"
                startIcon={passwordLoading ? <CircularProgress size={20} /> : <PasswordIcon />}
                disabled={passwordLoading}
                fullWidth
                sx={{ borderColor: '#2C2C2C', color: '#2C2C2C' }}
              >
                {passwordLoading ? 'Updating...' : 'Change Password'}
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
