import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip,
  Divider
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * Organizer Profile Page
 * Allows organizers to view their profile and request password reset
 */
const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);

  // State for profile data
  const [profileData, setProfileData] = useState({
    organizerName: '',
    category: '',
    description: '',
    contactEmail: '',
    discordWebhook: ''
  });

  // State for password reset request
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [pendingRequest, setPendingRequest] = useState(null);

  // State for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // State for loading
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setProfileData({
        organizerName: user.organizerName || '',
        category: user.category || '',
        description: user.description || '',
        contactEmail: user.contactEmail || '',
        discordWebhook: user.discordWebhook || ''
      });
    }
    
    // Fetch any pending password reset request
    fetchPendingRequest();
  }, [user]);

  // Fetch pending password reset request
  const fetchPendingRequest = async () => {
    try {
      const response = await api.get('/password-reset/my-request');
      if (response.data.request) {
        setPendingRequest(response.data.request);
      }
    } catch (error) {
      // No pending request or error - ignore
      console.log('No pending request');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const response = await api.put('/auth/profile', profileData);
      
      // Update user in context
      updateUser(response.data.user);
      
      showSnackbar('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to update profile',
        'error'
      );
    } finally {
      setUpdating(false);
    }
  };

  // Handle password reset request submission
  const handlePasswordResetRequest = async () => {
    // Validate reason
    if (!resetReason.trim()) {
      showSnackbar('Please provide a reason for password reset', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.post('/password-reset/request', { reason: resetReason });
      
      showSnackbar('Password reset request submitted successfully!', 'success');
      
      // Close dialog and reset form
      setOpenResetDialog(false);
      setResetReason('');
      
      // Refresh pending request status
      fetchPendingRequest();
    } catch (error) {
      console.error('Error submitting password reset request:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to submit request',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Organizer Profile
      </Typography>

      {/* Profile Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Non-editable Login Email */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Login Email"
              value={user?.email || ''}
              disabled
              helperText="Login email cannot be changed"
            />
          </Grid>

          {/* Editable Fields */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Organizer Name"
              name="organizerName"
              value={profileData.organizerName}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={profileData.category}
              onChange={handleInputChange}
              placeholder="e.g., Cultural, Technical, Sports"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={profileData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              placeholder="Brief description about your organization"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Contact Email"
              name="contactEmail"
              type="email"
              value={profileData.contactEmail}
              onChange={handleInputChange}
              placeholder="contact@example.com"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Discord Webhook URL"
              name="discordWebhook"
              value={profileData.discordWebhook}
              onChange={handleInputChange}
              placeholder="https://discord.com/api/webhooks/..."
              helperText="Optional: Receive notifications in Discord"
            />
          </Grid>

          {/* Update Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateProfile}
              disabled={updating}
              fullWidth
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Password Reset Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Password Management
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {/* Show pending request status if exists */}
        {pendingRequest && (
          <Alert 
            severity={
              pendingRequest.status === 'approved' ? 'success' : 
              pendingRequest.status === 'rejected' ? 'error' : 'info'
            }
            sx={{ mb: 2 }}
          >
            <Typography variant="body1" gutterBottom>
              <strong>Password Reset Request Status:</strong>{' '}
              <Chip 
                label={pendingRequest.status.toUpperCase()} 
                color={getStatusColor(pendingRequest.status)}
                size="small"
              />
            </Typography>
            <Typography variant="body2">
              <strong>Reason:</strong> {pendingRequest.reason}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requested on: {new Date(pendingRequest.createdAt).toLocaleDateString()}
            </Typography>
            {pendingRequest.status === 'rejected' && pendingRequest.rejectionReason && (
              <Typography variant="body2" color="error">
                <strong>Rejection Reason:</strong> {pendingRequest.rejectionReason}
              </Typography>
            )}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" gutterBottom>
          If you've forgotten your password or need to change it for security reasons,
          you can request a password reset from the admin.
        </Typography>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<LockIcon />}
          onClick={() => setOpenResetDialog(true)}
          disabled={pendingRequest?.status === 'pending'}
          sx={{ mt: 2 }}
        >
          {pendingRequest?.status === 'pending' 
            ? 'Request Pending' 
            : 'Request Password Reset'}
        </Button>
      </Paper>

      {/* Password Reset Request Dialog */}
      <Dialog
        open={openResetDialog}
        onClose={() => setOpenResetDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Password Reset</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
            Please provide a reason for your password reset request. 
            An admin will review and approve your request.
          </Typography>
          <TextField
            fullWidth
            label="Reason"
            name="reason"
            value={resetReason}
            onChange={(e) => setResetReason(e.target.value)}
            multiline
            rows={4}
            required
            placeholder="e.g., Forgot password, Security concern, etc."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordResetRequest}
            variant="contained"
            color="primary"
            disabled={loading || !resetReason.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
