import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Snackbar,
  Box,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import api from '../../services/api';

/**
 * Admin Manage Organizers Page
 * Allows admin to create and manage organizer accounts
 */
const ManageOrganizers = () => {
  // State for organizers list
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for add organizer modal
  const [openAddModal, setOpenAddModal] = useState(false);
  const [formData, setFormData] = useState({
    organizerName: '',
    category: '',
    description: '',
    contactEmail: ''
  });

  // State for generated credentials
  const [credentials, setCredentials] = useState(null);
  const [openCredentialsDialog, setOpenCredentialsDialog] = useState(false);

  // State for delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // State for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch all organizers on mount
  useEffect(() => {
    fetchOrganizers();
  }, []);

  // Fetch organizers from API
  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizers');
      setOrganizers(response.data.organizers || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
      showSnackbar('Failed to load organizers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle add organizer form submit
  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.organizerName || !formData.category || !formData.contactEmail) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    try {
      // Call API to create organizer
      const response = await api.post('/organizers', formData);
      
      // Store generated credentials
      setCredentials({
        email: response.data.organizer.email,
        password: response.data.password,
        organizerName: response.data.organizer.organizerName
      });

      // Show credentials dialog
      setOpenCredentialsDialog(true);

      // Close add modal
      setOpenAddModal(false);

      // Reset form
      setFormData({
        organizerName: '',
        category: '',
        description: '',
        contactEmail: ''
      });

      // Refresh organizers list
      fetchOrganizers();

      showSnackbar('Organizer created successfully!', 'success');
    } catch (error) {
      console.error('Error creating organizer:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to create organizer',
        'error'
      );
    }
  };

  // Handle delete organizer
  const handleDelete = async (organizerId) => {
    try {
      await api.delete(`/organizers/${organizerId}`);
      showSnackbar('Organizer removed successfully', 'success');
      setDeleteConfirm(null);
      fetchOrganizers(); // Refresh list
    } catch (error) {
      console.error('Error deleting organizer:', error);
      showSnackbar('Failed to remove organizer', 'error');
    }
  };

  // Copy credentials to clipboard
  const handleCopyCredentials = () => {
    const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
    showSnackbar('Credentials copied to clipboard!', 'success');
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Organizers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddModal(true)}
        >
          Add New Organizer
        </Button>
      </Box>

      {/* Organizers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Contact Email</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  Loading organizers...
                </TableCell>
              </TableRow>
            ) : organizers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No organizers found. Add your first organizer!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              organizers.map((organizer) => (
                <TableRow key={organizer._id} hover>
                  <TableCell>{organizer.organizerName}</TableCell>
                  <TableCell>{organizer.category}</TableCell>
                  <TableCell>{organizer.contactEmail}</TableCell>
                  <TableCell>
                    <Chip 
                      label="Active" 
                      color="success" 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove Organizer">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => setDeleteConfirm(organizer)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Organizer Modal */}
      <Dialog 
        open={openAddModal} 
        onClose={() => setOpenAddModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Organizer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Organizer Name"
              name="organizerName"
              value={formData.organizerName}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="e.g., Music Club"
            />
            <TextField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="e.g., Cultural, Technical, Sports"
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              fullWidth
              placeholder="Brief description of the organizer"
            />
            <TextField
              label="Contact Email"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="contact@example.com"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddModal(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Create Organizer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Credentials Display Dialog */}
      <Dialog 
        open={openCredentialsDialog} 
        onClose={() => setOpenCredentialsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Organizer Credentials Generated</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Organizer account created successfully!
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please save these credentials and share them with the organizer. 
            They will not be shown again.
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body1" gutterBottom>
              <strong>Organizer Name:</strong> {credentials?.organizerName}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Login Email:</strong> {credentials?.email}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Password:</strong> {credentials?.password}
            </Typography>
          </Paper>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyCredentials}
            sx={{ mt: 2 }}
          >
            Copy Credentials
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCredentialsDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
      >
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove organizer "{deleteConfirm?.organizerName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button 
            onClick={() => handleDelete(deleteConfirm._id)} 
            color="error"
            variant="contained"
          >
            Remove
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

export default ManageOrganizers;
