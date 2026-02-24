import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Button,
    Avatar,
    Chip,
    CircularProgress,
    Tabs,
    Tab,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Check as CheckIcon,
    PersonAdd as PersonAddIcon,
    Business as BusinessIcon,
    Event as EventIcon,
    Store as StoreIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const OrganizerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, updateUser } = useContext(AuthContext);

    const [organizer, setOrganizer] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchOrganizerDetails();
    }, [id]);

    const fetchOrganizerDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/users/organizers/${id}`);
            if (response.data.success) {
                setOrganizer(response.data.organizer);
                setUpcomingEvents(response.data.upcomingEvents || []);
                setPastEvents(response.data.pastEvents || []);
            }
        } catch (error) {
            console.error('Error fetching organizer details:', error);
            showSnackbar('Failed to load organizer details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async () => {
        try {
            setActionLoading(true);
            const response = await api.post(`/users/organizers/${id}/follow`);
            if (response.data.success) {
                const isFollowing = response.data.isFollowing;
                const currentFollowed = user.followedOrganizers || [];

                const newFollowed = isFollowing
                    ? [...currentFollowed, id]
                    : currentFollowed.filter(orgId => orgId !== id);

                updateUser({ ...user, followedOrganizers: newFollowed });
                showSnackbar(response.data.message, 'success');
            }
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to update follow status', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const isFollowing = user?.followedOrganizers?.includes(id);

    const handleEventClick = (eventId) => {
        navigate(`/participant/events/${eventId}`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress sx={{ color: '#E8C17C' }} />
            </Box>
        );
    }

    if (!organizer) {
        return (
            <Container sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h5">Organizer not found</Typography>
                <Button onClick={() => navigate('/participant/clubs')} sx={{ mt: 2 }}>Back to Clubs</Button>
            </Container>
        );
    }

    const displayedEvents = currentTab === 0 ? upcomingEvents : pastEvents;

    return (
        <Box sx={{ minHeight: '100vh', padding: 4, position: 'relative' }}>
            <Container maxWidth="lg">
                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/participant/clubs')}
                    sx={{ mb: 3, color: '#3D3D3D', fontFamily: '"Space Mono", monospace', fontWeight: 700 }}
                >
                    BACK TO CLUBS
                </Button>

                {/* Organizer Profile Banner */}
                <Box className="window-box" sx={{ mb: 4 }}>
                    <div className="window-header">
                        <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
                            CLUB_PROFILE.EXE
                        </Typography>
                    </div>
                    <div className="window-body" style={{ padding: '3rem', position: 'relative', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                        <Avatar sx={{ width: 120, height: 120, bgcolor: '#E8C17C', color: '#2C2C2C', border: '4px solid #3D3D3D' }}>
                            <BusinessIcon sx={{ fontSize: 60 }} />
                        </Avatar>

                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h3" sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, color: '#2C2C2C', mb: 1 }}>
                                {organizer.organizerName}
                            </Typography>
                            <Chip
                                label={organizer.category || 'Other'}
                                sx={{
                                    mb: 2,
                                    fontFamily: '"Space Mono", monospace',
                                    fontWeight: 600,
                                    backgroundColor: '#6B9BC3',
                                    color: 'white',
                                    border: '2px solid #3D3D3D'
                                }}
                            />
                            <Typography variant="body1" sx={{ fontFamily: '"Karla", sans-serif', color: '#3D3D3D', maxWidth: '800px' }}>
                                {organizer.description || 'No description provided.'}
                            </Typography>
                        </Box>

                        <Box sx={{ minWidth: 200, textAlign: 'center' }}>
                            <Button
                                variant={isFollowing ? "contained" : "outlined"}
                                onClick={handleToggleFollow}
                                disabled={actionLoading}
                                startIcon={actionLoading ? <CircularProgress size={20} /> : (isFollowing ? <CheckIcon /> : <PersonAddIcon />)}
                                fullWidth
                                sx={{
                                    py: 1.5,
                                    fontFamily: '"Space Mono", monospace',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    border: '3px solid #3D3D3D',
                                    borderRadius: 0,
                                    color: actionLoading ? 'transparent' : (isFollowing ? '#2C2C2C' : '#3D3D3D'),
                                    backgroundColor: isFollowing ? '#E8C17C' : 'transparent',
                                    '&:hover': {
                                        backgroundColor: isFollowing ? '#d4af6e' : '#f5f5f5',
                                        border: '3px solid #3D3D3D',
                                    }
                                }}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </Button>
                        </Box>
                    </div>
                </Box>

                {/* Events Section */}
                <Box className="window-box">
                    <div className="window-header">
                        <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
                            EVENTS_ARCHIVE.EXE
                        </Typography>
                    </div>

                    <Tabs
                        value={currentTab}
                        onChange={(e, val) => setCurrentTab(val)}
                        sx={{
                            borderBottom: '2px solid #3D3D3D',
                            backgroundColor: '#f5f5f5',
                            '& .MuiTab-root': {
                                fontFamily: '"Space Mono", monospace',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                color: '#3D3D3D',
                                '&.Mui-selected': { color: '#2C2C2C', backgroundColor: '#E8C17C' },
                            },
                            '& .MuiTabs-indicator': { backgroundColor: '#E8C17C', height: 4 },
                        }}
                    >
                        <Tab label={`Upcoming Events (${upcomingEvents.length})`} />
                        <Tab label={`Past Events (${pastEvents.length})`} />
                    </Tabs>

                    <div className="window-body" style={{ padding: '2rem', backgroundColor: '#fafafa' }}>
                        {displayedEvents.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <EventIcon sx={{ fontSize: 60, color: '#B8D8D8', mb: 2 }} />
                                <Typography variant="h6" sx={{ fontFamily: '"DM Serif Display", serif' }}>
                                    No {currentTab === 0 ? 'upcoming' : 'past'} events found.
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {displayedEvents.map(event => (
                                    <Grid item xs={12} sm={6} md={4} key={event._id}>
                                        <Card
                                            onClick={() => handleEventClick(event._id)}
                                            sx={{
                                                height: '100%',
                                                cursor: 'pointer',
                                                border: '2px solid #3D3D3D',
                                                borderRadius: '0px',
                                                boxShadow: '4px 4px 0px rgba(61, 61, 61, 1)',
                                                transition: 'transform 0.2s',
                                                '&:hover': { transform: 'translateY(-4px)' }
                                            }}
                                        >
                                            <CardContent>
                                                <Typography variant="h6" sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, mb: 1, color: '#2C2C2C' }}>
                                                    {event.name}
                                                </Typography>
                                                <Chip
                                                    label={event.type}
                                                    size="small"
                                                    icon={event.type === 'normal' ? <EventIcon /> : <StoreIcon />}
                                                    sx={{ mb: 2, backgroundColor: event.type === 'normal' ? '#6B9BC3' : '#E8C17C', fontWeight: 600 }}
                                                />
                                                <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#6B7280', mb: 1 }}>
                                                    Starts: {new Date(event.eventStartDate).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', fontWeight: 700 }}>
                                                    Fee: {event.registrationFee ? `₹${event.registrationFee}` : 'Free'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </div>
                </Box>
            </Container>
        </Box>
    );
};

export default OrganizerDetail;
