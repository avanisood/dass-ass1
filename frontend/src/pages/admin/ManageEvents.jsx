import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Chip, CircularProgress,
    Alert, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, Select,
    MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
    Event as EventIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ManageEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            // Admin can see all events regardless of status
            const response = await api.get('/events');
            setEvents(response.data.events || []);
        } catch (err) {
            setError('Failed to load events');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const map = {
            draft: '#9E9E9E',
            published: '#6B9BC3',
            ongoing: '#E8C17C',
            completed: '#4CAF50',
            closed: '#F44336',
        };
        return map[status] || '#9E9E9E';
    };

    const filteredEvents = events.filter(event => {
        const q = search.toLowerCase();
        const matchesSearch = (event.name || '').toLowerCase().includes(q) ||
            (event.organizerId?.organizerName || '').toLowerCase().includes(q);
        const matchesStatus = !statusFilter || event.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <Container maxWidth="lg" sx={{ py: 4, position: 'relative' }}>
            <div className="sparkle" style={{ position: 'absolute', top: '20px', right: '100px', fontSize: '1.5rem' }}>✨</div>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography
                    variant="h4"
                    sx={{ fontFamily: 'DM Serif Display, serif', fontWeight: 400, color: '#2C2C2C' }}
                >
                    All Events
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'Space Mono, monospace', color: '#6B7280' }}>
                    {events.length} total events
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Filters */}
            <div className="window-box" style={{ marginBottom: '1.5rem' }}>
                <div className="window-header">
                    <Typography sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                        FILTERS.EXE
                    </Typography>
                </div>
                <div className="window-body" style={{ padding: '1.5rem' }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            label="Search by event name or organizer"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { fontFamily: 'Karla, sans-serif' } }}
                        />
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel sx={{ fontFamily: 'Karla, sans-serif' }}>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                label="Status"
                                sx={{ fontFamily: 'Karla, sans-serif' }}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="published">Published</MenuItem>
                                <MenuItem value="ongoing">Ongoing</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="closed">Closed</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </div>
            </div>

            {/* Events Table */}
            <div className="window-box">
                <div className="window-header">
                    <Typography sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.9rem' }}>
                        EVENTS.EXE
                    </Typography>
                </div>
                <div className="window-body" style={{ padding: 0 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredEvents.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <EventIcon sx={{ fontSize: 60, color: '#B8D8D8', mb: 2 }} />
                            <Typography sx={{ fontFamily: 'Karla, sans-serif', color: '#6B7280' }}>
                                {events.length === 0 ? 'No events in the system' : 'No events match your filters'}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#B8D8D8' }}>
                                        {['Event Name', 'Organizer', 'Type', 'Status', 'Registrations', 'Event Date', 'Fee'].map(header => (
                                            <TableCell
                                                key={header}
                                                sx={{
                                                    fontFamily: 'Space Mono, monospace',
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem',
                                                    textTransform: 'uppercase',
                                                    color: '#2C2C2C',
                                                    borderBottom: '3px solid #2C2C2C',
                                                }}
                                            >
                                                {header}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredEvents.map((event) => (
                                        <TableRow key={event._id} hover>
                                            <TableCell sx={{ fontFamily: 'Karla, sans-serif', fontWeight: 600, color: '#2C2C2C' }}>
                                                {event.name}
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D' }}>
                                                {event.organizerId?.organizerName || '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D' }}>
                                                {event.type === 'normal' ? '📄 Normal' : '🛍️ Merch'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={event.status?.toUpperCase()}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: getStatusColor(event.status),
                                                        color: 'white',
                                                        fontFamily: 'Space Mono, monospace',
                                                        fontWeight: 700,
                                                        fontSize: '0.65rem',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D' }}>
                                                {event.registrationCount || 0} / {event.registrationLimit}
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D', fontSize: '0.85rem' }}>
                                                {event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D' }}>
                                                {event.registrationFee ? `₹${event.registrationFee}` : 'Free'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </div>
            </div>

            <div className="wave-decoration" style={{ marginTop: '2rem' }} />
        </Container>
    );
};

export default ManageEvents;
