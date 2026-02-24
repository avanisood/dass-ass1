import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Box, Typography, Grid, Button, Chip, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Snackbar, Dialog,
  IconButton, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Event as EventIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  QrCode as QrIcon,
  Download as DownloadIcon,
  Groups as TeamsIcon,
  HowToReg as AttendedIcon,
} from '@mui/icons-material';
import DiscussionForum from '../../components/event/DiscussionForum';
import FormBuilder from '../../components/organizer/FormBuilder';

const OrganizerEventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterAttendance, setFilterAttendance] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchEvent();
    fetchRegistrations();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      const evt = response.data.event;
      setEvent(evt);
      setEditData({
        name: evt.name,
        description: evt.description,
        eligibility: evt.eligibility,
        registrationLimit: evt.registrationLimit,
        registrationFee: evt.registrationFee,
        customForm: evt.customForm || [],
      });
    } catch (err) {
      setError('Failed to load event details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoadingRegs(true);
      const response = await api.get(`/events/${id}/registrations`);
      setRegistrations(response.data.registrations || []);
    } catch (err) {
      console.error('Failed to load registrations:', err);
      setRegistrations([]);
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/events/${id}/status`, { status: newStatus });
      showSnackbar(`Event status updated to "${newStatus}"`, 'success');
      fetchEvent();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Strip temporary 'id' from custom form fields
      const processedCustomForm = editData.customForm
        ? editData.customForm.map(({ id, ...rest }) => rest)
        : [];

      const payload = {
        ...editData,
        customForm: processedCustomForm
      };

      await api.put(`/events/${id}`, payload);
      showSnackbar('Event updated successfully', 'success');
      setEditMode(false);
      fetchEvent();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to update event', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    const map = { draft: '#9E9E9E', published: '#6B9BC3', ongoing: '#E8C17C', completed: '#4CAF50', closed: '#F44336' };
    return map[status] || '#9E9E9E';
  };

  // Compute analytics from registrations
  const attendedCount = registrations.filter(r => r.attended).length;
  const attendanceRate = registrations.length > 0 ? Math.round((attendedCount / registrations.length) * 100) : 0;

  // Filtered registrations
  const filteredRegistrations = registrations.filter(reg => {
    const q = search.toLowerCase();
    const name = `${reg.participantId?.firstName || ''} ${reg.participantId?.lastName || ''}`.toLowerCase();
    const email = (reg.participantId?.email || '').toLowerCase();
    const matchesSearch = name.includes(q) || email.includes(q) || (reg.ticketId || '').toLowerCase().includes(q);

    const matchesAttendance = filterAttendance === 'all' ||
      (filterAttendance === 'attended' && reg.attended) ||
      (filterAttendance === 'not_attended' && !reg.attended);

    const matchesPayment = filterPayment === 'all' ||
      (reg.paymentStatus || 'paid') === filterPayment;

    return matchesSearch && matchesAttendance && matchesPayment;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'College', 'Ticket ID', 'Reg Date', 'Payment Status', 'Attended'];
    const rows = filteredRegistrations.map(reg => [
      `${reg.participantId?.firstName || ''} ${reg.participantId?.lastName || ''}`.trim(),
      reg.participantId?.email || '',
      reg.participantId?.college || '',
      reg.ticketId || '',
      reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString() : '',
      reg.paymentStatus || 'paid',
      reg.attended ? 'Yes' : 'No',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event?.name || 'event'}_registrations.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showSnackbar(`Exported ${filteredRegistrations.length} registrations to CSV`, 'success');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error || 'Event not found'}</Alert>
        <Button onClick={() => navigate('/organizer/dashboard')} startIcon={<BackIcon />} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', padding: 4, position: 'relative' }}>
      {/* Back button */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/organizer/dashboard')}
        className="window-button"
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      {/* Header */}
      <div className="window-box" style={{ marginBottom: '2rem' }}>
        <div className="window-header">
          <Typography sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.9rem' }}>
            EVENT_DETAIL.EXE
          </Typography>
        </div>
        <div className="window-body" style={{ padding: '2rem' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontFamily: 'DM Serif Display, serif', color: '#2C2C2C', mb: 1 }}>
                {event.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={event.status?.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(event.status),
                    color: 'white',
                    fontFamily: 'Space Mono, monospace',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
                <Chip
                  label={event.type === 'normal' ? '📄 Normal Event' : '🛍️ Merchandise'}
                  size="small"
                  sx={{ fontFamily: 'Karla, sans-serif', fontSize: '0.75rem' }}
                />
              </Box>
              <Typography variant="body2" sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D' }}>
                {event.eligibility}
              </Typography>
            </Box>
            {/* Status Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {event.status === 'draft' && (
                <Button
                  className="window-button window-button-gold"
                  onClick={() => handleStatusChange('published')}
                >
                  Publish Event
                </Button>
              )}
              {event.status === 'published' && (
                <>
                  <Button className="window-button" onClick={() => handleStatusChange('ongoing')}>
                    Mark Ongoing
                  </Button>
                  <Button
                    sx={{ color: '#F44336', borderColor: '#F44336' }}
                    className="window-button"
                    onClick={() => handleStatusChange('closed')}
                  >
                    Close Event
                  </Button>
                </>
              )}
              {event.status === 'ongoing' && (
                <Button
                  className="window-button window-button-gold"
                  onClick={() => handleStatusChange('completed')}
                >
                  Mark Completed
                </Button>
              )}
              {event.status === 'draft' && (
                <Button
                  className="window-button"
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                >
                  Edit Event
                </Button>
              )}
            </Box>
          </Box>
        </div>
      </div>

      {/* Overview Info */}
      <div className="window-box" style={{ marginBottom: '2rem' }}>
        <div className="window-header">
          <Typography sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.85rem' }}>
            OVERVIEW.EXE
          </Typography>
        </div>
        <div className="window-body" style={{ padding: '1.5rem' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ fontFamily: 'Space Mono, monospace', color: '#3D3D3D', display: 'block' }}>DESCRIPTION</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Karla, sans-serif', color: '#2C2C2C', whiteSpace: 'pre-wrap', mb: 2 }}>
                {event.description || 'No description'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" sx={{ fontFamily: 'Space Mono, monospace', color: '#3D3D3D', display: 'block' }}>START DATE</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Karla, sans-serif', fontWeight: 600, mb: 1 }}>{formatDate(event.eventStartDate)}</Typography>

              <Typography variant="caption" sx={{ fontFamily: 'Space Mono, monospace', color: '#3D3D3D', display: 'block' }}>END DATE</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Karla, sans-serif', fontWeight: 600, mb: 1 }}>{formatDate(event.eventEndDate)}</Typography>

              <Typography variant="caption" sx={{ fontFamily: 'Space Mono, monospace', color: '#3D3D3D', display: 'block' }}>REGISTRATION DEADLINE</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Karla, sans-serif', fontWeight: 600 }}>{formatDate(event.registrationDeadline)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" sx={{ fontFamily: 'Space Mono, monospace', color: '#3D3D3D', display: 'block' }}>PRICING</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Karla, sans-serif', fontWeight: 600, mb: 1 }}>
                {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
              </Typography>

              <Typography variant="caption" sx={{ fontFamily: 'Space Mono, monospace', color: '#3D3D3D', display: 'block' }}>CAPACITY</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Karla, sans-serif', fontWeight: 600, mb: 1 }}>{event.registrationLimit}</Typography>

              <Typography variant="caption" sx={{ fontFamily: 'Space Mono, monospace', color: '#3D3D3D', display: 'block' }}>VENUE</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Karla, sans-serif', fontWeight: 600 }}>{event.venue || 'TBA'}</Typography>
            </Grid>
          </Grid>
        </div>
      </div>

      {/* Analytics Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <div className="window-box">
            <div className="window-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <PeopleIcon sx={{ fontSize: 40, color: '#6B9BC3', mb: 1 }} />
              <Typography variant="h4" sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, color: '#E8C17C' }}>
                {event.registrationCount || 0} / {event.registrationLimit}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D', textTransform: 'uppercase' }}>
                Registrations
              </Typography>
            </div>
          </div>
        </Grid>
        <Grid item xs={6} sm={3}>
          <div className="window-box">
            <div className="window-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <AttendedIcon sx={{ fontSize: 40, color: '#6B9BC3', mb: 1 }} />
              <Typography variant="h4" sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, color: '#E8C17C' }}>
                {attendedCount} ({attendanceRate}%)
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D', textTransform: 'uppercase' }}>
                Attendance
              </Typography>
            </div>
          </div>
        </Grid>
        <Grid item xs={6} sm={3}>
          <div className="window-box">
            <div className="window-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <MoneyIcon sx={{ fontSize: 40, color: '#6B9BC3', mb: 1 }} />
              <Typography variant="h4" sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, color: '#E8C17C' }}>
                ₹{event.revenue || 0}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D', textTransform: 'uppercase' }}>
                Revenue
              </Typography>
            </div>
          </div>
        </Grid>
        <Grid item xs={6} sm={3}>
          <div className="window-box">
            <div className="window-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <EventIcon sx={{ fontSize: 40, color: '#6B9BC3', mb: 1 }} />
              <Typography variant="h4" sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, color: '#E8C17C' }}>
                {formatDate(event.eventStartDate)}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D', textTransform: 'uppercase' }}>
                Event Date
              </Typography>
            </div>
          </div>
        </Grid>
      </Grid>

      {/* Participants Table */}
      <div className="window-box">
        <div className="window-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.9rem' }}>
            PARTICIPANTS.EXE ({registrations.length})
          </Typography>
          {registrations.length > 0 && (
            <Button
              className="window-button"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              size="small"
              sx={{ fontSize: '0.7rem' }}
            >
              Export CSV
            </Button>
          )}
        </div>
        <div className="window-body">
          {/* Search + Filters */}
          <Box sx={{ p: 2, borderBottom: '2px solid #E5E7EB', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search by name, email, or ticket ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: '200px', '& .MuiOutlinedInput-root': { fontFamily: 'Karla, sans-serif' } }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontFamily: 'Karla, sans-serif' }}>Attendance</InputLabel>
              <Select
                value={filterAttendance}
                onChange={(e) => setFilterAttendance(e.target.value)}
                label="Attendance"
                sx={{ fontFamily: 'Karla, sans-serif' }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="attended">Attended</MenuItem>
                <MenuItem value="not_attended">Not Attended</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontFamily: 'Karla, sans-serif' }}>Payment</InputLabel>
              <Select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                label="Payment"
                sx={{ fontFamily: 'Karla, sans-serif' }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loadingRegs ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : filteredRegistrations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontFamily: 'Karla, sans-serif', color: '#6B7280' }}>
                {registrations.length === 0 ? 'No registrations yet' : 'No results match your filters'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#B8D8D8' }}>
                    {['Name', 'Email', 'Reg Date', 'Ticket ID', 'Payment', 'Attended'].map(header => (
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
                  {filteredRegistrations.map((reg) => (
                    <TableRow key={reg._id} hover>
                      <TableCell sx={{ fontFamily: 'Karla, sans-serif', color: '#2C2C2C' }}>
                        {reg.participantId?.firstName} {reg.participantId?.lastName}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Karla, sans-serif', color: '#2C2C2C', fontSize: '0.85rem' }}>
                        {reg.participantId?.email}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D', fontSize: '0.85rem' }}>
                        {formatDate(reg.registrationDate)}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color: '#2C2C2C' }}>
                        {reg.ticketId}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={(reg.paymentStatus || 'paid').toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: (reg.paymentStatus || 'paid') === 'paid' ? '#4CAF50' : '#E8C17C',
                            color: '#fff',
                            fontFamily: 'Space Mono, monospace',
                            fontWeight: 700,
                            fontSize: '0.6rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {reg.attended ? (
                          <Chip
                            label="Yes"
                            size="small"
                            sx={{ backgroundColor: '#4CAF50', color: '#fff', fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.65rem' }}
                          />
                        ) : (
                          <Chip
                            label="No"
                            size="small"
                            sx={{ backgroundColor: '#9E9E9E', color: '#fff', fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.65rem' }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </div>

      {/* Discussion Forum */}
      <DiscussionForum eventId={id} isOrganizer={true} />

      {/* Edit Event Dialog */}
      <Dialog
        open={editMode}
        onClose={() => setEditMode(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'window-box' }}
      >
        <div className="window-header" style={{ position: 'relative' }}>
          <Typography sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.9rem' }}>
            EDIT_EVENT.EXE
          </Typography>
          <IconButton
            onClick={() => setEditMode(false)}
            size="small"
            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        <div className="window-body" style={{ padding: '2rem' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Event Name"
              value={editData.name || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Karla, sans-serif' } }}
            />
            <TextField
              label="Description"
              value={editData.description || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              required
              sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Karla, sans-serif' } }}
            />
            <TextField
              label="Eligibility"
              value={editData.eligibility || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, eligibility: e.target.value }))}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Karla, sans-serif' } }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Registration Limit"
                  type="number"
                  value={editData.registrationLimit || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, registrationLimit: parseInt(e.target.value) }))}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Karla, sans-serif' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Registration Fee (₹)"
                  type="number"
                  value={editData.registrationFee || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, registrationFee: parseFloat(e.target.value) }))}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Karla, sans-serif' } }}
                />
              </Grid>
            </Grid>
            {event?.type === 'normal' && (
              <Box sx={{ mt: 2 }}>
                <FormBuilder
                  fields={editData.customForm || []}
                  onChange={(fields) => setEditData(prev => ({ ...prev, customForm: fields }))}
                  disabled={event.registrationCount > 0}
                />
                {event.registrationCount > 0 && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, fontFamily: 'Karla, sans-serif' }}>
                    Form fields are locked because attendees have already registered.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button className="window-button" onClick={() => setEditMode(false)} fullWidth>Cancel</Button>
            <Button className="window-button window-button-gold" onClick={handleSaveEdit} fullWidth>Save Changes</Button>
          </Box>
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
    </Box>
  );
};

export default OrganizerEventDetail;
