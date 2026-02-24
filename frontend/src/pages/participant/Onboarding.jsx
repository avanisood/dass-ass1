import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Chip,
    Grid,
    Card,
    CardContent,
    Avatar,
    CircularProgress
} from '@mui/material';
import {
    Check as CheckIcon,
    ArrowForward as ArrowForwardIcon,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

// Categories that match organizer club categories
const CATEGORY_LIST = [
    'Cultural', 'Technical', 'Sports', 'Literary', 'Arts', 'Other'
];

const Onboarding = () => {
    const { user, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [followedOrganizers, setFollowedOrganizers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingOrganizers, setFetchingOrganizers] = useState(false);

    useEffect(() => {
        // If user has already completed onboarding, redirect to dashboard
        if (user?.onboardingCompleted) {
            navigate('/participant/dashboard');
        }
    }, [user, navigate]);

    // When moving to step 2, fetch organizers filtered by selected categories
    useEffect(() => {
        if (step === 2) {
            fetchOrganizers();
        }
    }, [step]);

    const fetchOrganizers = async () => {
        try {
            setFetchingOrganizers(true);
            const response = await api.get('/users/organizers');
            if (response.data.success) {
                let allOrganizers = response.data.organizers || [];
                // Filter organizers by selected interest categories
                if (selectedInterests.length > 0) {
                    const matched = allOrganizers.filter(org =>
                        selectedInterests.some(interest =>
                            interest.toLowerCase() === (org.category || '').toLowerCase()
                        )
                    );
                    // Show matched organizers first, then others
                    const unmatched = allOrganizers.filter(org =>
                        !selectedInterests.some(interest =>
                            interest.toLowerCase() === (org.category || '').toLowerCase()
                        )
                    );
                    setOrganizers([...matched, ...unmatched]);
                } else {
                    setOrganizers(allOrganizers);
                }
            }
        } catch (error) {
            console.error('Error fetching organizers:', error);
        } finally {
            setFetchingOrganizers(false);
        }
    };

    const toggleInterest = (interest) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(prev => prev.filter(i => i !== interest));
        } else {
            setSelectedInterests(prev => [...prev, interest]);
        }
    };

    const toggleFollow = (organizerId) => {
        if (followedOrganizers.includes(organizerId)) {
            setFollowedOrganizers(prev => prev.filter(id => id !== organizerId));
        } else {
            setFollowedOrganizers(prev => [...prev, organizerId]);
        }
    };

    const handleNext = () => {
        setStep(step + 1);
    };

    const handleFinish = async () => {
        try {
            setLoading(true);
            const response = await api.post('/auth/onboarding', {
                interests: selectedInterests,
                followedOrganizers: followedOrganizers
            });

            if (response.data.success) {
                updateUser(response.data.user);
                navigate('/participant/dashboard');
            }
        } catch (error) {
            console.error('Onboarding error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        handleFinish();
    };

    return (
        <Container maxWidth="md" sx={{ py: 8, minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="window-box">
                <div className="window-header">
                    <Typography variant="h6" sx={{ fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>
                        SETUP_WIZARD.EXE
                    </Typography>
                </div>

                <div className="window-body" style={{ padding: '3rem' }}>
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontFamily: 'DM Serif Display, serif', mb: 1 }}>
                            {step === 1 ? 'What interests you?' : 'Clubs to follow'}
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'Karla, sans-serif', color: '#3D3D3D' }}>
                            {step === 1
                                ? 'Select the categories you\'re interested in to get club and event recommendations.'
                                : 'Follow clubs in your selected categories to stay updated with their events.'}
                        </Typography>
                    </Box>

                    {step === 1 ? (
                        // Step 1: Category Interests
                        <Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mb: 6 }}>
                                {CATEGORY_LIST.map((category) => (
                                    <Chip
                                        key={category}
                                        label={category}
                                        onClick={() => toggleInterest(category)}
                                        icon={selectedInterests.includes(category) ? <CheckIcon /> : undefined}
                                        sx={{
                                            fontFamily: 'Karla, sans-serif',
                                            fontSize: '1rem',
                                            padding: '8px 12px',
                                            backgroundColor: selectedInterests.includes(category) ? '#E8C17C' : 'transparent',
                                            borderColor: '#E8C17C',
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            color: selectedInterests.includes(category) ? '#2C2C2C' : '#3D3D3D',
                                            fontWeight: selectedInterests.includes(category) ? 700 : 400,
                                            '&:hover': {
                                                backgroundColor: selectedInterests.includes(category) ? '#d4af6e' : 'rgba(232, 193, 124, 0.15)',
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    onClick={handleNext}
                                    className="window-button window-button-gold"
                                    endIcon={<ArrowForwardIcon />}
                                    size="large"
                                >
                                    Next
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        // Step 2: Organizers filtered by selected categories
                        <Box>
                            {selectedInterests.length > 0 && (
                                <Box sx={{ mb: 2, textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ fontFamily: 'Karla, sans-serif', color: '#6B7280' }}>
                                        Showing clubs in: {selectedInterests.join(', ')}
                                    </Typography>
                                </Box>
                            )}

                            {fetchingOrganizers ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress sx={{ color: '#E8C17C' }} />
                                </Box>
                            ) : (
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    {organizers.length > 0 ? organizers.map((org) => {
                                        const isMatched = selectedInterests.some(
                                            interest => interest.toLowerCase() === (org.category || '').toLowerCase()
                                        );
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={org._id}>
                                                <Card sx={{
                                                    border: followedOrganizers.includes(org._id)
                                                        ? '2px solid #E8C17C'
                                                        : isMatched
                                                            ? '2px solid #6B9BC3'
                                                            : '2px solid #E0E0E0',
                                                    boxShadow: 'none',
                                                    transition: 'all 0.3s',
                                                    backgroundColor: isMatched ? 'rgba(107, 155, 195, 0.05)' : '#fff'
                                                }}>
                                                    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                                        <Avatar sx={{ bgcolor: '#E8C17C', color: '#2C2C2C', width: 56, height: 56, mb: 1 }}>
                                                            {(org.organizerName || '?').charAt(0)}
                                                        </Avatar>
                                                        <Typography variant="h6" sx={{ fontFamily: 'Space Mono, monospace', fontSize: '0.9rem', mb: 0.5, color: '#2C2C2C' }}>
                                                            {org.organizerName}
                                                        </Typography>
                                                        <Chip
                                                            label={org.category || 'Other'}
                                                            size="small"
                                                            sx={{
                                                                fontFamily: 'Karla, sans-serif',
                                                                fontSize: '0.75rem',
                                                                mb: 1.5,
                                                                backgroundColor: isMatched ? '#6B9BC3' : '#E0E0E0',
                                                                color: isMatched ? '#fff' : '#3D3D3D',
                                                            }}
                                                        />
                                                        <Button
                                                            size="small"
                                                            variant={followedOrganizers.includes(org._id) ? "contained" : "outlined"}
                                                            startIcon={followedOrganizers.includes(org._id) ? <CheckIcon /> : <PersonAddIcon />}
                                                            onClick={() => toggleFollow(org._id)}
                                                            sx={{
                                                                borderColor: '#E8C17C',
                                                                color: followedOrganizers.includes(org._id) ? '#2C2C2C' : '#E8C17C',
                                                                bgcolor: followedOrganizers.includes(org._id) ? '#E8C17C' : 'transparent',
                                                                fontFamily: 'Karla, sans-serif',
                                                                '&:hover': {
                                                                    bgcolor: followedOrganizers.includes(org._id) ? '#d4af6e' : 'rgba(232, 193, 124, 0.1)',
                                                                    borderColor: '#E8C17C'
                                                                }
                                                            }}
                                                        >
                                                            {followedOrganizers.includes(org._id) ? 'Following' : 'Follow'}
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    }) : (
                                        <Grid item xs={12}>
                                            <Typography sx={{ width: '100%', textAlign: 'center', color: '#6B7280', fontFamily: 'Karla, sans-serif' }}>
                                                No clubs found yet. You can always follow clubs later from the Browse Events page.
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button onClick={handleSkip} sx={{ color: '#6B7280', fontFamily: 'Karla, sans-serif' }}>
                                    Skip for now
                                </Button>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button onClick={() => setStep(1)} className="window-button">
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleFinish}
                                        className="window-button window-button-gold"
                                        disabled={loading}
                                        size="large"
                                    >
                                        {loading ? 'Finishing...' : 'Finish'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </div>
            </div>
        </Container>
    );
};

export default Onboarding;
