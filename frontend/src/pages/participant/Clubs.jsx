import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Snackbar,
  Alert
} from '@mui/material';
import {
  Check as CheckIcon,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const Clubs = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useContext(AuthContext);

  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/organizers');
      if (response.data.success) {
        setOrganizers(response.data.organizers || []);
      }
    } catch (error) {
      console.error('Error fetching organizers:', error);
      showSnackbar('Failed to load organizers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (e, organizerId) => {
    e.stopPropagation(); // prevent card click
    try {
      setActionLoading(organizerId);
      const response = await api.post(`/users/organizers/${organizerId}/follow`);
      if (response.data.success) {
        // Optimistically update the local user context
        const isFollowing = response.data.isFollowing;
        const currentFollowed = user.followedOrganizers || [];

        const newFollowed = isFollowing
          ? [...currentFollowed, organizerId]
          : currentFollowed.filter(id => id !== organizerId);

        updateUser({ ...user, followedOrganizers: newFollowed });
        showSnackbar(response.data.message, 'success');
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to update follow status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewOrganizer = (organizerId) => {
    navigate(`/participant/organizers/${organizerId}`);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const isFollowing = (orgId) => {
    return user?.followedOrganizers?.includes(orgId);
  };

  return (
    <Box sx={{ minHeight: '100vh', padding: 4, position: 'relative' }}>
      <Container maxWidth="lg">
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Header Section */}
        <Box className="window-box" sx={{ marginBottom: 4, position: 'relative' }}>
          <div className="window-header">
            <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
              CLUBS_AND_ORGANIZERS.EXE
            </Typography>
            <div className="window-controls"></div>
          </div>
          <div className="window-body" style={{ padding: '3rem', position: 'relative' }}>
            <span className="sparkle" style={{ position: 'absolute', top: '1rem', right: '2rem' }}>✦</span>
            <span className="sparkle" style={{ position: 'absolute', bottom: '1.5rem', left: '2rem' }}>✦</span>

            <Typography variant="h3" sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, textTransform: 'uppercase', color: '#2C2C2C', marginBottom: '0.5rem' }}>
              Clubs & Organizers
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: '"Karla", sans-serif', color: '#3D3D3D' }}>
              Discover official organizers, read their descriptions, and follow your favorites.
            </Typography>
          </div>
        </Box>

        {loading ? (
          <Box className="window-box">
            <div className="window-body" style={{ textAlign: 'center', padding: '4rem' }}>
              <CircularProgress sx={{ color: '#E8C17C' }} />
              <Typography sx={{ mt: 2, fontFamily: '"Karla", sans-serif' }}>Loading clubs...</Typography>
            </div>
          </Box>
        ) : organizers.length === 0 ? (
          <Box className="window-box">
            <div className="window-body" style={{ textAlign: 'center', padding: '4rem' }}>
              <BusinessIcon sx={{ fontSize: 60, color: '#B8D8D8', mb: 2 }} />
              <Typography variant="h5" sx={{ fontFamily: '"DM Serif Display", serif', mb: 1 }}>No organizers found</Typography>
              <Typography variant="body1" sx={{ fontFamily: '"Karla", sans-serif', color: '#6B7280' }}>Check back later as new clubs are added to the platform.</Typography>
            </div>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {organizers.map((org) => (
              <Grid item xs={12} sm={6} md={4} key={org._id}>
                <Card
                  onClick={() => handleViewOrganizer(org._id)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    border: '3px solid #3D3D3D',
                    borderRadius: '0px',
                    boxShadow: '4px 4px 0px rgba(61, 61, 61, 1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translate(-2px, -2px)',
                      boxShadow: '6px 6px 0px rgba(61, 61, 61, 1)',
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: '#E8C17C', color: '#2C2C2C', border: '3px solid #3D3D3D' }}>
                      <BusinessIcon fontSize="large" />
                    </Avatar>

                    <Typography variant="h6" sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, mb: 1, color: '#2C2C2C' }}>
                      {org.organizerName}
                    </Typography>

                    <Chip
                      label={org.category || 'Other'}
                      size="small"
                      sx={{
                        mb: 2,
                        fontFamily: '"Space Mono", monospace',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: '#6B9BC3',
                        color: 'white',
                        border: '2px solid #3D3D3D'
                      }}
                    />

                    <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#6B7280', mb: 3, flexGrow: 1, display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3 }}>
                      {org.description || 'No description available for this organizer.'}
                    </Typography>

                    <Button
                      fullWidth
                      variant={isFollowing(org._id) ? "contained" : "outlined"}
                      onClick={(e) => handleToggleFollow(e, org._id)}
                      disabled={actionLoading === org._id}
                      startIcon={actionLoading === org._id ? <CircularProgress size={20} /> : (isFollowing(org._id) ? <CheckIcon /> : <PersonAddIcon />)}
                      sx={{
                        fontFamily: '"Space Mono", monospace',
                        fontWeight: 700,
                        border: '2px solid #3D3D3D',
                        borderRadius: 0,
                        color: actionLoading === org._id ? 'transparent' : (isFollowing(org._id) ? '#2C2C2C' : '#3D3D3D'),
                        backgroundColor: isFollowing(org._id) ? '#E8C17C' : 'transparent',
                        '&:hover': {
                          backgroundColor: isFollowing(org._id) ? '#d4af6e' : '#f5f5f5',
                          border: '2px solid #3D3D3D',
                        }
                      }}
                    >
                      {isFollowing(org._id) ? 'Following' : 'Follow'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
      <div className="wave-decoration"></div>
    </Box>
  );
};

export default Clubs;
