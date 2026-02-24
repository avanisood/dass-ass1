import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

/**
 * Attendance Dashboard Component
 * Shows attendance statistics and participant lists for an event
 */
const AttendanceDashboard = () => {
  const { eventId } = useParams();

  // State for event and attendance data
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for search
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch attendance data on mount
  useEffect(() => {
    fetchAttendanceData();
  }, [eventId]);

  // Fetch event and registration data
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Fetch event details
      const eventResponse = await api.get(`/events/${eventId}`);
      setEvent(eventResponse.data.event);

      // Fetch registrations for this event
      const registrationsResponse = await api.get(`/events/${eventId}/registrations`);
      setRegistrations(registrationsResponse.data.registrations || []);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format timestamp
  const formatTimestamp = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const totalRegistrations = registrations.length;
  const attendedCount = registrations.filter(r => r.attended).length;
  const notAttendedCount = totalRegistrations - attendedCount;
  const attendancePercentage = totalRegistrations > 0 
    ? ((attendedCount / totalRegistrations) * 100).toFixed(1) 
    : 0;

  // Filter registrations based on search
  const filterRegistrations = (list) => {
    if (!searchQuery) return list;
    
    const query = searchQuery.toLowerCase();
    return list.filter(reg => {
      const name = `${reg.participantId?.firstName || ''} ${reg.participantId?.lastName || ''}`.toLowerCase();
      const email = (reg.participantId?.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  };

  // Separate attended and not attended
  const attendedList = filterRegistrations(registrations.filter(r => r.attended));
  const notAttendedList = filterRegistrations(registrations.filter(r => !r.attended));

  // Export attendance to CSV
  const handleExportCSV = () => {
    // Create CSV header
    const headers = ['Name', 'Email', 'Registration Date', 'Attended', 'Attendance Time'];
    
    // Create CSV rows
    const rows = registrations.map(reg => [
      `${reg.participantId?.firstName || ''} ${reg.participantId?.lastName || ''}`,
      reg.participantId?.email || '',
      formatDate(reg.registrationDate),
      reg.attended ? 'Yes' : 'No',
      reg.attended ? formatTimestamp(reg.attendanceTimestamp) : 'N/A'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-${event?.name || 'event'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading attendance data...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Attendance Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {event?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Event Date: {formatDate(event?.eventStartDate)}
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAttendanceData}
        >
          Refresh
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          disabled={totalRegistrations === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Registrations
              </Typography>
              <Typography variant="h4">
                {totalRegistrations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Attended
              </Typography>
              <Typography variant="h4" color="success.main">
                {attendedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Not Attended
              </Typography>
              <Typography variant="h4" color="error.main">
                {notAttendedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Attendance Rate
              </Typography>
              <Typography variant="h4" color="primary.main">
                {attendancePercentage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <TextField
        fullWidth
        label="Search participants"
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* Participants Lists */}
      <Grid container spacing={3}>
        {/* Attended List */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Attended ({attendedList.length})
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {attendedList.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No attended participants found
              </Typography>
            ) : (
              <List>
                {attendedList.map((registration) => (
                  <ListItem key={registration._id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {registration.participantId?.firstName} {registration.participantId?.lastName}
                          </Typography>
                          <Chip label="Attended" color="success" size="small" />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {registration.participantId?.email}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span" color="text.secondary">
                            Marked at: {formatTimestamp(registration.attendanceTimestamp)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Not Attended List */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CancelIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Not Attended ({notAttendedList.length})
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {notAttendedList.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                All registered participants have attended!
              </Typography>
            ) : (
              <List>
                {notAttendedList.map((registration) => (
                  <ListItem key={registration._id} divider>
                    <ListItemText
                      primary={
                        <Typography variant="body1">
                          {registration.participantId?.firstName} {registration.participantId?.lastName}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {registration.participantId?.email}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span" color="text.secondary">
                            Registered: {formatDate(registration.registrationDate)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AttendanceDashboard;
