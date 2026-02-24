import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import EventCard from '../../components/participant/EventCard';
import {
  Box,
  Container,
  TextField,
  Grid,
  Typography,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  InputAdornment,
  Card,
  CardContent,
  Chip as MuiChip,
} from '@mui/material';
import { Search as SearchIcon, Whatshot as WhatshotIcon } from '@mui/icons-material';

// Browse Events Page Component
const BrowseEvents = () => {
  const navigate = useNavigate();

  // State for filters and search
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    eligibility: '',
    startDate: '',
    endDate: '',
    followedOnly: false,
  });

  // State for events data
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch events when filters change
  useEffect(() => {
    fetchEvents();
    fetchTrendingEvents();
  }, [search, filters]);

  // Fetch trending events
  const fetchTrendingEvents = async () => {
    try {
      const response = await api.get('/events/trending');
      if (response.data.success) {
        setTrendingEvents(response.data.events || []);
      }
    } catch (err) {
      console.error('Error fetching trending events:', err);
    }
  };

  // Fetch events from API
  const fetchEvents = async () => {
    setLoading(true);
    setError('');

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (search) {
        params.append('search', search);
      }

      if (filters.type) {
        params.append('type', filters.type);
      }

      if (filters.eligibility) {
        params.append('eligibility', filters.eligibility);
      }

      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }

      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      // Call API to get events
      const response = await api.get(`/events?${params.toString()}`);

      // Handle different response formats
      if (Array.isArray(response.data)) {
        setEvents(response.data);
      } else if (response.data.events && Array.isArray(response.data.events)) {
        setEvents(response.data.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      setError('Failed to fetch events. Please try again.');
      console.error('Error fetching events:', err);
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.checked,
    });
  };

  // Navigate to event detail page
  const handleEventClick = (eventId) => {
    navigate(`/participant/events/${eventId}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', padding: 4, position: 'relative' }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box className="window-box" sx={{ marginBottom: 4, position: 'relative' }}>
          {/* Window Header */}
          <div className="window-header">
            <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
              BROWSE_EVENTS.EXE
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
              variant="h3"
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#2C2C2C',
                marginBottom: '0.5rem'
              }}
            >
              Browse Events
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: '"Karla", sans-serif',
                color: '#3D3D3D'
              }}
            >
              Discover upcoming events and opportunities
            </Typography>
          </div>
        </Box>

        {/* Search Section */}
        <Box className="window-box" sx={{ marginBottom: 4 }}>
          <div className="window-body">
            <TextField
              fullWidth
              placeholder="Search events by name or organizer..."
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#3D3D3D' }} />
                  </InputAdornment>
                ),
              }}
            />
          </div>
        </Box>

        {/* Trending Events Banner */}
        {trendingEvents.length > 0 && !search && !filters.type && !filters.eligibility && (
          <Box className="window-box" sx={{ marginBottom: 4 }}>
            <div className="window-header" style={{ backgroundColor: '#C65D4F', color: 'white' }}>
              <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                <WhatshotIcon sx={{ mr: 1, fontSize: '1.2rem' }} /> TRENDING_EVENTS.EXE (Top 5 / 24H)
              </Typography>
            </div>
            <div className="window-body" style={{ padding: '2rem' }}>
              <Grid container spacing={2}>
                {trendingEvents.map((event) => (
                  <Grid item xs={12} sm={6} md={2.4} key={`trending-${event._id}`}>
                    <Card
                      onClick={() => handleEventClick(event._id)}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        border: '2px solid #E8C17C',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '4px 4px 0px #E8C17C' }
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <WhatshotIcon sx={{ color: '#C65D4F', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontFamily: '"Karla", sans-serif', mb: 1, display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                          {event.name}
                        </Typography>
                        <MuiChip
                          label={event.type}
                          size="small"
                          sx={{ height: 20, fontSize: '0.65rem', mb: 1, backgroundColor: event.type === 'normal' ? '#6B9BC3' : '#E8C17C' }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          {event.trendingScore || 0} Registrations
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </div>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Filter Sidebar */}
          <Grid item xs={12} md={3}>
            <Box className="window-box">
              {/* Window Header */}
              <div className="window-header">
                <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
                  FILTERS.EXE
                </Typography>
                <div className="window-controls"></div>
              </div>

              {/* Window Body */}
              <div className="window-body">
                {/* Event Type Filter */}
                <TextField
                  select
                  fullWidth
                  label="Event Type"
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="merchandise">Merchandise</MenuItem>
                </TextField>

                {/* Eligibility Filter */}
                <TextField
                  select
                  fullWidth
                  label="Eligibility"
                  name="eligibility"
                  value={filters.eligibility}
                  onChange={handleFilterChange}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="IIIT Students Only">IIIT Students Only</MenuItem>
                  <MenuItem value="Open to All">Open to All</MenuItem>
                  <MenuItem value="External Only">External Only</MenuItem>
                </TextField>

                {/* Start Date Filter */}
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />

                {/* End Date Filter */}
                <TextField
                  fullWidth
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />

                {/* Followed Clubs Only Checkbox */}
                <FormControlLabel
                  control={
                    <Checkbox
                      name="followedOnly"
                      checked={filters.followedOnly}
                      onChange={handleCheckboxChange}
                    />
                  }
                  label="Followed clubs only"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontFamily: '"Karla", sans-serif',
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </div>
            </Box>
          </Grid>

          {/* Events Grid */}
          <Grid item xs={12} md={9}>
            {/* Error Display */}
            {error && (
              <Box className="window-box" sx={{ marginBottom: 3 }}>
                <div className="window-body" style={{ padding: '1.5rem', backgroundColor: '#ffe5e5', border: '2px solid #C65D4F' }}>
                  <Typography color="error" sx={{ fontFamily: '"Karla", sans-serif', fontSize: '0.875rem' }}>
                    {error}
                  </Typography>
                </div>
              </Box>
            )}

            {/* Loading State */}
            {loading ? (
              <Box className="window-box">
                <div className="window-body" style={{ textAlign: 'center', padding: '3rem' }}>
                  <Typography sx={{ fontFamily: '"Karla", sans-serif', color: '#3D3D3D' }}>
                    Loading events...
                  </Typography>
                </div>
              </Box>
            ) : (
              <>
                {/* No Events Found */}
                {events.length === 0 ? (
                  <Box className="window-box">
                    <div className="window-body" style={{ textAlign: 'center', padding: '3rem' }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: '"DM Serif Display", serif',
                          color: '#2C2C2C',
                          marginBottom: '1rem'
                        }}
                      >
                        No events found
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: '"Karla", sans-serif',
                          color: '#3D3D3D',
                          marginBottom: '2rem'
                        }}
                      >
                        Try adjusting your search or filters
                      </Typography>
                      {(search || filters.type || filters.eligibility || filters.startDate || filters.endDate) && (
                        <Button
                          className="window-button"
                          onClick={() => {
                            setSearch('');
                            setFilters({
                              type: '',
                              eligibility: '',
                              startDate: '',
                              endDate: '',
                              followedOnly: false,
                            });
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </Box>
                ) : (
                  /* Event Cards Grid */
                  <Grid container spacing={3}>
                    {Array.isArray(events) && events.map((event) => (
                      <Grid item xs={12} sm={6} md={4} key={event._id}>
                        <EventCard event={event} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Decorative wave at bottom */}
      <div className="wave-decoration"></div>

      {/* Additional floating clouds */}
      <div className="cloud-decoration-1"></div>
      <div className="cloud-decoration-2"></div>
      <div className="cloud-decoration-3"></div>
      <div className="cloud-decoration-4"></div>
    </Box>
  );
};

export default BrowseEvents;
