import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Divider,
} from '@mui/material';
import { Close as CloseIcon, NotificationsActive as NotificationIcon, Campaign as CampaignIcon } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const NotificationsPopup = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only fetch for participants who are logged in
        if (user && user.role === 'participant') {
            fetchUnreadAnnouncements();
        }
    }, [user]);

    const fetchUnreadAnnouncements = async () => {
        try {
            const response = await api.get('/messages/notifications/unread');
            if (response.data.success && response.data.count > 0) {
                setAnnouncements(response.data.announcements);
                setOpen(true);
            }
        } catch (error) {
            console.error('Failed to fetch unread announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async () => {
        setOpen(false);
        try {
            // Mark as read so they don't show up again
            await api.put('/messages/notifications/read');
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    const handleEventClick = (eventId) => {
        handleClose();
        navigate(`/events/${eventId}`);
    };

    if (!open || announcements.length === 0) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ className: 'window-box' }}
        >
            <div className="window-header" style={{ position: 'relative' }}>
                <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                    <NotificationIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#E8C17C' }} />
                    NEW_NOTIFICATIONS.EXE
                </Typography>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </div>
            <DialogContent sx={{ padding: '0', backgroundColor: '#F5F7FA' }}>
                <Box sx={{ p: 3, pb: 1 }}>
                    <Typography variant="h6" sx={{ fontFamily: '"DM Serif Display", serif', color: '#2C2C2C' }}>
                        You have {announcements.length} new announcement{announcements.length > 1 ? 's' : ''}!
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Karla", sans-serif', color: '#666', mt: 1 }}>
                        Organizers have posted updates for events you are registered for.
                    </Typography>
                </Box>

                <List sx={{ pt: 0, pb: 2 }}>
                    {announcements.map((announcement, index) => (
                        <React.Fragment key={announcement._id}>
                            {index > 0 && <Divider />}
                            <ListItem
                                alignItems="flex-start"
                                sx={{
                                    py: 2,
                                    px: 3,
                                    '&:hover': { backgroundColor: 'rgba(107, 155, 195, 0.05)' }
                                }}
                            >
                                <Box sx={{ mr: 2, mt: 0.5 }}>
                                    <CampaignIcon sx={{ color: '#E8C17C' }} />
                                </Box>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                                            <Typography
                                                component="span"
                                                variant="subtitle1"
                                                sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 600, color: '#3D3D3D' }}
                                            >
                                                {announcement.eventId?.name || 'Unknown Event'}
                                            </Typography>
                                            <Typography
                                                component="span"
                                                variant="caption"
                                                sx={{ fontFamily: '"Karla", sans-serif', color: '#888' }}
                                            >
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                sx={{
                                                    fontFamily: '"Karla", sans-serif',
                                                    color: '#2C2C2C',
                                                    whiteSpace: 'pre-wrap',
                                                    mb: 1
                                                }}
                                            >
                                                {announcement.content}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleEventClick(announcement.eventId?._id)}
                                                    sx={{
                                                        mt: 1,
                                                        fontFamily: '"Space Mono", monospace',
                                                        fontSize: '0.7rem',
                                                        borderColor: '#6B9BC3',
                                                        color: '#6B9BC3',
                                                        '&:hover': {
                                                            borderColor: '#3D3D3D',
                                                            color: '#3D3D3D'
                                                        }
                                                    }}
                                                >
                                                    View Event
                                                </Button>
                                            </Box>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            </DialogContent>
            <DialogActions sx={{ padding: '1.5rem', justifyContent: 'center', borderTop: '2px solid #3D3D3D', backgroundColor: '#FFFFFF' }}>
                <Button
                    className="window-button window-button-gold"
                    onClick={handleClose}
                    sx={{ px: 4 }}
                >
                    Mark all as read
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NotificationsPopup;
