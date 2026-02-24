import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton,
  Chip
} from '@mui/material';
import {
  QrCodeScanner as ScanIcon,
  Stop as StopIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

/**
 * QR Scanner Page for Organizers
 * Allows scanning participant QR codes to mark attendance
 */
const QRScanner = () => {
  const navigate = useNavigate();

  // State for scanner
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);

  // State for manual input
  const [manualTicketId, setManualTicketId] = useState('');

  // State for scan results
  const [message, setMessage] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  // State for loading
  const [processing, setProcessing] = useState(false);

  // State for current event
  const [currentEventId, setCurrentEventId] = useState(null);

  // Initialize scanner on mount
  useEffect(() => {
    return () => {
      // Cleanup: stop scanner when component unmounts
      if (scanner) {
        scanner.clear().catch(err => console.error('Error clearing scanner:', err));
      }
    };
  }, [scanner]);

  /**
   * Start QR code scanning using html5-qrcode library
   */
  const startScanning = () => {
    // Create scanner instance
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader", // ID of the div element where scanner will be rendered
      {
        fps: 10, // Frames per second for scanning
        qrbox: 250, // Size of the scanning box
        aspectRatio: 1.0 // Square aspect ratio
      },
      false // verbose mode off
    );

    // Handle successful QR code scan
    const onScanSuccess = (decodedText, decodedResult) => {
      console.log(`QR Code scanned: ${decodedText}`);

      // Extract ticket ID from QR code data
      // Expected format: "EVENT:{eventId}|PARTICIPANT:{participantId}|TICKET:{ticketId}"
      const ticketId = extractTicketId(decodedText);

      if (ticketId) {
        // Stop scanning temporarily while processing
        html5QrcodeScanner.clear();
        setScanning(false);

        // Mark attendance
        markAttendance(ticketId);
      } else {
        setMessage({
          type: 'error',
          text: 'Invalid QR code format'
        });
      }
    };

    // Handle scan errors (can be ignored for most cases)
    const onScanError = (errorMessage) => {
      // Don't show errors for every failed scan attempt
      // Only log to console
      // console.log('Scan error:', errorMessage);
    };

    // Render the scanner
    html5QrcodeScanner.render(onScanSuccess, onScanError);

    setScanner(html5QrcodeScanner);
    setScanning(true);
    setMessage(null);
  };

  /**
   * Stop QR code scanning
   */
  const stopScanning = () => {
    if (scanner) {
      scanner.clear().then(() => {
        setScanning(false);
        setScanner(null);
      }).catch(err => {
        console.error('Error stopping scanner:', err);
      });
    }
  };

  /**
   * Extract ticket ID from QR code data string
   */
  const extractTicketId = (qrData) => {
    // Format: "EVENT:{eventId}|PARTICIPANT:{participantId}|TICKET:{ticketId}"
    const parts = qrData.split('|');
    const ticketPart = parts.find(part => part.startsWith('TICKET:'));

    if (ticketPart) {
      return ticketPart.replace('TICKET:', '');
    }

    // If not in expected format, assume the entire string is the ticket ID
    return qrData;
  };

  /**
   * Mark attendance for a ticket ID
   */
  const markAttendance = async (ticketId) => {
    setProcessing(true);
    setMessage(null);

    try {
      // Call API to mark attendance
      const response = await api.post('/registrations/attendance/mark', { ticketId });

      // Success - show participant info
      const { participant } = response.data;
      if (participant.eventId) setCurrentEventId(participant.eventId);

      setMessage({
        type: 'success',
        text: `Attendance marked for ${participant.name}`,
        participant: participant,
        timestamp: participant.attendanceTime
      });

      // Add to recent scans list
      addToRecentScans({
        ticketId,
        participantName: participant.name,
        email: participant.email,
        timestamp: new Date(participant.attendanceTime).toLocaleTimeString(),
        status: 'success'
      });

      // Clear manual input if used
      setManualTicketId('');

    } catch (error) {
      console.error('Error marking attendance:', error);

      // Check for specific error messages
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';

      if (errorMessage.includes('already marked')) {
        setMessage({
          type: 'warning',
          text: 'Attendance already marked for this ticket'
        });
        if (error.response?.data?.details?.eventId) {
          setCurrentEventId(error.response.data.details.eventId);
        }
      } else if (errorMessage.includes('not found')) {
        setMessage({
          type: 'error',
          text: 'Invalid ticket ID'
        });
      } else if (errorMessage.includes('not belong')) {
        setMessage({
          type: 'error',
          text: 'This ticket does not belong to your event'
        });
      } else {
        setMessage({
          type: 'error',
          text: errorMessage
        });
      }

      // Add to recent scans as failed
      addToRecentScans({
        ticketId,
        participantName: 'Unknown',
        email: '',
        timestamp: new Date().toLocaleTimeString(),
        status: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Add scan result to recent scans list (max 10)
   */
  const addToRecentScans = (scan) => {
    setRecentScans(prev => {
      const updated = [scan, ...prev];
      return updated.slice(0, 10); // Keep only last 10 scans
    });
  };

  /**
   * Handle manual ticket ID submission
   */
  const handleManualSubmit = (e) => {
    e.preventDefault();

    if (manualTicketId.trim()) {
      markAttendance(manualTicketId.trim());
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          QR Code Scanner
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DashboardIcon />}
          onClick={() => navigate(`/organizer/attendance/${currentEventId}`)}
          disabled={!currentEventId}
          title={!currentEventId ? "Scan a ticket first to view the event's dashboard" : "View Attendance Dashboard"}
        >
          View Attendance Dashboard
        </Button>
      </Box>

      {/* Scanner Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Scan Participant QR Code
        </Typography>

        {/* Start/Stop Scanner Buttons */}
        <Box sx={{ mb: 2 }}>
          {!scanning ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ScanIcon />}
              onClick={startScanning}
              fullWidth
            >
              Start Scanning
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={stopScanning}
              fullWidth
            >
              Stop Scanning
            </Button>
          )}
        </Box>

        {/* QR Scanner Display Area */}
        <Box id="qr-reader" sx={{ width: '100%', mb: 2 }}></Box>

        {/* Message Display */}
        {message && (
          <Alert
            severity={message.type}
            sx={{ mb: 2 }}
            icon={message.type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
          >
            <Typography variant="body1">{message.text}</Typography>
            {message.participant && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">Email: {message.participant.email}</Typography>
                <Typography variant="body2">Time: {new Date(message.timestamp).toLocaleString()}</Typography>
              </Box>
            )}
          </Alert>
        )}

        {/* Processing Indicator */}
        {processing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Processing...</Typography>
          </Box>
        )}
      </Paper>

      {/* Manual Input Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manual Ticket Entry
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Enter ticket ID manually if camera scanning fails
        </Typography>

        <form onSubmit={handleManualSubmit}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Ticket ID"
              value={manualTicketId}
              onChange={(e) => setManualTicketId(e.target.value)}
              placeholder="Enter ticket ID..."
              disabled={processing}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!manualTicketId.trim() || processing}
            >
              Submit
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Scans (Last 10)
          </Typography>
          <List>
            {recentScans.map((scan, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{scan.participantName}</Typography>
                        <Chip
                          label={scan.status === 'success' ? 'Success' : 'Failed'}
                          color={scan.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          Ticket: {scan.ticketId}
                        </Typography>
                        {scan.email && (
                          <>
                            <br />
                            <Typography variant="body2" component="span">
                              Email: {scan.email}
                            </Typography>
                          </>
                        )}
                        <br />
                        <Typography variant="body2" component="span" color="text.secondary">
                          Time: {scan.timestamp}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < recentScans.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default QRScanner;
