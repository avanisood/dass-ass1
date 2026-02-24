import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Card,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import {
  Event as EventIcon,
  Store as StoreIcon,
} from '@mui/icons-material';

// Event Card Component
const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Navigate to event detail page
  const handleClick = () => {
    navigate(`/participant/events/${event._id}`);
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

  // Check if registration deadline has passed
  const isDeadlinePassed = () => {
    return new Date(event.registrationDeadline) < new Date();
  };

  return (
    <Card
      className="window-box"
      sx={{
        height: 'auto',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.15s ease',
        '&:hover': {
          transform: 'translate(2px, 2px)',
        },
      }}
      onClick={handleClick}
    >
      {/* Card Header (Window Header) */}
      <Box className="window-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Event Type Chip */}
        <Chip
          label={event.type === 'normal' ? 'Normal' : 'Merchandise'}
          size="small"
          icon={event.type === 'normal' ? <EventIcon /> : <StoreIcon />}
          sx={{
            border: '2px solid #3D3D3D',
            backgroundColor: event.type === 'normal' ? '#6B9BC3' : '#E8C17C',
            color: '#2C2C2C',
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.7rem',
            fontWeight: 600,
            '& .MuiChip-icon': {
              color: '#2C2C2C',
              fontSize: '1rem',
            }
          }}
        />

        {/* Window Controls */}
        <Box className="window-controls"></Box>
      </Box>

      {/* Sparkle Decoration */}
      <span className="sparkle" style={{ position: 'absolute', top: '3.5rem', right: '1rem', fontSize: '1.2rem' }}>✦</span>

      {/* Card Content (Window Body) */}
      <Box className="window-body">
        {/* Event Name */}
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"DM Serif Display", serif',
            color: '#2C2C2C',
            marginBottom: '0.5rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {event.name}
        </Typography>

        {/* Organizer */}
        <Typography
          variant="body2"
          onClick={(e) => {
            if (event.organizerId?._id) {
              e.stopPropagation();
              navigate(`/participant/organizers/${event.organizerId._id}`);
            }
          }}
          sx={{
            fontStyle: 'italic',
            color: event.organizerId?._id ? '#6B9BC3' : 'text.secondary',
            marginBottom: '1rem',
            fontFamily: '"Karla", sans-serif',
            cursor: event.organizerId?._id ? 'pointer' : 'default',
            '&:hover': {
              textDecoration: event.organizerId?._id ? 'underline' : 'none'
            }
          }}
        >
          hosted by {event.organizerId?.organizerName || 'Unknown Organizer'}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"Karla", sans-serif',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: '#2C2C2C',
            marginBottom: '1rem',
          }}
        >
          {event.description || 'No description available'}
        </Typography>

        {/* Bottom Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
          {/* Date */}
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"Karla", sans-serif',
              color: '#3D3D3D',
              fontSize: '0.875rem',
            }}
          >
            📅 {formatDate(event.eventStartDate)}
          </Typography>

          {/* Fee Badge */}
          <Chip
            label={event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
            size="small"
            sx={{
              backgroundColor: event.registrationFee === 0 ? '#6BA368' : '#E8C17C',
              border: '2px solid #3D3D3D',
              color: '#2C2C2C',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        {/* Registration Status */}
        {isDeadlinePassed() && (
          <Box sx={{ mt: 1.5 }}>
            <Chip
              label="Registration Closed"
              size="small"
              sx={{
                backgroundColor: '#C65D4F',
                border: '2px solid #3D3D3D',
                color: '#FFFFFF',
                fontFamily: '"Space Mono", monospace',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default EventCard;
