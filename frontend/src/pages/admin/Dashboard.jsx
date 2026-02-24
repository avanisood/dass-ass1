import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Event as EventIcon,
  Business as BusinessIcon,
  ConfirmationNumber as TicketIcon
} from '@mui/icons-material';
import api from '../../services/api';

/**
 * Admin Dashboard Page
 * Displays overall platform statistics and recent activity
 */
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalOrganizers: 0,
    totalEvents: 0,
    totalRegistrations: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.stats);
        setRecentEvents(response.data.recentEvents || []);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, count, icon, color }) => (
    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `6px solid ${color}` }}>
      <Box>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3" component="div">
          {loading ? <CircularProgress size={30} /> : count}
        </Typography>
      </Box>
      <Box sx={{ color: color, opacity: 0.8, '& svg': { fontSize: 60 } }}>
        {icon}
      </Box>
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700 }}>
        Platform Overview
      </Typography>

      {/* Statistics Grid */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Organizers" count={stats.totalOrganizers} icon={<BusinessIcon />} color="#6BA368" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Events" count={stats.totalEvents} icon={<EventIcon />} color="#E8C17C" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Participants" count={stats.totalParticipants} icon={<PeopleIcon />} color="#8BA1C2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Registrations" count={stats.totalRegistrations} icon={<TicketIcon />} color="#C65D4F" />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #E8C17C', pb: 1 }}>
              Recently Created Events
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
            ) : recentEvents.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 2 }}>No events created yet.</Typography>
            ) : (
              <List>
                {recentEvents.map((event, index) => (
                  <React.Fragment key={event._id}>
                    <ListItem>
                      <ListItemText
                        primary={event.name}
                        secondary={new Date(event.createdAt).toLocaleDateString()}
                      />
                      <Typography variant="body2" color={event.status === 'published' ? 'success.main' : 'text.secondary'}>
                        {event.status}
                      </Typography>
                    </ListItem>
                    {index < recentEvents.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
