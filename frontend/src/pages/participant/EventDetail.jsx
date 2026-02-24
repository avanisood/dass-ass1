import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Container,
  Typography,
  Button,
  Box,
  Chip,
  Grid,
  Alert,
  TextField,
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  LocationOn,
  Person,
  AttachMoney,
  People,
  CheckCircle,
  TextFields,
  ToggleOn,
  List as ListIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import DiscussionForum from '../../components/event/DiscussionForum';
import RegistrationFormModal from '../../components/participant/RegistrationForm';
import { downloadIcsFile, getGoogleCalendarUrl, getOutlookCalendarUrl } from '../../utils/calendarUtils';

// Event Detail Page Component
const EventDetail = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // State for event data
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [team, setTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [createTeamName, setCreateTeamName] = useState('');
  const [targetSize, setTargetSize] = useState(3);
  const [joinTeamCode, setJoinTeamCode] = useState('');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState('');
  const [registrationError, setRegistrationError] = useState('');

  // Fetch event details on mount
  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    if (user && user.role === 'participant') {
      checkRegistrationStatus();
      fetchTeamStatus();
    }
  }, [eventId, user]);

  // Fetch event by ID
  const fetchEventDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/events/${eventId}`);

      // Handle different response formats
      if (response.data.event) {
        setEvent(response.data.event);
      } else if (response.data._id) {
        setEvent(response.data);
      } else {
        setError('Invalid event data received');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Event not found');
      } else {
        setError('Failed to load event details. Please try again.');
      }
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already registered
  const checkRegistrationStatus = async () => {
    try {
      const response = await api.get(`/registrations/check/${eventId}`);
      setIsRegistered(response.data.isRegistered);
    } catch (err) {
      // Ignore error - user might not be registered
      console.error('Error checking registration:', err);
    }
  };

  // Fetch team status
  const fetchTeamStatus = async () => {
    try {
      setTeamLoading(true);
      const response = await api.get(`/events/${eventId}/team`);
      if (response.data.success) {
        setTeam(response.data.team);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      setTeamLoading(true);
      setTeamError('');
      setTeamLoading(true);
      setTeamError('');
      const response = await api.post(`/events/${eventId}/teams`, { name: createTeamName, targetSize: parseInt(targetSize) });
      if (response.data.success) {
        setTeam(response.data.team);
        setShowTeamModal(false);
        setCreateTeamName('');
        setTargetSize(3);
      }
    } catch (error) {
      setTeamError(error.response?.data?.message || 'Failed to create team');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    try {
      setTeamLoading(true);
      setTeamError('');
      const response = await api.post(`/events/${eventId}/teams/join`, { inviteCode: joinTeamCode });
      if (response.data.success) {
        setTeam(response.data.team);
        setShowTeamModal(false);
        setJoinTeamCode('');
      }
    } catch (error) {
      setTeamError(error.response?.data?.message || 'Failed to join team');
    } finally {
      setTeamLoading(false);
    }
  };

  // Format date for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if registration deadline has passed
  const isDeadlinePassed = () => {
    if (!event) return true;
    return new Date(event.registrationDeadline) < new Date();
  };

  // Check if slots are available
  const areSlotsAvailable = () => {
    if (!event) return false;
    return event.registrationCount < event.registrationLimit;
  };

  // Calculate remaining slots
  const getRemainingSlots = () => {
    if (!event) return 0;
    return event.registrationLimit - event.registrationCount;
  };

  // Determine registration status
  const getRegistrationStatus = () => {
    if (isDeadlinePassed()) return 'Closed';
    if (!areSlotsAvailable()) return 'Full';
    return 'Open';
  };

  // Check if user can register
  const canRegister = () => {
    if (!user || user.role !== 'participant') return false;
    if (isRegistered) return false;
    if (isDeadlinePassed()) return false;
    if (!areSlotsAvailable()) return false;
    return true;
  };

  // Handle register button click
  const handleRegisterClick = () => {
    if ((event.type === 'normal' && event.customForm && event.customForm.length > 0) || event.type === 'merchandise') {
      setRegistrationModalOpen(true);
    } else {
      submitRegistration({});
    }
  };

  const submitRegistration = async (registrationData) => {
    setRegistering(true);
    setRegistrationError('');
    setRegistrationSuccess('');
    try {
      const payload = {
        eventId,
        ...registrationData
      };
      const response = await api.post('/registrations', payload);
      if (response.data.success) {
        setIsRegistered(true);
        setRegistrationSuccess(response.data.message || 'Successfully registered!');
        setRegistrationModalOpen(false);
        checkRegistrationStatus();
      }
    } catch (err) {
      setRegistrationError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ padding: 4 }}>
        <Box className="window-box">
          <div className="window-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <Typography sx={{ fontFamily: '"Karla", sans-serif', color: '#3D3D3D' }}>
              Loading event details...
            </Typography>
          </div>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ padding: 4 }}>
        <Box className="window-box">
          <div className="window-body" style={{ padding: '2rem', backgroundColor: '#ffe5e5', border: '2px solid #C65D4F' }}>
            <Typography color="error" sx={{ fontFamily: '"Karla", sans-serif', marginBottom: '1rem' }}>
              {error}
            </Typography>
            <Button className="window-button" onClick={() => navigate('/participant/events')}>
              Back to Events
            </Button>
          </div>
        </Box>
      </Container>
    );
  }

  // No event found
  if (!event) {
    return (
      <Container maxWidth="md" sx={{ padding: 4 }}>
        <Box className="window-box">
          <div className="window-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <Typography sx={{ fontFamily: '"Karla", sans-serif', marginBottom: '1rem' }}>
              Event not found
            </Typography>
            <Button className="window-button" onClick={() => navigate('/participant/events')}>
              Back to Events
            </Button>
          </div>
        </Box>
      </Container>
    );
  }

  const registrationStatus = getRegistrationStatus();

  return (
    <Container maxWidth="md" sx={{ padding: 4, position: 'relative' }}>
      {/* Main Window */}
      <div className="window-box">
        {/* Window Header */}
        <div className="window-header">
          <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
            EVENT_DETAIL.EXE
          </Typography>
          <div className="window-controls"></div>
        </div>

        {/* Window Body */}
        <div className="window-body" style={{ position: 'relative' }}>
          {/* Hero Section */}
          <Box sx={{ position: 'relative', padding: 3, textAlign: 'center', background: 'linear-gradient(to bottom, #F4D4A8 0%, #FEFEFE 100%)', borderRadius: '8px', marginBottom: 3 }}>
            {/* Sun Icon */}
            <span className="sun-icon" style={{ margin: '0 auto 1rem', display: 'block' }}></span>

            {/* Sparkles */}
            <span className="sparkle" style={{ position: 'absolute', top: '1rem', left: '2rem' }}>✦</span>
            <span className="sparkle" style={{ position: 'absolute', top: '1rem', right: '2rem' }}>✦</span>

            {/* Event Name */}
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#2C2C2C',
                marginBottom: '1rem'
              }}
            >
              {event.name}
            </Typography>

            {/* Event Type Badge */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip
                label={event.type === 'normal' ? 'Normal Event' : 'Merchandise'}
                sx={{
                  backgroundColor: event.type === 'normal' ? '#6B9BC3' : '#E8C17C',
                  border: '2px solid #3D3D3D',
                  color: '#2C2C2C',
                  fontFamily: '"Space Mono", monospace',
                  fontWeight: 600,
                }}
              />

              {/* Registration Status Badge */}
              <Chip
                label={`Registration: ${registrationStatus}`}
                sx={{
                  backgroundColor:
                    registrationStatus === 'Open' ? '#6BA368' :
                      registrationStatus === 'Full' ? '#E8C17C' : '#C65D4F',
                  border: '2px solid #3D3D3D',
                  color: registrationStatus === 'Open' ? '#FFFFFF' : '#2C2C2C',
                  fontFamily: '"Space Mono", monospace',
                  fontWeight: 600,
                }}
              />
            </Box>

            {/* Brief Description */}
            <Typography
              variant="body1"
              sx={{
                fontFamily: '"Karla", sans-serif',
                color: '#2C2C2C',
                lineHeight: 1.6,
                maxWidth: '600px',
                margin: '0 auto'
              }}
            >
              {event.description?.substring(0, 150)}...
            </Typography>
          </Box>

          {/* Info Grid */}
          <Grid container spacing={2} sx={{ marginBottom: 3 }}>
            {/* Date */}
            <Grid item xs={12} sm={6} md={4}>
              <Box className="window-box" sx={{ textAlign: 'center', padding: 2 }}>
                <CalendarToday sx={{ fontSize: 40, color: '#6B9BC3', marginBottom: 1 }} />
                <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', display: 'block', marginBottom: 0.5 }}>
                  DATE
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#2C2C2C', fontWeight: 600 }}>
                  {new Date(event.eventStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
              </Box>
            </Grid>

            {/* Time */}
            <Grid item xs={12} sm={6} md={4}>
              <Box className="window-box" sx={{ textAlign: 'center', padding: 2 }}>
                <AccessTime sx={{ fontSize: 40, color: '#6B9BC3', marginBottom: 1 }} />
                <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', display: 'block', marginBottom: 0.5 }}>
                  TIME
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#2C2C2C', fontWeight: 600 }}>
                  {new Date(event.eventStartDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Grid>

            {/* Venue/Location */}
            <Grid item xs={12} sm={6} md={4}>
              <Box className="window-box" sx={{ textAlign: 'center', padding: 2 }}>
                <LocationOn sx={{ fontSize: 40, color: '#6B9BC3', marginBottom: 1 }} />
                <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', display: 'block', marginBottom: 0.5 }}>
                  VENUE
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#2C2C2C', fontWeight: 600 }}>
                  {event.venue || 'TBA'}
                </Typography>
              </Box>
            </Grid>

            {/* Organizer */}
            <Grid item xs={12} sm={6} md={4}>
              <Box className="window-box" sx={{ textAlign: 'center', padding: 2 }}>
                <Person sx={{ fontSize: 40, color: '#6B9BC3', marginBottom: 1 }} />
                <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', display: 'block', marginBottom: 0.5 }}>
                  ORGANIZER
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#2C2C2C', fontWeight: 600 }}>
                  {event.organizerId?.organizerName || 'Unknown'}
                </Typography>
              </Box>
            </Grid>

            {/* Fee */}
            <Grid item xs={12} sm={6} md={4}>
              <Box className="window-box" sx={{ textAlign: 'center', padding: 2 }}>
                <AttachMoney sx={{ fontSize: 40, color: '#E8C17C', marginBottom: 1 }} />
                <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', display: 'block', marginBottom: 0.5 }}>
                  FEE
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: '"Space Mono", monospace', color: '#2C2C2C', fontWeight: 700 }}>
                  {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                </Typography>
              </Box>
            </Grid>

            {/* Spots Remaining */}
            <Grid item xs={12} sm={6} md={4}>
              <Box className="window-box" sx={{ textAlign: 'center', padding: 2 }}>
                <People sx={{ fontSize: 40, color: '#6B9BC3', marginBottom: 1 }} />
                <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', display: 'block', marginBottom: 0.5 }}>
                  SPOTS LEFT
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: '"Space Mono", monospace', color: '#2C2C2C', fontWeight: 700 }}>
                  {getRemainingSlots()} / {event.registrationLimit}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Description Section */}
          <div className="vintage-card" style={{ marginBottom: '2rem' }}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"DM Serif Display", serif',
                color: '#2C2C2C',
                marginBottom: '1rem'
              }}
            >
              About This Event
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: '"Karla", sans-serif',
                color: '#2C2C2C',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap'
              }}
            >
              {event.description}
            </Typography>

            {/* Eligibility */}
            <Box sx={{ marginTop: 2, paddingTop: 2, borderTop: '2px solid #3D3D3D' }}>
              <Typography variant="caption" sx={{ fontFamily: '"Space Mono", monospace', color: '#3D3D3D', fontWeight: 600 }}>
                ELIGIBILITY
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: '"Karla", sans-serif', color: '#2C2C2C' }}>
                {event.eligibility}
              </Typography>
            </Box>
          </div>

          {/* Custom Form Preview (if normal event) */}
          {event.type === 'normal' && event.customForm && event.customForm.length > 0 && (
            <Box className="window-box" sx={{ marginTop: 3 }}>
              <div className="window-header">
                <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
                  REGISTRATION_FORM_PREVIEW.EXE
                </Typography>
                <div className="window-controls"></div>
              </div>
              <div className="window-body">
                <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#6B9BC3', marginBottom: 2, fontStyle: 'italic' }}>
                  (This is a preview of required fields. Click "Register Now" below to fill out the form.)
                </Typography>
                {event.customForm.map((field, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', marginBottom: 1.5 }}>
                    {field.fieldType === 'text' && <TextFields sx={{ marginRight: 1, color: '#6B9BC3' }} />}
                    {field.fieldType === 'checkbox' && <ToggleOn sx={{ marginRight: 1, color: '#6B9BC3' }} />}
                    {field.fieldType === 'dropdown' && <ListIcon sx={{ marginRight: 1, color: '#6B9BC3' }} />}
                    <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#2C2C2C', flexGrow: 1 }}>
                      {field.label}
                    </Typography>
                    {field.required && (
                      <Chip
                        label="Required"
                        size="small"
                        sx={{
                          backgroundColor: '#C65D4F',
                          color: '#FFFFFF',
                          fontFamily: '"Space Mono", monospace',
                          fontSize: '0.65rem',
                          height: '20px'
                        }}
                      />
                    )}
                  </Box>
                ))}
              </div>
            </Box>
          )}

          {/* Merchandise Variants (if applicable) */}
          {event.type === 'merchandise' && event.itemDetails?.variants && event.itemDetails.variants.length > 0 && (
            <Box className="window-box" sx={{ marginTop: 3 }}>
              <div className="window-header">
                <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
                  AVAILABLE_VARIANTS.EXE
                </Typography>
                <div className="window-controls"></div>
              </div>
              <div className="window-body">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[...new Set(event.itemDetails.variants.map(v => v.color))].map((color, index) => (
                    <Box key={index} sx={{ p: 1.5, border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                      <Typography variant="subtitle2" sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 600, mb: 1, color: '#3D3D3D' }}>
                        {color}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {event.itemDetails.variants
                          .filter(v => v.color === color)
                          .map((variant, i) => (
                            <Chip
                              key={i}
                              label={`${variant.size} (Stock: ${variant.stock})`}
                              sx={{
                                border: '2px solid #3D3D3D',
                                backgroundColor: variant.stock > 0 ? '#6BA368' : '#C65D4F',
                                color: '#FFFFFF',
                                fontFamily: '"Karla", sans-serif',
                                fontSize: '0.75rem',
                                height: '24px'
                              }}
                            />
                          ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </div>
            </Box>

          )}

          {/* Team Registration Section */}
          {user && user.role === 'participant' && event.type === 'normal' && (
            <Box className="window-box" sx={{ marginTop: 3 }}>
              <div className="window-header">
                <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
                  TEAM_MANAGEMENT.EXE
                </Typography>
              </div>
              <div className="window-body" style={{ padding: '2rem' }}>
                {team ? (
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Space Mono, monospace' }}>
                      Your Team: {team.name}
                    </Typography>
                    <Box sx={{ mb: 2, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'Karla, sans-serif' }}>
                        Invite Code: <strong>{team.inviteCode}</strong> (Share this to invite members)
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontFamily: 'Space Mono, monospace' }}>
                      Members:
                    </Typography>
                    <Grid container spacing={1}>
                      {team.members.map((member, idx) => (
                        <Grid item key={idx}>
                          <Chip
                            label={`${member.userId.firstName} ${member.userId.lastName} (${member.status})`}
                            sx={{ fontFamily: 'Karla, sans-serif' }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                    {team.status === 'completed' && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        Team registration complete!
                      </Alert>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body1" paragraph sx={{ fontFamily: 'Karla, sans-serif' }}>
                      participate as a team? Create one or join an existing one.
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                          <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Space Mono, monospace' }}>
                            Create Team
                          </Typography>
                          <TextField
                            fullWidth
                            label="Team Name"
                            value={createTeamName}
                            onChange={(e) => setCreateTeamName(e.target.value)}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Target Size (2-6)"
                            type="number"
                            value={targetSize}
                            onChange={(e) => setTargetSize(e.target.value)}
                            size="small"
                            sx={{ mb: 2 }}
                            inputProps={{ min: 2, max: 6 }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleCreateTeam}
                            disabled={!createTeamName.trim() || teamLoading}
                            fullWidth
                            sx={{ bgcolor: '#E8C17C', color: 'black', '&:hover': { bgcolor: '#d4af6e' } }}
                          >
                            Create
                          </Button>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                          <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Space Mono, monospace' }}>
                            Join Team
                          </Typography>
                          <TextField
                            fullWidth
                            label="Invite Code"
                            value={joinTeamCode}
                            onChange={(e) => setJoinTeamCode(e.target.value)}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                          <Button
                            variant="outlined"
                            onClick={handleJoinTeam}
                            disabled={!joinTeamCode.trim() || teamLoading}
                            fullWidth
                            sx={{ borderColor: '#E8C17C', color: '#E8C17C', '&:hover': { borderColor: '#d4af6e', color: '#d4af6e' } }}
                          >
                            Join
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                    {teamError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {teamError}
                      </Alert>
                    )}
                  </Box>
                )}
              </div>
            </Box>
          )}

          {/* Registration Button Section */}
          <Box sx={{ textAlign: 'center', marginTop: 4 }}>
            {canRegister() && (
              <Button
                className="window-button window-button-gold"
                size="large"
                onClick={handleRegisterClick}
                disabled={registering}
                sx={{ fontSize: '1rem', padding: '12px 48px' }}
              >
                {registering ? 'Registering...' : event.type === 'merchandise' ? 'Purchase Now' : 'Register Now'}
              </Button>
            )}

            {registrationError && (
              <Alert severity="error" sx={{ mt: 2, fontFamily: 'Karla, sans-serif' }}>
                {registrationError}
              </Alert>
            )}

            {registrationSuccess && (
              <Alert severity="success" sx={{ mt: 2, fontFamily: 'Karla, sans-serif' }}>
                {registrationSuccess}
              </Alert>
            )}

            {isRegistered && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Chip
                  icon={<CheckCircle />}
                  label="Already Registered"
                  sx={{
                    backgroundColor: '#6BA368',
                    border: '2px solid #3D3D3D',
                    color: '#FFFFFF',
                    fontFamily: '"Space Mono", monospace',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '1.5rem 1rem',
                    height: 'auto',
                    mb: 3,
                  }}
                />

                {/* Add to Calendar Section */}
                <Typography variant="subtitle2" sx={{ mb: 2, fontFamily: '"Space Mono", monospace', fontWeight: 700, textTransform: 'uppercase', color: '#3D3D3D' }}>
                  ADD_TO_CALENDAR.EXE
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadIcsFile(event)}
                    sx={{ borderColor: '#3D3D3D', color: '#2C2C2C', fontFamily: 'Karla, sans-serif' }}
                  >
                    .iCS File
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CalendarToday />}
                    onClick={() => window.open(getGoogleCalendarUrl(event), '_blank')}
                    sx={{ borderColor: '#3D3D3D', color: '#2C2C2C', fontFamily: 'Karla, sans-serif' }}
                  >
                    Google
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CalendarToday />}
                    onClick={() => window.open(getOutlookCalendarUrl(event), '_blank')}
                    sx={{ borderColor: '#3D3D3D', color: '#2C2C2C', fontFamily: 'Karla, sans-serif' }}
                  >
                    Outlook
                  </Button>
                </Box>
              </Box>
            )}

            {!canRegister() && !isRegistered && (
              <Chip
                label={
                  !user
                    ? 'Login to Register'
                    : user.role !== 'participant'
                      ? 'Participants Only'
                      : isDeadlinePassed()
                        ? 'Registration Closed'
                        : !areSlotsAvailable()
                          ? 'Event Full'
                          : 'Cannot Register'
                }
                sx={{
                  backgroundColor: '#888888',
                  border: '2px solid #3D3D3D',
                  color: '#FFFFFF',
                  fontFamily: '"Space Mono", monospace',
                  fontWeight: 600,
                  fontSize: '1rem',
                  padding: '1.5rem 1rem',
                  height: 'auto',
                }}
              />
            )}

            {/* Discussion Forum */}
            <DiscussionForum eventId={eventId} isOrganizer={false} isRegistered={isRegistered} />

            {/* Back Button */}
            <Box sx={{ marginTop: 2 }}>
              <Button
                className="window-button"
                onClick={() => navigate('/participant/events')}
              >
                Back to Events
              </Button>
            </Box>
          </Box>
        </div>
      </div >

      {/* Registration Form Modal */}
      <RegistrationFormModal
        open={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
        event={event}
        onSubmit={submitRegistration}
        registering={registering}
      />

      {/* Decorative wave at bottom */}
      <div className="wave-decoration" style={{ marginTop: '3rem' }}></div>

      {/* Floating sparkles */}
      <span className="sparkle" style={{ position: 'fixed', top: '20%', left: '10%' }}>✦</span>
      <span className="sparkle" style={{ position: 'fixed', bottom: '30%', right: '15%' }}>✦</span>
    </Container>
  );
};

export default EventDetail;
