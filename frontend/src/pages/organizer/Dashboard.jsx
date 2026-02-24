import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Description as DocumentIcon,
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
  CheckCircle as AttendedIcon,
} from '@mui/icons-material';

// Organizer Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const carouselRef = useRef(null);

  // State for events and analytics
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    upcomingEvents: 0,
    totalAttendance: 0,
  });

  // Fetch organizer's events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch events from API
  const fetchEvents = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch events created by this organizer
      const response = await api.get(`/events?organizerId=${user?._id}`);
      const eventsData = response.data.events || [];
      setEvents(eventsData);

      // Calculate analytics
      calculateAnalytics(eventsData);
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics from events data
  const calculateAnalytics = (eventsData) => {
    const now = new Date();

    const totalEvents = eventsData.length;
    const totalRegistrations = eventsData.reduce(
      (sum, event) => sum + (event.registrationCount || 0),
      0
    );
    const totalRevenue = eventsData.reduce(
      (sum, event) => sum + (event.revenue || 0),
      0
    );
    const upcomingEvents = eventsData.filter(
      (event) => new Date(event.eventStartDate) >= now
    ).length;
    const totalAttendance = eventsData.reduce(
      (sum, event) => sum + (event.attendanceCount || 0),
      0
    );

    setAnalytics({
      totalEvents,
      totalRegistrations,
      totalRevenue,
      upcomingEvents,
      totalAttendance,
    });
  };

  // Navigate to create event page
  const handleCreateEvent = () => {
    navigate('/organizer/create-event');
  };

  // Navigate to event detail page
  const handleEventClick = (eventId) => {
    navigate(`/organizer/events/${eventId}`);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get status background color
  const getStatusBgColor = (status) => {
    switch (status) {
      case 'draft':
        return '#9E9E9E';
      case 'published':
        return '#6B9BC3';
      case 'ongoing':
        return '#E8C17C';
      case 'completed':
        return '#4CAF50';
      case 'closed':
        return '#C65D4F';
      default:
        return '#9E9E9E';
    }
  };

  // Carousel scroll handlers
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 320;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', padding: 4, position: 'relative' }}>
      {/* Sparkle decorations */}
      <div className="sparkle" style={{ position: 'absolute', top: '20px', right: '50px', fontSize: '1.5rem' }}>✨</div>
      <div className="sparkle" style={{ position: 'absolute', top: '100px', left: '30px', fontSize: '1rem' }}>✨</div>
      <div className="sparkle" style={{ position: 'absolute', top: '200px', right: '100px', fontSize: '1.2rem' }}>✨</div>

      {/* Header Window */}
      <div className="window-box" style={{ marginBottom: '2rem' }}>
        <div className="window-header">
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'Space Mono, monospace',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontSize: '1rem',
            }}
          >
            ORGANIZER_PANEL.EXE
          </Typography>
        </div>
        <div className="window-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Box>
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                fontFamily: 'DM Serif Display, serif',
                fontWeight: 400,
                color: '#2C2C2C',
                mb: 1,
              }}
            >
              Event Dashboard
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'Karla, sans-serif',
                color: '#3D3D3D',
              }}
            >
              Manage your events • Welcome, {user?.organizerName || 'Organizer'}
            </Typography>
          </Box>

          {/* Create New Event button */}
          <Button
            className="window-button window-button-gold"
            startIcon={<AddIcon />}
            onClick={handleCreateEvent}
            size="large"
          >
            Create New Event
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Row */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              { icon: <DocumentIcon sx={{ fontSize: 48, color: '#6B9BC3', mb: 1 }} />, value: analytics.totalEvents, label: 'Total Events' },
              { icon: <PeopleIcon sx={{ fontSize: 48, color: '#6B9BC3', mb: 1 }} />, value: analytics.totalRegistrations, label: 'Total Registrations' },
              { icon: <MoneyIcon sx={{ fontSize: 48, color: '#6B9BC3', mb: 1 }} />, value: `₹${analytics.totalRevenue}`, label: 'Total Revenue' },
              { icon: <CalendarIcon sx={{ fontSize: 48, color: '#6B9BC3', mb: 1 }} />, value: analytics.upcomingEvents, label: 'Upcoming Events' },
              { icon: <AttendedIcon sx={{ fontSize: 48, color: '#6B9BC3', mb: 1 }} />, value: analytics.totalAttendance, label: 'Total Attendance' },
            ].map((stat, idx) => (
              <Grid item xs={6} sm={4} md={2.4} key={idx}>
                <div className="window-box">
                  <div className="window-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    {stat.icon}
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'Space Mono, monospace',
                        fontWeight: 700,
                        color: '#E8C17C',
                        mb: 0.5,
                        fontSize: { xs: '1.5rem', md: '2rem' },
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'Karla, sans-serif',
                        color: '#3D3D3D',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </div>
                </div>
              </Grid>
            ))}
          </Grid>

          {/* Events Carousel Section */}
          <div className="window-box">
            <div className="window-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Space Mono, monospace',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  fontSize: '0.95rem',
                }}
              >
                YOUR_EVENTS.EXE
              </Typography>
              {events.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => scrollCarousel('left')}
                    sx={{ color: '#2C2C2C', border: '2px solid #2C2C2C', borderRadius: '4px', p: 0.5 }}
                  >
                    <LeftIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => scrollCarousel('right')}
                    sx={{ color: '#2C2C2C', border: '2px solid #2C2C2C', borderRadius: '4px', p: 0.5 }}
                  >
                    <RightIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </div>
            <div className="window-body" style={{ padding: '1.5rem' }}>
              {events.length === 0 ? (
                /* Empty State */
                <Box sx={{ textAlign: 'center', padding: 4 }}>
                  <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📋</span>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      fontFamily: 'DM Serif Display, serif',
                      color: '#2C2C2C',
                      mb: 2,
                    }}
                  >
                    No events yet
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'Karla, sans-serif',
                      color: '#3D3D3D',
                      mb: 3,
                    }}
                  >
                    Create your first event to get started
                  </Typography>
                  <Button
                    className="window-button window-button-gold"
                    startIcon={<AddIcon />}
                    onClick={handleCreateEvent}
                  >
                    Create Event
                  </Button>
                </Box>
              ) : (
                /* Horizontal Scrolling Carousel */
                <Box
                  ref={carouselRef}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth',
                    pb: 1,
                    /* Hide scrollbar but keep scroll functionality */
                    '&::-webkit-scrollbar': { height: '6px' },
                    '&::-webkit-scrollbar-track': { background: '#f0f0f0', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb': { background: '#E8C17C', borderRadius: '4px', border: '1px solid #2C2C2C' },
                  }}
                >
                  {events.map((event) => (
                    <Box
                      key={event._id}
                      onClick={() => handleEventClick(event._id)}
                      sx={{
                        minWidth: '280px',
                        maxWidth: '280px',
                        scrollSnapAlign: 'start',
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' },
                      }}
                    >
                      <div className="window-box" style={{ height: '100%' }}>
                        <div className="window-header">
                          <Typography
                            sx={{
                              fontFamily: 'Space Mono, monospace',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px',
                            }}
                          >
                            {event.name}
                          </Typography>
                          <div className="window-controls"></div>
                        </div>
                        <div className="window-body" style={{ padding: '1.25rem' }}>
                          {/* Type badge */}
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'Karla, sans-serif',
                              color: '#3D3D3D',
                              mb: 1,
                            }}
                          >
                            {event.type === 'normal' ? '📄 Normal Event' : '🛍️ Merchandise'}
                          </Typography>

                          {/* Status Badge */}
                          <Chip
                            label={event.status?.toUpperCase() || 'DRAFT'}
                            size="small"
                            sx={{
                              backgroundColor: getStatusBgColor(event.status),
                              color: 'white',
                              fontFamily: 'Space Mono, monospace',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              mb: 1.5,
                            }}
                          />

                          {/* Event Date */}
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'Karla, sans-serif',
                              color: '#3D3D3D',
                              display: 'block',
                              mb: 0.5,
                            }}
                          >
                            📅 {formatDate(event.eventStartDate)}
                          </Typography>

                          {/* Registrations Count */}
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'Karla, sans-serif',
                              color: '#3D3D3D',
                              display: 'block',
                              mb: 0.5,
                            }}
                          >
                            👥 {event.registrationCount || 0} / {event.registrationLimit} registrations
                          </Typography>

                          {/* Revenue */}
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'Karla, sans-serif',
                              color: '#3D3D3D',
                              display: 'block',
                              mb: 2,
                            }}
                          >
                            💰 ₹{event.revenue || 0}
                          </Typography>

                          {/* View Details */}
                          <Button
                            fullWidth
                            className="window-button"
                            size="small"
                          >
                            View Details →
                          </Button>
                        </div>
                      </div>
                    </Box>
                  ))}
                </Box>
              )}
            </div>
          </div>

          {/* Wave decoration at bottom */}
          <div className="wave-decoration" style={{ marginTop: '3rem' }} />
        </>
      )}
    </Box>
  );
};

export default Dashboard;
