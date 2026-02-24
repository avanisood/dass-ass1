import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Close as CloseIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

// Ticket Modal Component
const TicketModal = ({ open, onClose, registration }) => {
  const ticketRef = useRef(null);

  // Handle download ticket as image
  const handleDownload = () => {
    if (!ticketRef.current) return;

    // Create canvas from ticket content
    const ticketElement = ticketRef.current;
    
    // Use html2canvas or similar library for production
    // For now, we'll use a simple approach
    alert('Download functionality requires html2canvas library. Ticket ID: ' + registration?.ticketId);
  };

  // Handle copy ticket ID
  const handleCopyTicketId = () => {
    navigator.clipboard.writeText(registration.ticketId);
    // You could add a toast notification here
  };

  if (!registration || !registration.eventId) return null;

  const event = registration.eventId;
  const participant = registration.participantId;

  // Format date
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

  // QR code data string
  const qrCodeData = `TICKET:${registration.ticketId}|EVENT:${event._id}|PARTICIPANT:${participant?._id}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: 'vintage-card',
      }}
    >
      {/* Window Header */}
      <div className="window-header" style={{ position: 'relative' }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Space Mono, monospace',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontSize: '1rem',
          }}
        >
          YOUR_TICKET.EXE
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#2C2C2C',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* Window Body */}
      <div className="window-body" style={{ padding: '2rem', position: 'relative' }} ref={ticketRef}>
        {/* Sparkle decorations */}
        <div className="sparkle" style={{ position: 'absolute', top: '10px', right: '20px', fontSize: '1.5rem' }}>✨</div>
        <div className="sparkle" style={{ position: 'absolute', top: '40px', left: '15px', fontSize: '1rem' }}>✨</div>

        {/* Event Info Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontFamily: 'DM Serif Display, serif',
              fontWeight: 400,
              color: '#2C2C2C',
              mb: 2,
            }}
          >
            {event.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <EventIcon sx={{ fontSize: '1.2rem', color: '#6B9BC3' }} />
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'Karla, sans-serif',
                color: '#3D3D3D',
              }}
            >
              {formatDateTime(event.eventStartDate)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocationOnIcon sx={{ fontSize: '1.2rem', color: '#6B9BC3' }} />
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'Karla, sans-serif',
                color: '#3D3D3D',
              }}
            >
              {event.venue || 'IIIT Hyderabad'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: '1.2rem', color: '#6B9BC3' }} />
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'Karla, sans-serif',
                color: '#3D3D3D',
              }}
            >
              Organizer: {event.organizerId?.organizerName || 'Unknown'}
            </Typography>
          </Box>
        </Box>

        {/* Divider */}
        <Divider sx={{ my: '2rem', borderColor: '#2C2C2C', borderWidth: '1px' }} />

        {/* Participant Info */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonIcon sx={{ fontSize: '1.2rem', color: '#E8C17C' }} />
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'Karla, sans-serif',
                color: '#2C2C2C',
                fontWeight: 600,
              }}
            >
              Participant: {participant?.firstName} {participant?.lastName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4 }}>
            <EmailIcon sx={{ fontSize: '1rem', color: '#E8C17C' }} />
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'Karla, sans-serif',
                color: '#3D3D3D',
              }}
            >
              {participant?.email}
            </Typography>
          </Box>
        </Box>

        {/* QR Code Section */}
        <Box sx={{ textAlign: 'center', mt: '2rem', mb: '2rem', position: 'relative' }}>
          {/* Small sun icon above QR */}
          <Box sx={{ mb: 1 }}>
            <span style={{ fontSize: '2rem' }}>☀️</span>
          </Box>

          {/* Sparkles around QR */}
          <div className="sparkle" style={{ position: 'absolute', top: '60px', left: '20%', fontSize: '1rem' }}>✨</div>
          <div className="sparkle" style={{ position: 'absolute', top: '60px', right: '20%', fontSize: '1rem' }}>✨</div>
          <div className="sparkle" style={{ position: 'absolute', bottom: '20px', left: '25%', fontSize: '0.8rem' }}>✨</div>
          <div className="sparkle" style={{ position: 'absolute', bottom: '20px', right: '25%', fontSize: '0.8rem' }}>✨</div>

          {/* QR Code in bordered box */}
          <Box
            sx={{
              display: 'inline-block',
              border: '3px solid #2C2C2C',
              padding: '1rem',
              backgroundColor: '#FFFFFF',
            }}
          >
            <QRCodeSVG
              value={qrCodeData}
              size={200}
              level="H"
              includeMargin={true}
            />
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 2,
              fontFamily: 'Karla, sans-serif',
              color: '#3D3D3D',
              fontStyle: 'italic',
            }}
          >
            Present this QR code at the event entrance
          </Typography>
        </Box>

        {/* Ticket ID */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'Space Mono, monospace',
              color: '#E8C17C',
              mb: 1,
              letterSpacing: '0.05em',
            }}
          >
            TICKET ID
          </Typography>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: '#F4D4A8',
              border: '2px solid #2C2C2C',
              padding: '1rem',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Space Mono, monospace',
                fontWeight: 700,
                fontSize: '1.2rem',
                letterSpacing: '0.1em',
                color: '#2C2C2C',
              }}
            >
              {registration.ticketId}
            </Typography>
            <IconButton
              size="small"
              onClick={handleCopyTicketId}
              sx={{
                color: '#2C2C2C',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' },
              }}
            >
              <CopyIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Dialog Actions */}
        <Box sx={{ mt: 3 }}>
          <Button
            fullWidth
            className="window-button window-button-gold"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ mb: 1.5 }}
          >
            Download Ticket
          </Button>

          <Button
            fullWidth
            className="window-button"
            onClick={onClose}
          >
            Close
          </Button>
        </Box>

        {/* Wave decoration at bottom */}
        <div className="wave-decoration" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </div>
    </Dialog>
  );
};

export default TicketModal;
