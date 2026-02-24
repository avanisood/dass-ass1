import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Event as EventIcon,
  Store as StoreIcon,
  ConfirmationNumber as TicketIcon,
  CalendarToday,
  CheckCircle,
  EmojiEvents,
  Cancel,
} from '@mui/icons-material';
import NotificationsPopup from '../../components/participant/NotificationsPopup';

// Participant Dashboard Component
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // State for tabs and registrations
  const [currentTab, setCurrentTab] = useState(0);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Fetch registrations on mount and when tab changes
  useEffect(() => {
    fetchRegistrations();
  }, [currentTab]);

  // Fetch user registrations
  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/registrations/my-registrations');

      // Handle different response formats
      if (Array.isArray(response.data)) {
        setRegistrations(response.data);
      } else if (response.data.registrations && Array.isArray(response.data.registrations)) {
        setRegistrations(response.data.registrations);
      } else {
        setRegistrations([]);
      }
    } catch (err) {
      setError('Failed to load registrations. Please try again.');
      console.error('Error fetching registrations:', err);
      setRegistrations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Filter registrations based on current tab
  const getFilteredRegistrations = () => {
    // Ensure registrations is always an array
    if (!Array.isArray(registrations)) {
      return [];
    }

    const now = new Date();

    switch (currentTab) {
      case 0: // Upcoming
        return registrations.filter((reg) => {
          const eventDate = new Date(reg.eventId?.eventStartDate);
          return (
            eventDate >= now &&
            reg.status === 'registered'
          );
        });

      case 1: // Normal
        return registrations.filter(
          (reg) => reg.eventId?.type === 'normal'
        );

      case 2: // Merchandise
        return registrations.filter(
          (reg) => reg.eventId?.type === 'merchandise'
        );

      case 3: // Completed
        return registrations.filter((reg) => {
          const isPast = reg.eventId?.eventEndDate && new Date(reg.eventId.eventEndDate) < now;
          return reg.status === 'completed' || reg.attended === true || isPast;
        });

      case 4: // Cancelled
        return registrations.filter(
          (reg) => reg.status === 'cancelled'
        );

      default:
        return registrations;
    }
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle View Ticket click
  const handleViewTicket = (registration) => {
    setSelectedTicket(registration);
  };

  // Close ticket modal
  const handleCloseTicket = () => {
    setSelectedTicket(null);
  };

  const filteredRegistrations = getFilteredRegistrations();

  // Calculate stats
  const upcomingCount = registrations.filter((reg) => {
    const eventDate = new Date(reg.eventId?.eventStartDate);
    return eventDate >= new Date() && reg.status === 'registered';
  }).length;

  const totalRegistrations = registrations.length;
  const attendedCount = registrations.filter((reg) => reg.attended === true).length;

  return (
    <Box sx={{ minHeight: '100vh', padding: 4, position: 'relative' }}>
      <NotificationsPopup />

      {/* Welcome Section */}
      <div className="window-box" style={{ marginBottom: '2rem', position: 'relative' }}>
        {/* Window Header */}
        <div className="window-header">
          <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
            MY_DASHBOARD.EXE
          </Typography>
          <div className="window-controls"></div>
        </div>

        {/* Window Body */}
        <div className="window-body" style={{ padding: '3rem', position: 'relative' }}>
          {/* Sparkle decorations */}
          <span className="sparkle" style={{ position: 'absolute', top: '1rem', right: '2rem' }}>✦</span>
          <span className="sparkle" style={{ position: 'absolute', bottom: '1.5rem', left: '2rem' }}>✦</span>
          <span className="sparkle" style={{ position: 'absolute', top: '50%', right: '4rem' }}>✦</span>

          <Typography
            variant="h4"
            sx={{
              fontFamily: '"DM Serif Display", serif',
              color: '#2C2C2C',
              marginBottom: '0.5rem'
            }}
          >
            Welcome back, {user?.firstName || 'Participant'}!
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: '"Karla", sans-serif',
              color: '#3D3D3D'
            }}
          >
            Your personal event library
          </Typography>
        </div>
      </div>

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ marginBottom: 4 }}>
        {/* Upcoming Events */}
        <Grid item xs={12} sm={6} md={3}>
          <Box className="window-box">
            <div className="window-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <CalendarToday sx={{ fontSize: 40, color: '#6B9BC3', marginBottom: 1 }} />
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontWeight: 700,
                  color: '#E8C17C',
                  marginBottom: '0.5rem'
                }}
              >
                {upcomingCount}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  color: '#3D3D3D',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem'
                }}
              >
                Upcoming Events
              </Typography>
            </div>
          </Box>
        </Grid>

        {/* Total Registrations */}
        <Grid item xs={12} sm={6} md={3}>
          <Box className="window-box">
            <div className="window-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <TicketIcon sx={{ fontSize: 40, color: '#6B9BC3', marginBottom: 1 }} />
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontWeight: 700,
                  color: '#E8C17C',
                  marginBottom: '0.5rem'
                }}
              >
                {totalRegistrations}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  color: '#3D3D3D',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem'
                }}
              >
                Total Registrations
              </Typography>
            </div>
          </Box>
        </Grid>

        {/* Events Attended */}
        <Grid item xs={12} sm={6} md={3}>
          <Box className="window-box">
            <div className="window-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <CheckCircle sx={{ fontSize: 40, color: '#6BA368', marginBottom: 1 }} />
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontWeight: 700,
                  color: '#E8C17C',
                  marginBottom: '0.5rem'
                }}
              >
                {attendedCount}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  color: '#3D3D3D',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem'
                }}
              >
                Events Attended
              </Typography>
            </div>
          </Box>
        </Grid>

        {/* Achievement Points */}
        <Grid item xs={12} sm={6} md={3}>
          <Box className="window-box">
            <div className="window-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <EmojiEvents sx={{ fontSize: 40, color: '#E8C17C', marginBottom: 1 }} />
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontWeight: 700,
                  color: '#E8C17C',
                  marginBottom: '0.5rem'
                }}
              >
                {attendedCount * 10}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  color: '#3D3D3D',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem'
                }}
              >
                Points Earned
              </Typography>
            </div>
          </Box>
        </Grid>
      </Grid>

      {/* Events Section */}
      <div className="window-box">
        {/* Window Header */}
        <div className="window-header">
          <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
            YOUR_EVENTS.EXE
          </Typography>
          <div className="window-controls"></div>
        </div>

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '2px solid #3D3D3D',
            backgroundColor: '#f5f5f5',
            '& .MuiTab-root': {
              fontFamily: '"Space Mono", monospace',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              color: '#3D3D3D',
              '&.Mui-selected': {
                color: '#2C2C2C',
                backgroundColor: '#E8C17C',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#E8C17C',
              height: 3,
            },
          }}
        >
          <Tab label="Upcoming" />
          <Tab label="Normal Events" />
          <Tab label="Merchandise" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>

        {/* Tab Panel */}
        <div className="window-body">
          {/* Error Display */}
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

          {/* Loading State */}
          {loading ? (
            <Box sx={{ textAlign: 'center', padding: '3rem' }}>
              <Typography sx={{ fontFamily: '"Karla", sans-serif', color: '#3D3D3D' }}>
                Loading your events...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Empty State */}
              {filteredRegistrations.length === 0 ? (
                <Box sx={{ textAlign: 'center', padding: '4rem' }}>
                  <Box sx={{ marginBottom: 2 }}>
                    {currentTab === 0 && <CalendarToday sx={{ fontSize: 60, color: '#B8D8D8' }} />}
                    {currentTab === 1 && <EventIcon sx={{ fontSize: 60, color: '#B8D8D8' }} />}
                    {currentTab === 2 && <StoreIcon sx={{ fontSize: 60, color: '#B8D8D8' }} />}
                    {currentTab === 3 && <CheckCircle sx={{ fontSize: 60, color: '#B8D8D8' }} />}
                    {currentTab === 4 && <Cancel sx={{ fontSize: 60, color: '#B8D8D8' }} />}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"DM Serif Display", serif',
                      color: '#2C2C2C',
                      marginBottom: '0.5rem'
                    }}
                  >
                    No events in this category
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: '"Karla", sans-serif',
                      color: '#3D3D3D'
                    }}
                  >
                    {currentTab === 0 && 'You have no upcoming events. Browse events to register!'}
                    {currentTab === 1 && 'You have no normal event registrations'}
                    {currentTab === 2 && 'You have no merchandise purchases'}
                    {currentTab === 3 && 'You have no completed events yet'}
                    {currentTab === 4 && 'You have no cancelled registrations'}
                  </Typography>
                </Box>
              ) : (
                /* Event List */
                <Grid container spacing={2} sx={{ padding: 2 }}>
                  {filteredRegistrations.map((registration) => (
                    <Grid item xs={12} sm={6} key={registration._id}>
                      <Box className="window-box">
                        {/* Event Header */}
                        <div className="window-header" style={{ fontSize: '0.75rem' }}>
                          <Typography
                            sx={{
                              fontFamily: '"Space Mono", monospace',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px'
                            }}
                          >
                            {registration.eventId?.name || 'Unknown Event'}
                          </Typography>
                          {registration.eventId?.type === 'normal' ? (
                            <EventIcon sx={{ fontSize: '1rem', color: '#3D3D3D' }} />
                          ) : (
                            <StoreIcon sx={{ fontSize: '1rem', color: '#3D3D3D' }} />
                          )}
                        </div>

                        {/* Event Body */}
                        <div className="window-body" style={{ padding: '1rem' }}>
                          {/* Date */}
                          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                            <CalendarToday sx={{ fontSize: '1rem', marginRight: 0.5, color: '#6B9BC3' }} />
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: '"Karla", sans-serif',
                                color: '#2C2C2C',
                                fontSize: '0.875rem'
                              }}
                            >
                              {formatDateTime(registration.eventId?.eventStartDate)}
                            </Typography>
                          </Box>

                          {/* Organizer */}
                          <Typography
                            variant="body2"
                            onClick={(e) => {
                              if (registration.eventId?.organizerId?._id) {
                                e.stopPropagation();
                                navigate(`/participant/organizers/${registration.eventId.organizerId._id}`);
                              }
                            }}
                            sx={{
                              fontFamily: '"Karla", sans-serif',
                              color: registration.eventId?.organizerId?._id ? '#6B9BC3' : '#3D3D3D',
                              display: 'block',
                              marginBottom: 1,
                              fontStyle: 'italic',
                              cursor: registration.eventId?.organizerId?._id ? 'pointer' : 'default',
                              '&:hover': {
                                textDecoration: registration.eventId?.organizerId?._id ? 'underline' : 'none'
                              }
                            }}
                          >
                            by {registration.eventId?.organizerId?.organizerName || 'Unknown'}
                          </Typography>

                          {/* Badges */}
                          <Box sx={{ display: 'flex', gap: 0.5, marginBottom: 1.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={registration.eventId?.type || 'event'}
                              size="small"
                              sx={{
                                backgroundColor: registration.eventId?.type === 'normal' ? '#6B9BC3' : '#E8C17C',
                                border: '2px solid #3D3D3D',
                                color: '#2C2C2C',
                                fontFamily: '"Space Mono", monospace',
                                fontSize: '0.65rem',
                                height: '20px',
                                fontWeight: 600,
                              }}
                            />
                            {registration.attended && (
                              <Chip
                                label="Attended"
                                size="small"
                                sx={{
                                  backgroundColor: '#6BA368',
                                  border: '2px solid #3D3D3D',
                                  color: '#FFFFFF',
                                  fontFamily: '"Space Mono", monospace',
                                  fontSize: '0.65rem',
                                  height: '20px',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </Box>

                          {/* Ticket ID */}
                          <Typography
                            variant="caption"
                            onClick={() => handleViewTicket(registration)}
                            sx={{
                              fontFamily: '"Space Mono", monospace',
                              color: '#6B9BC3',
                              display: 'block',
                              marginBottom: 1.5,
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              fontWeight: 'bold'
                            }}
                          >
                            🎫 {registration.ticketId}
                          </Typography>

                          {/* View Ticket Button */}
                          <Button
                            className="window-button"
                            size="small"
                            fullWidth
                            startIcon={<TicketIcon />}
                            onClick={() => handleViewTicket(registration)}
                            sx={{ fontSize: '0.7rem', padding: '6px 12px' }}
                          >
                            View Ticket
                          </Button>
                        </div>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      <Dialog
        open={!!selectedTicket}
        onClose={handleCloseTicket}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: '3px solid #2C2C2C',
            borderRadius: '12px',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Space Mono", monospace',
            fontWeight: 700,
            backgroundColor: '#E8C17C',
            borderBottom: '3px solid #2C2C2C',
            textAlign: 'center',
            py: 1.5,
          }}
        >
          🎫 YOUR TICKET
        </DialogTitle>
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          {selectedTicket && (
            <Box>
              {/* Event Name */}
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"DM Serif Display", serif',
                  color: '#2C2C2C',
                  mb: 1,
                  mt: 1,
                }}
              >
                {selectedTicket.eventId?.name || 'Event'}
              </Typography>

              {/* Organizer */}
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"Karla", sans-serif',
                  color: '#3D3D3D',
                  fontStyle: 'italic',
                  mb: 2,
                }}
              >
                by {selectedTicket.eventId?.organizerId?.organizerName || 'Organizer'}
              </Typography>

              <Divider sx={{ borderColor: '#2C2C2C', mb: 2 }} />

              {/* Event Date */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', display: 'block' }}>
                  DATE & TIME
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: '"Karla", sans-serif', fontWeight: 600 }}>
                  {formatDateTime(selectedTicket.eventId?.eventStartDate)}
                </Typography>
              </Box>

              {/* Ticket ID */}
              <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: '8px', border: '2px solid #2C2C2C' }}>
                <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', display: 'block' }}>
                  TICKET ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, color: '#2C2C2C', wordBreak: 'break-all' }}>
                  {selectedTicket.ticketId}
                </Typography>
              </Box>

              {/* Status Badges */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={selectedTicket.status || 'registered'}
                  size="small"
                  sx={{
                    backgroundColor: selectedTicket.status === 'cancelled' ? '#C65D4F' : '#6BA368',
                    color: '#fff',
                    fontFamily: '"Space Mono", monospace',
                    fontWeight: 600,
                    border: '2px solid #2C2C2C',
                  }}
                />
                {selectedTicket.attended && (
                  <Chip
                    label="✓ Attended"
                    size="small"
                    sx={{
                      backgroundColor: '#6B9BC3',
                      color: '#fff',
                      fontFamily: '"Space Mono", monospace',
                      fontWeight: 600,
                      border: '2px solid #2C2C2C',
                    }}
                  />
                )}
              </Box>

              {/* QR Code */}
              {selectedTicket.qrCode && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', display: 'block', mb: 1 }}>
                    SCAN FOR ENTRY
                  </Typography>
                  <Box
                    component="img"
                    src={selectedTicket.qrCode}
                    alt="QR Code"
                    sx={{
                      width: 200,
                      height: 200,
                      border: '3px solid #2C2C2C',
                      borderRadius: '8px',
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            className="window-button"
            onClick={handleCloseTicket}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decorative elements */}
      <div className="wave-decoration" style={{ marginTop: '3rem' }}></div>
      <div className="cloud-decoration-1"></div>
      <div className="cloud-decoration-2"></div>
    </Box>
  );
};

export default Dashboard;
