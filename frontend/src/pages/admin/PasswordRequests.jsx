import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Dialog, Snackbar,
  IconButton,
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Lock as LockIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const PasswordRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/password-reset/requests');
      setRequests(response.data.requests || []);
    } catch (err) {
      setError('Failed to load password reset requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await api.post(`/password-reset/approve/${requestId}`);
      setCredentials(response.data.newCredentials);
      fetchRequests();
      showSnackbar('Request approved — new credentials generated', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to approve request', 'error');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.post(`/password-reset/reject/${requestId}`);
      fetchRequests();
      showSnackbar('Request rejected', 'info');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to reject request', 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showSnackbar('Copied!', 'success'));
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, position: 'relative' }}>
      <div className="sparkle" style={{ position: 'absolute', top: '20px', right: '100px', fontSize: '1.5rem' }}>🔑</div>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'DM Serif Display, serif', fontWeight: 400, color: '#2C2C2C' }}>
          Password Reset Requests
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'Space Mono, monospace', color: '#6B7280' }}>
          {requests.length} pending
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <div className="window-box">
        <div className="window-header">
          <Typography sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.9rem' }}>
            PENDING_REQUESTS.EXE
          </Typography>
        </div>
        <div className="window-body" style={{ padding: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress />
            </Box>
          ) : requests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <LockIcon sx={{ fontSize: 60, color: '#B8D8D8', mb: 2 }} />
              <Typography sx={{ fontFamily: 'Karla, sans-serif', color: '#6B7280' }}>
                No pending password reset requests
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#B8D8D8' }}>
                    {['Organizer Name', 'Login Email', 'Request Date', 'Status', 'Actions'].map(header => (
                      <TableCell
                        key={header}
                        sx={{
                          fontFamily: 'Space Mono, monospace',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          color: '#2C2C2C',
                          borderBottom: '3px solid #2C2C2C',
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req._id} hover>
                      <TableCell sx={{ fontFamily: 'Karla, sans-serif', fontWeight: 600, color: '#2C2C2C' }}>
                        {req.organizerId?.organizerName || '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: '#3D3D3D' }}>
                        {req.organizerId?.email || '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D', fontSize: '0.85rem' }}>
                        {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={req.status.toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: '#E8C17C',
                            color: '#2C2C2C',
                            fontFamily: 'Space Mono, monospace',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<ApproveIcon />}
                            className="window-button window-button-gold"
                            onClick={() => handleApprove(req._id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            startIcon={<RejectIcon />}
                            className="window-button"
                            sx={{ color: '#F44336', borderColor: '#F44336' }}
                            onClick={() => handleReject(req._id)}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </div>

      {/* Credentials Dialog (shown after approve) */}
      <Dialog
        open={!!credentials}
        onClose={() => setCredentials(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'window-box' }}
      >
        <div className="window-header" style={{ position: 'relative' }}>
          <Typography sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.9rem' }}>
            NEW_CREDENTIALS.EXE
          </Typography>
          <IconButton
            onClick={() => setCredentials(null)}
            size="small"
            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
          >
            <RejectIcon fontSize="small" />
          </IconButton>
        </div>
        <div className="window-body" style={{ padding: '2rem' }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {credentials?.note || 'Share these credentials with the organizer. They will not be shown again.'}
          </Alert>
          {credentials && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#F9FAFB', borderRadius: 1, border: '1px solid #E5E7EB' }}>
                <Box>
                  <Typography variant="caption" sx={{ fontFamily: 'Space Mono, monospace', color: '#6B7280', display: 'block' }}>
                    EMAIL
                  </Typography>
                  <Typography sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 600, color: '#2C2C2C' }}>
                    {credentials.email}
                  </Typography>
                </Box>
                <IconButton onClick={() => copyToClipboard(credentials.email)} size="small">
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#FFF9E6', borderRadius: 1, border: '1px solid #E8C17C' }}>
                <Box>
                  <Typography variant="caption" sx={{ fontFamily: 'Space Mono, monospace', color: '#6B7280', display: 'block' }}>
                    NEW PASSWORD
                  </Typography>
                  <Typography sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, color: '#2C2C2C', fontSize: '1.1rem' }}>
                    {credentials.password}
                  </Typography>
                </Box>
                <IconButton onClick={() => copyToClipboard(credentials.password)} size="small">
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}
          <Button
            className="window-button window-button-gold"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setCredentials(null)}
          >
            Done
          </Button>
        </div>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <div className="wave-decoration" style={{ marginTop: '2rem' }} />
    </Container>
  );
};

export default PasswordRequests;
