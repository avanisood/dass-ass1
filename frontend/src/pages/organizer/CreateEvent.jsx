import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Chip,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Remove as RemoveIcon } from '@mui/icons-material';
import api from '../../services/api';
import FormBuilder from '../../components/organizer/FormBuilder';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'normal',
    eligibility: 'Open to All',
    registrationDeadline: '',
    eventStartDate: '',
    eventEndDate: '',
    registrationLimit: 100,
    registrationFee: 0,
    tags: [],
    customForm: [],
    itemDetails: {
      variants: [],
      purchaseLimit: 1,
      pricePerItem: 0,
      lastDayOfSale: ''
    }
  });

  // State for tag input
  const [tagInput, setTagInput] = useState('');

  // State for merchandise variants
  const [variantInput, setVariantInput] = useState({
    size: '',
    color: '',
    stock: 0
  });

  // Handle basic field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Handle tag deletion
  const handleDeleteTag = (tagToDelete) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete)
    }));
  };

  // Handle variant addition (for merchandise)
  const handleAddVariant = () => {
    if (variantInput.size && variantInput.color && variantInput.stock > 0) {
      setFormData(prev => ({
        ...prev,
        itemDetails: {
          ...prev.itemDetails,
          variants: [...prev.itemDetails.variants, { ...variantInput }]
        }
      }));
      setVariantInput({ size: '', color: '', stock: 0 });
    }
  };

  // Handle variant deletion
  const handleDeleteVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      itemDetails: {
        ...prev.itemDetails,
        variants: prev.itemDetails.variants.filter((_, i) => i !== index)
      }
    }));
  };

  // Handle custom form field addition (for normal events)
  const handleAddFormField = () => {
    setFormData(prev => ({
      ...prev,
      customForm: [
        ...prev.customForm,
        {
          id: Date.now(),
          fieldType: 'text',
          label: '',
          required: false,
          options: []
        }
      ]
    }));
  };

  // Handle custom form field change
  const handleFormFieldChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      customForm: prev.customForm.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Handle custom form field deletion
  const handleDeleteFormField = (index) => {
    setFormData(prev => ({
      ...prev,
      customForm: prev.customForm.filter((_, i) => i !== index)
    }));
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Event name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Event description is required');
      return false;
    }
    if (formData.type === 'normal') {
      if (!formData.registrationDeadline) {
        setError('Registration deadline is required');
        return false;
      }
      if (!formData.eventStartDate) {
        setError('Event start date is required');
        return false;
      }
      if (!formData.eventEndDate) {
        setError('Event end date is required');
        return false;
      }
      if (new Date(formData.eventEndDate) < new Date(formData.eventStartDate)) {
        setError('Event end date must be after start date');
        return false;
      }
      if (new Date(formData.registrationDeadline) > new Date(formData.eventStartDate)) {
        setError('Registration deadline must be before event start date');
        return false;
      }
    }
    if (formData.type === 'merchandise') {
      if (formData.itemDetails.variants.length === 0) {
        setError('Please add at least one variant for merchandise event');
        return false;
      }
      if (!formData.itemDetails.lastDayOfSale) {
        setError('Last day of sale is required for merchandise events');
        return false;
      }
    }
    return true;
  };

  // Handle submit (Save as Draft or Publish)
  const handleSubmit = async (status) => {
    setError('');
    setSuccess('');

    if (status === 'published' && !validateForm()) {
      return;
    }

    // Always validate description
    if (!formData.description.trim()) {
      setError('Event description is required');
      return;
    }

    setLoading(true);

    try {
      // Strip temporary 'id' from custom form fields
      const processedCustomForm = formData.type === 'normal'
        ? formData.customForm.map(({ id, ...rest }) => rest)
        : [];

      const eventData = {
        ...formData,
        status,
        customForm: processedCustomForm,
        // Remove itemDetails if not merchandise
        itemDetails: formData.type === 'merchandise' ? formData.itemDetails : undefined,
        // For merchandise, use lastDayOfSale as the registration deadline
        registrationDeadline: formData.type === 'merchandise'
          ? formData.itemDetails.lastDayOfSale
          : formData.registrationDeadline,
        // For merchandise, set event dates to lastDayOfSale if not provided
        eventStartDate: formData.type === 'merchandise'
          ? (formData.eventStartDate || formData.itemDetails.lastDayOfSale)
          : formData.eventStartDate,
        eventEndDate: formData.type === 'merchandise'
          ? (formData.eventEndDate || formData.itemDetails.lastDayOfSale)
          : formData.eventEndDate,
        // For merchandise, use pricePerItem as registration fee
        registrationFee: formData.type === 'merchandise'
          ? formData.itemDetails.pricePerItem
          : formData.registrationFee
      };

      const response = await api.post('/events', eventData);

      setSuccess(
        status === 'published'
          ? 'Event published successfully!'
          : 'Event saved as draft!'
      );

      // Redirect to organizer dashboard after 2 seconds
      setTimeout(() => {
        navigate('/organizer/dashboard');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create event. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, position: 'relative' }}>
      {/* Sparkle decorations */}
      <div className="sparkle" style={{ position: 'absolute', top: '20px', right: '50px', fontSize: '1.5rem' }}>✨</div>
      <div className="sparkle" style={{ position: 'absolute', top: '100px', left: '30px', fontSize: '1rem' }}>✨</div>
      <div className="sparkle" style={{ position: 'absolute', top: '300px', right: '30px', fontSize: '1.2rem' }}>✨</div>

      {/* Main Window */}
      <div className="window-box">
        {/* Window Header */}
        <div className="window-header">
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'Space Mono, monospace',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontSize: '1rem',
            }}
          >
            CREATE_EVENT.EXE
          </Typography>
          <div className="window-controls">○○</div>
        </div>

        {/* Form Container */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit('published'); }}>
          <div className="window-body" style={{ padding: '3rem' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            {/* Section 1: Basic Information */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontFamily: 'Space Mono, monospace',
                  fontWeight: 700,
                  color: '#2C2C2C',
                  mb: 2,
                }}
              >
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3, borderColor: '#2C2C2C', borderWidth: '1px' }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Event Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Karla, sans-serif',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Karla, sans-serif',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <FormLabel
                      component="legend"
                      sx={{
                        fontFamily: 'Karla, sans-serif',
                        fontWeight: 600,
                        color: '#2C2C2C',
                        mb: 1,
                      }}
                    >
                      Event Type
                    </FormLabel>
                    <RadioGroup
                      row
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                    >
                      <FormControlLabel
                        value="normal"
                        control={
                          <Radio
                            sx={{
                              '&.Mui-checked': {
                                color: '#6B9BC3',
                              },
                            }}
                          />
                        }
                        label={
                          <Box
                            sx={{
                              border: formData.type === 'normal' ? '2px solid #6B9BC3' : '2px solid #9E9E9E',
                              padding: '0.5rem 1rem',
                              borderRadius: '4px',
                              fontFamily: 'Karla, sans-serif',
                              backgroundColor: formData.type === 'normal' ? 'rgba(107, 155, 195, 0.1)' : 'transparent',
                            }}
                          >
                            Normal Event
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="merchandise"
                        control={
                          <Radio
                            sx={{
                              '&.Mui-checked': {
                                color: '#E8C17C',
                              },
                            }}
                          />
                        }
                        label={
                          <Box
                            sx={{
                              border: formData.type === 'merchandise' ? '2px solid #E8C17C' : '2px solid #9E9E9E',
                              padding: '0.5rem 1rem',
                              borderRadius: '4px',
                              fontFamily: 'Karla, sans-serif',
                              backgroundColor: formData.type === 'merchandise' ? 'rgba(232, 193, 124, 0.1)' : 'transparent',
                            }}
                          >
                            Merchandise
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Eligibility"
                    name="eligibility"
                    value={formData.eligibility}
                    onChange={handleChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Karla, sans-serif',
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Section 2: Schedule (Normal events only) */}
            {formData.type === 'normal' && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{
                    fontFamily: 'Space Mono, monospace',
                    fontWeight: 700,
                    color: '#2C2C2C',
                    mb: 2,
                  }}
                >
                  Schedule
                </Typography>
                <Divider sx={{ mb: 3, borderColor: '#2C2C2C', borderWidth: '1px' }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Registration Deadline"
                      name="registrationDeadline"
                      type="datetime-local"
                      value={formData.registrationDeadline}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: 'Karla, sans-serif',
                          border: '2px solid #2C2C2C',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Event Start Date"
                      name="eventStartDate"
                      type="datetime-local"
                      value={formData.eventStartDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: 'Karla, sans-serif',
                          border: '2px solid #2C2C2C',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Event End Date"
                      name="eventEndDate"
                      type="datetime-local"
                      value={formData.eventEndDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: 'Karla, sans-serif',
                          border: '2px solid #2C2C2C',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Section 3: Capacity & Pricing (Normal events only) */}
            {formData.type === 'normal' && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{
                    fontFamily: 'Space Mono, monospace',
                    fontWeight: 700,
                    color: '#2C2C2C',
                    mb: 2,
                  }}
                >
                  Capacity & Pricing
                </Typography>
                <Divider sx={{ mb: 3, borderColor: '#2C2C2C', borderWidth: '1px' }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Registration Limit"
                      name="registrationLimit"
                      type="number"
                      value={formData.registrationLimit}
                      onChange={handleChange}
                      inputProps={{ min: 1 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: 'Karla, sans-serif',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Registration Fee (₹)"
                      name="registrationFee"
                      type="number"
                      value={formData.registrationFee}
                      onChange={handleChange}
                      inputProps={{ min: 0 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: 'Karla, sans-serif',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        fullWidth
                        label="Add Tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Press Enter to add"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontFamily: 'Karla, sans-serif',
                          },
                        }}
                      />
                      <Button
                        className="window-button"
                        onClick={handleAddTag}
                        startIcon={<AddIcon />}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {formData.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={() => handleDeleteTag(tag)}
                          sx={{
                            backgroundColor: '#6B9BC3',
                            color: 'white',
                            fontFamily: 'Karla, sans-serif',
                            border: '2px solid #2C2C2C',
                            '& .MuiChip-deleteIcon': {
                              color: 'white',
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Section 4: Type-Specific Fields */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontFamily: 'Space Mono, monospace',
                  fontWeight: 700,
                  color: '#2C2C2C',
                  mb: 2,
                }}
              >
                {formData.type === 'normal' ? 'Custom Registration Form' : 'Merchandise Details'}
              </Typography>
              <Divider sx={{ mb: 3, borderColor: '#2C2C2C', borderWidth: '1px' }} />

              {formData.type === 'merchandise' ? (
                // Merchandise Variants
                <Box>
                  <Typography variant="body2" sx={{ mb: 2, fontFamily: '"Karla", sans-serif', color: '#666' }}>
                    Add each specific combination of a merchandise item and size separately with its available stock.<br />
                    Example: Add "Variant Name: Red Shirt | Size: S | Stock: 10". Then click "Add Variant" again for "Red Shirt | Size: M | Stock: 15".
                  </Typography>
                  <Button
                    className="window-button"
                    startIcon={<AddIcon />}
                    onClick={handleAddVariant}
                    sx={{ mb: 2 }}
                  >
                    Add Variant
                  </Button>

                  {/* Variant Input */}
                  <Box sx={{ mb: 3, p: 2, border: '2px solid #2C2C2C', borderRadius: '4px' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Variant Name"
                          value={variantInput.color}
                          onChange={(e) =>
                            setVariantInput({ ...variantInput, color: e.target.value })
                          }
                          placeholder="e.g., Red Shirt, Blue Mug"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontFamily: 'Karla, sans-serif',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Size"
                          value={variantInput.size}
                          onChange={(e) =>
                            setVariantInput({ ...variantInput, size: e.target.value })
                          }
                          placeholder="e.g., S, M, L, or N/A"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontFamily: 'Karla, sans-serif',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Stock"
                          type="number"
                          value={variantInput.stock}
                          onChange={(e) =>
                            setVariantInput({
                              ...variantInput,
                              stock: parseInt(e.target.value) || 0
                            })
                          }
                          inputProps={{ min: 0 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontFamily: 'Karla, sans-serif',
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Display Added Variants */}
                  {formData.itemDetails.variants.map((variant, index) => (
                    <div key={index} className="window-box" style={{ marginBottom: '1rem' }}>
                      <div className="window-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          sx={{
                            fontFamily: 'Karla, sans-serif',
                            color: '#2C2C2C',
                          }}
                        >
                          Variant: <strong>{variant.color}</strong> | Size: <strong>{variant.size}</strong> | Stock: <strong>{variant.stock}</strong>
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteVariant(index)}
                          sx={{
                            color: '#D32F2F',
                            '&:hover': {
                              backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            },
                          }}
                        >
                          <RemoveIcon />
                        </IconButton>
                      </div>
                    </div>
                  ))}

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Price per Item (₹)"
                        type="number"
                        value={formData.itemDetails.pricePerItem}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            itemDetails: {
                              ...prev.itemDetails,
                              pricePerItem: parseInt(e.target.value) || 0
                            }
                          }))
                        }
                        inputProps={{ min: 0 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontFamily: 'Karla, sans-serif',
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Purchase Limit per Person"
                        type="number"
                        value={formData.itemDetails.purchaseLimit}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            itemDetails: {
                              ...prev.itemDetails,
                              purchaseLimit: parseInt(e.target.value) || 1
                            }
                          }))
                        }
                        inputProps={{ min: 1 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontFamily: 'Karla, sans-serif',
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Last Day of Sale"
                        type="datetime-local"
                        value={formData.itemDetails.lastDayOfSale}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            itemDetails: {
                              ...prev.itemDetails,
                              lastDayOfSale: e.target.value
                            }
                          }))
                        }
                        InputLabelProps={{ shrink: true }}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontFamily: 'Karla, sans-serif',
                            border: '2px solid #2C2C2C',
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                // Custom Form Builder for Normal Events
                <Box>
                  <FormBuilder
                    fields={formData.customForm}
                    onChange={(fields) => setFormData(prev => ({ ...prev, customForm: fields }))}
                  />
                </Box>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
              <Button
                className="window-button"
                onClick={() => navigate('/organizer/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="window-button"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
              >
                Save as Draft
              </Button>
              <Button
                className="window-button window-button-gold"
                onClick={() => handleSubmit('published')}
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} sx={{ color: 'white' }} />}
              >
                Publish Event
              </Button>
            </Box>
          </div>
        </form>

        {/* Wave decoration at bottom */}
        <div className="wave-decoration" />
      </div>
    </Container>
  );
};

export default CreateEvent;
