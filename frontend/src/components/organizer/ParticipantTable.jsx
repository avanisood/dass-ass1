import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  Button,
  Chip,
  Box,
  Typography
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

/**
 * Participant Table Component
 * Displays list of event participants with search, pagination, and CSV export
 */
const ParticipantTable = ({ participants = [] }) => {
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter participants based on search query
  const filteredParticipants = participants.filter((participant) => {
    const query = searchQuery.toLowerCase();
    const name = `${participant.firstName || ''} ${participant.lastName || ''}`.toLowerCase();
    const email = (participant.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  // Get paginated data
  const paginatedParticipants = filteredParticipants.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Export data to CSV
  const handleExportCSV = () => {
    // Create CSV header
    const headers = ['Name', 'Email', 'Registration Date', 'Payment Status', 'Attendance'];
    
    // Create CSV rows
    const rows = filteredParticipants.map(participant => [
      `${participant.firstName || ''} ${participant.lastName || ''}`,
      participant.email || '',
      formatDate(participant.registrationDate),
      participant.paymentStatus || 'N/A',
      participant.attended ? 'Yes' : 'No'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `participants-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Empty state
  if (participants.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No participants yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Participants will appear here once they register for this event
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Search and Export Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          label="Search participants"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0); // Reset to first page on search
          }}
          size="small"
        />
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          disabled={filteredParticipants.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Showing {filteredParticipants.length} of {participants.length} participants
      </Typography>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Registration Date</strong></TableCell>
              <TableCell><strong>Payment Status</strong></TableCell>
              <TableCell align="center"><strong>Attendance</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No participants found matching your search
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedParticipants.map((participant, index) => (
                <TableRow
                  key={participant._id || index}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {/* Name Column */}
                  <TableCell>
                    {participant.firstName} {participant.lastName}
                  </TableCell>

                  {/* Email Column */}
                  <TableCell>{participant.email}</TableCell>

                  {/* Registration Date Column */}
                  <TableCell>{formatDate(participant.registrationDate)}</TableCell>

                  {/* Payment Status Column with colored chip */}
                  <TableCell>
                    <Chip
                      label={participant.paymentStatus || 'Pending'}
                      color={participant.paymentStatus === 'paid' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>

                  {/* Attendance Column with icon */}
                  <TableCell align="center">
                    {participant.attended ? (
                      <CheckIcon color="success" titleAccess="Attended" />
                    ) : (
                      <CancelIcon color="error" titleAccess="Not Attended" />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredParticipants.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
};

export default ParticipantTable;
