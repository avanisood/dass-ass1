import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import {
    Box, Typography, TextField, Button, IconButton, Chip, Badge,
    CircularProgress, Tooltip, Collapse,
} from '@mui/material';
import {
    Send as SendIcon,
    Reply as ReplyIcon,
    Delete as DeleteIcon,
    PushPin as PinIcon,
    Campaign as AnnouncementIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
} from '@mui/icons-material';

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🤔'];

const DiscussionForum = ({ eventId, isOrganizer = false, isRegistered = true }) => {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [expandedReplies, setExpandedReplies] = useState({});
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Connect socket
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !eventId) return;

        const socket = io('http://localhost:5000', {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            socket.emit('join_event', eventId);
        });

        socket.on('new_message', (message) => {
            setMessages(prev => {
                if (message.parentId) {
                    // It's a reply — add to parent's replies
                    return prev.map(m =>
                        m._id === message.parentId
                            ? { ...m, replies: [...(m.replies || []), message] }
                            : m
                    );
                }
                // Top-level message — add to top
                return [message, ...prev];
            });
            if (!isAtBottom) {
                setNewMessageCount(c => c + 1);
            }
        });

        socket.on('delete_message', ({ messageId, parentId }) => {
            setMessages(prev => {
                if (parentId) {
                    return prev.map(m =>
                        m._id === parentId
                            ? { ...m, replies: (m.replies || []).filter(r => r._id !== messageId) }
                            : m
                    );
                }
                return prev.filter(m => m._id !== messageId);
            });
        });

        socket.on('pin_message', ({ messageId, pinned }) => {
            setMessages(prev =>
                prev.map(m => m._id === messageId ? { ...m, pinned } : m)
            );
        });

        socket.on('reaction_update', ({ messageId, reactions }) => {
            setMessages(prev =>
                prev.map(m => {
                    if (m._id === messageId) return { ...m, reactions };
                    // Check replies
                    if (m.replies) {
                        return {
                            ...m,
                            replies: m.replies.map(r =>
                                r._id === messageId ? { ...r, reactions } : r
                            )
                        };
                    }
                    return m;
                })
            );
        });

        socket.on('user_typing', ({ userId, userName }) => {
            if (userId !== user?._id) {
                setTypingUsers(prev => {
                    if (prev.find(u => u.userId === userId)) return prev;
                    return [...prev, { userId, userName }];
                });
            }
        });

        socket.on('user_stop_typing', ({ userId }) => {
            setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        });

        socketRef.current = socket;

        return () => {
            socket.emit('leave_event', eventId);
            socket.disconnect();
        };
    }, [eventId, user?._id]);

    // Fetch initial messages
    useEffect(() => {
        fetchMessages();
    }, [eventId]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/events/${eventId}/messages`);
            setMessages(response.data.messages || []);
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle scroll detection
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const bottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
        setIsAtBottom(bottom);
        if (bottom) setNewMessageCount(0);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setNewMessageCount(0);
    };

    // Handle typing indicator
    const handleTyping = () => {
        if (socketRef.current) {
            socketRef.current.emit('typing', eventId);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current?.emit('stop_typing', eventId);
            }, 2000);
        }
    };

    // Send message
    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;
        setSending(true);

        try {
            await api.post(`/events/${eventId}/messages`, {
                content: newMessage.trim(),
                type: isAnnouncement ? 'announcement' : 'message',
                parentId: replyTo?._id || null
            });
            setNewMessage('');
            setReplyTo(null);
            setIsAnnouncement(false);
            socketRef.current?.emit('stop_typing', eventId);
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    // Delete message
    const handleDelete = async (messageId) => {
        try {
            await api.delete(`/messages/${messageId}`);
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    // Pin/unpin message
    const handlePin = async (messageId) => {
        try {
            await api.put(`/messages/${messageId}/pin`);
        } catch (err) {
            console.error('Failed to pin:', err);
        }
    };

    // Toggle reaction
    const handleReaction = async (messageId, emoji) => {
        try {
            await api.put(`/messages/${messageId}/react`, { emoji });
        } catch (err) {
            console.error('Failed to react:', err);
        }
    };

    // Toggle reply expansion
    const toggleReplies = (messageId) => {
        setExpandedReplies(prev => ({ ...prev, [messageId]: !prev[messageId] }));
    };

    // Format time
    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get user display name
    const getUserName = (u) => {
        if (!u) return 'Unknown';
        if (u.role === 'organizer') return u.organizerName || 'Organizer';
        return `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User';
    };

    // Render a single message
    const renderMessage = (msg, isReply = false) => {
        const isOwn = msg.userId?._id === user?._id;
        const isOrganizerMsg = msg.userId?.role === 'organizer';
        const isAnnouncementMsg = msg.type === 'announcement';
        const reactions = msg.reactions || {};

        return (
            <Box
                key={msg._id}
                sx={{
                    p: isReply ? 1.5 : 2,
                    ml: isReply ? 4 : 0,
                    mb: 1,
                    borderLeft: isAnnouncementMsg
                        ? '4px solid #E8C17C'
                        : isReply
                            ? '3px solid #B8D8D8'
                            : '3px solid transparent',
                    backgroundColor: isAnnouncementMsg
                        ? 'rgba(232, 193, 124, 0.08)'
                        : isReply
                            ? 'rgba(184, 216, 216, 0.06)'
                            : 'transparent',
                    borderBottom: isReply ? 'none' : '1px solid #E5E7EB',
                    transition: 'background-color 0.2s',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                }}
            >
                {/* Header: name + badge + time */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontFamily: 'Space Mono, monospace',
                            fontWeight: 700,
                            color: isOrganizerMsg ? '#6B9BC3' : '#2C2C2C',
                            fontSize: '0.8rem',
                        }}
                    >
                        {getUserName(msg.userId)}
                    </Typography>
                    {isOrganizerMsg && (
                        <Chip
                            label="ORGANIZER"
                            size="small"
                            sx={{
                                height: '18px',
                                fontSize: '0.55rem',
                                fontFamily: 'Space Mono, monospace',
                                fontWeight: 700,
                                backgroundColor: '#6B9BC3',
                                color: '#fff',
                            }}
                        />
                    )}
                    {isAnnouncementMsg && (
                        <Chip
                            label="📢 ANNOUNCEMENT"
                            size="small"
                            sx={{
                                height: '18px',
                                fontSize: '0.55rem',
                                fontFamily: 'Space Mono, monospace',
                                fontWeight: 700,
                                backgroundColor: '#E8C17C',
                                color: '#2C2C2C',
                            }}
                        />
                    )}
                    {msg.pinned && (
                        <PinIcon sx={{ fontSize: 14, color: '#E8C17C' }} />
                    )}
                    <Typography
                        variant="caption"
                        sx={{ fontFamily: 'Karla, sans-serif', color: '#9E9E9E', ml: 'auto' }}
                    >
                        {formatTime(msg.createdAt)}
                    </Typography>
                </Box>

                {/* Content */}
                <Typography
                    variant="body2"
                    sx={{
                        fontFamily: 'Karla, sans-serif',
                        color: '#2C2C2C',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                    }}
                >
                    {msg.content}
                </Typography>

                {/* Actions row: reactions + reply + pin + delete */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {/* Emoji reactions */}
                    {EMOJI_LIST.map(emoji => {
                        const reactUsers = reactions[emoji] || [];
                        const hasReacted = reactUsers.some(id => id === user?._id || id?.toString?.() === user?._id);
                        return (
                            <Tooltip key={emoji} title={`${reactUsers.length} reaction${reactUsers.length !== 1 ? 's' : ''}`} arrow>
                                <Button
                                    size="small"
                                    onClick={() => handleReaction(msg._id, emoji)}
                                    sx={{
                                        minWidth: 'auto',
                                        p: '2px 6px',
                                        fontSize: '0.75rem',
                                        borderRadius: '12px',
                                        border: hasReacted ? '2px solid #E8C17C' : '1px solid #E5E7EB',
                                        backgroundColor: hasReacted ? 'rgba(232, 193, 124, 0.1)' : 'transparent',
                                        '&:hover': { backgroundColor: 'rgba(232, 193, 124, 0.15)' },
                                    }}
                                >
                                    {emoji}{reactUsers.length > 0 && <span style={{ marginLeft: 2, fontFamily: 'Space Mono, monospace', fontSize: '0.65rem' }}>{reactUsers.length}</span>}
                                </Button>
                            </Tooltip>
                        );
                    })}

                    {/* Reply button (only for top-level messages) */}
                    {!isReply && (
                        <IconButton
                            size="small"
                            onClick={() => setReplyTo(msg)}
                            title="Reply"
                            sx={{ color: '#9E9E9E', '&:hover': { color: '#6B9BC3' } }}
                        >
                            <ReplyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    )}

                    {/* Pin button (organizer only, top-level only) */}
                    {isOrganizer && !isReply && (
                        <IconButton
                            size="small"
                            onClick={() => handlePin(msg._id)}
                            title={msg.pinned ? 'Unpin' : 'Pin'}
                            sx={{ color: msg.pinned ? '#E8C17C' : '#9E9E9E', '&:hover': { color: '#E8C17C' } }}
                        >
                            <PinIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    )}

                    {/* Delete button (author or organizer) */}
                    {(isOwn || isOrganizer) && (
                        <IconButton
                            size="small"
                            onClick={() => handleDelete(msg._id)}
                            title="Delete"
                            sx={{ color: '#9E9E9E', '&:hover': { color: '#C65D4F' } }}
                        >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    )}
                </Box>

                {/* Replies section */}
                {!isReply && msg.replies && msg.replies.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                        <Button
                            size="small"
                            onClick={() => toggleReplies(msg._id)}
                            startIcon={expandedReplies[msg._id] ? <CollapseIcon /> : <ExpandIcon />}
                            sx={{
                                fontFamily: 'Space Mono, monospace',
                                fontSize: '0.7rem',
                                color: '#6B9BC3',
                                textTransform: 'none',
                            }}
                        >
                            {msg.replies.length} repl{msg.replies.length === 1 ? 'y' : 'ies'}
                        </Button>
                        <Collapse in={expandedReplies[msg._id]}>
                            {msg.replies.map(reply => renderMessage(reply, true))}
                        </Collapse>
                    </Box>
                )}
            </Box>
        );
    };

    // Separate pinned messages
    const pinnedMessages = messages.filter(m => m.pinned);
    const regularMessages = messages.filter(m => !m.pinned);

    return (
        <div className="window-box" style={{ marginTop: '2rem' }}>
            <div className="window-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                    sx={{
                        fontFamily: 'Space Mono, monospace',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        letterSpacing: '0.05em',
                    }}
                >
                    💬 DISCUSSION_FORUM.EXE
                </Typography>
                <Typography
                    variant="caption"
                    sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D' }}
                >
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                </Typography>
            </div>

            <div className="window-body" style={{ padding: 0 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <>
                        {/* Pinned Messages */}
                        {pinnedMessages.length > 0 && (
                            <Box sx={{ borderBottom: '2px solid #E8C17C', backgroundColor: 'rgba(232, 193, 124, 0.05)' }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontFamily: 'Space Mono, monospace',
                                        fontWeight: 700,
                                        color: '#E8C17C',
                                        px: 2,
                                        pt: 1,
                                        display: 'block',
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    📌 PINNED MESSAGES
                                </Typography>
                                {pinnedMessages.map(msg => renderMessage(msg))}
                            </Box>
                        )}

                        {/* Messages List */}
                        <Box
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            sx={{
                                maxHeight: '500px',
                                overflowY: 'auto',
                                '&::-webkit-scrollbar': { width: '6px' },
                                '&::-webkit-scrollbar-track': { background: '#f0f0f0' },
                                '&::-webkit-scrollbar-thumb': { background: '#E8C17C', borderRadius: '4px' },
                            }}
                        >
                            {regularMessages.length === 0 && pinnedMessages.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <span style={{ fontSize: '2.5rem', display: 'block', mb: 8 }}>💬</span>
                                    <Typography sx={{ fontFamily: 'Karla, sans-serif', color: '#9E9E9E' }}>
                                        No messages yet. Start the conversation!
                                    </Typography>
                                </Box>
                            ) : (
                                regularMessages.map(msg => renderMessage(msg))
                            )}
                            <div ref={messagesEndRef} />
                        </Box>

                        {/* New messages indicator */}
                        {newMessageCount > 0 && (
                            <Box sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #E5E7EB' }}>
                                <Button
                                    size="small"
                                    onClick={scrollToBottom}
                                    sx={{
                                        fontFamily: 'Space Mono, monospace',
                                        fontSize: '0.7rem',
                                        color: '#6B9BC3',
                                        textTransform: 'none',
                                    }}
                                >
                                    ↓ {newMessageCount} new message{newMessageCount !== 1 ? 's' : ''}
                                </Button>
                            </Box>
                        )}

                        {/* Typing indicator */}
                        {typingUsers.length > 0 && (
                            <Box sx={{ px: 2, py: 0.5, borderTop: '1px solid #E5E7EB' }}>
                                <Typography
                                    variant="caption"
                                    sx={{ fontFamily: 'Karla, sans-serif', color: '#9E9E9E', fontStyle: 'italic' }}
                                >
                                    {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                </Typography>
                            </Box>
                        )}

                        {/* Reply indicator */}
                        {replyTo && (
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1,
                                    borderTop: '2px solid #B8D8D8',
                                    backgroundColor: 'rgba(184, 216, 216, 0.1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="caption" sx={{ fontFamily: 'Karla, sans-serif', color: '#6B9BC3' }}>
                                    ↩ Replying to <strong>{getUserName(replyTo.userId)}</strong>: {replyTo.content.substring(0, 60)}...
                                </Typography>
                                <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ color: '#9E9E9E' }}>
                                    ✕
                                </IconButton>
                            </Box>
                        )}

                        {/* Input area */}
                        {(isOrganizer || isRegistered) ? (
                            <Box
                                sx={{
                                    p: 2,
                                    borderTop: '3px solid #2C2C2C',
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'flex-end',
                                }}
                            >
                                {/* Announcement toggle (organizer only) */}
                                {isOrganizer && (
                                    <Tooltip title={isAnnouncement ? 'Switch to normal message' : 'Post as announcement'} arrow>
                                        <IconButton
                                            size="small"
                                            onClick={() => setIsAnnouncement(!isAnnouncement)}
                                            sx={{
                                                color: isAnnouncement ? '#E8C17C' : '#9E9E9E',
                                                border: isAnnouncement ? '2px solid #E8C17C' : '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                p: 0.75,
                                            }}
                                        >
                                            <AnnouncementIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Tooltip>
                                )}

                                <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    maxRows={4}
                                    placeholder={
                                        isAnnouncement
                                            ? 'Post an announcement...'
                                            : replyTo
                                                ? 'Write a reply...'
                                                : 'Type a message...'
                                    }
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            fontFamily: 'Karla, sans-serif',
                                            fontSize: '0.9rem',
                                            borderRadius: '8px',
                                        },
                                    }}
                                />
                                <IconButton
                                    onClick={handleSend}
                                    disabled={!newMessage.trim() || sending}
                                    sx={{
                                        backgroundColor: '#E8C17C',
                                        color: '#2C2C2C',
                                        borderRadius: '8px',
                                        p: 1,
                                        '&:hover': { backgroundColor: '#d4a656' },
                                        '&:disabled': { backgroundColor: '#E5E7EB', color: '#9E9E9E' },
                                    }}
                                >
                                    <SendIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    p: 2,
                                    borderTop: '3px solid #2C2C2C',
                                    textAlign: 'center',
                                    backgroundColor: 'rgba(232, 193, 124, 0.05)',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: 'Karla, sans-serif',
                                        color: '#9E9E9E',
                                    }}
                                >
                                    🔒 Register for this event to join the discussion
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DiscussionForum;
