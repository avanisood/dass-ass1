import React, { useState } from 'react';
import api from '../../services/api';
import {
  Dialog,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

// Registration Modal Component
const RegistrationModal = ({ event, open, onClose, onSuccess }) => {
  // State for form data
  const [formData, setFormData] = useState({ quantity: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');

  // Handle input changes
  const handleChange = (fieldName, value) => {
    setFormData({
      ...formData,
      [fieldName]: value,
    });
  };

  // Validate required fields
  const validateForm = () => {
    if (!event) return false;

    // For normal events, validate custom form fields
    if (event.type === 'normal' && event.customForm) {
      for (const field of event.customForm) {
        if (field.required && !formData[field.label]) {
          setError(`${field.label} is required`);
          return false;
        }
      }
    }

    // For merchandise, validate variant and quantity
    if (event.type === 'merchandise') {
      if (!formData.variant) {
        setError('Please select a variant');
        return false;
      }
      if (!formData.quantity || formData.quantity < 1) {
        setError('Please enter a valid quantity');
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError('');

    // Validate required fields
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call registration API
      const response = await api.post('/registrations', {
        eventId: event._id,
        formData: formData,
        ...(event.type === 'merchandise' && {
          variant: formData.variant,
          quantity: formData.quantity,
        }),
      });

      // Show success message with ticket ID
      setTicketId(response.data.ticketId);
      setSuccess(true);

      // Close modal after 2 seconds and refresh parent
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({ quantity: 1 });
    setError('');
    setSuccess(false);
    onClose();
  };

  // Handle quantity increment
  const incrementQuantity = () => {
    const maxLimit = event?.itemDetails?.purchaseLimit || 10;
    if ((formData.quantity || 1) < maxLimit) {
      handleChange('quantity', (formData.quantity || 1) + 1);
    }
  };

  // Handle quantity decrement
  const decrementQuantity = () => {
    if ((formData.quantity || 1) > 1) {
      handleChange('quantity', (formData.quantity || 1) - 1);
    }
  };

  // Render dynamic form field based on type
  const renderFormField = (field, index) => {
    const fieldName = field.label;
    const requiredLabel = field.required ? (
      <>
        {field.label} <span style={{ color: '#E8C17C', fontWeight: 'bold' }}>*</span>
      </>
    ) : field.label;

    switch (field.fieldType) {
      // Text field
      case 'text':
        return (
          <TextField
            key={index}
            fullWidth
            label={requiredLabel}
            required={field.required}
            value={formData[fieldName] || ''}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            margin="normal"
          />
        );

      // Email field
      case 'email':
        return (
          <TextField
            key={index}
            fullWidth
            type="email"
            label={requiredLabel}
            required={field.required}
            value={formData[fieldName] || ''}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            margin="normal"
          />
        );

      // Number field
      case 'number':
        return (
          <TextField
            key={index}
            fullWidth
            type="number"
            label={requiredLabel}
            required={field.required}
            value={formData[fieldName] || ''}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            margin="normal"
          />
        );

      // Dropdown field
      case 'dropdown':
        return (
          <FormControl key={index} fullWidth margin="normal" required={field.required}>
            <InputLabel>{requiredLabel}</InputLabel>
            <Select
              value={formData[fieldName] || ''}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              label={field.label}
            >
              {field.options?.map((option, idx) => (
                <MenuItem key={idx} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      // Checkbox field
      case 'checkbox':
        return (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={formData[fieldName] || false}
                onChange={(e) => handleChange(fieldName, e.target.checked)}
              />
            }
            label={
              <span style={{ fontFamily: '"Karla", sans-serif' }}>
                {requiredLabel}
              </span>
            }
            sx={{ marginTop: 2, marginBottom: 1 }}
          />
        );
      // File upload field
      case 'file':
        return (
          <Box key={index} sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" gutterBottom sx={{ fontFamily: '"Karla", sans-serif' }}>
              {requiredLabel}
            </Typography>
            <Button variant="outlined" component="label" className="window-button">
              Upload File
              <input
                type="file"
                hidden
                onChange={(e) => handleChange(fieldName, e.target.files[0])}
              />
            </Button>
            {formData[fieldName] && (
              <Typography variant="caption" sx={{ ml: 2, fontFamily: '"Karla", sans-serif' }}>
                {formData[fieldName].name}
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  if (!event) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        className: "window-box",
        sx: { margin: 2 }
      }}
    >
      {/* Window Header */}
      <div className="window-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.875rem' }}>
          REGISTER.EXE
        </Typography>
        <IconButton 
          onClick={handleCancel} 
          size="small"
          sx={{ 
            padding: '4px',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' }
          }}
        >
          <CloseIcon sx={{ fontSize: '1rem', color: '#3D3D3D' }} />
        </IconButton>
      </div>

      {/* Dialog Content - Window Body */}
      <div className="window-body" style={{ padding: '2rem', position: 'relative' }}>
        {/* Success State */}
        {success ? (
          <Box sx={{ textAlign: 'center', padding: '2rem' }}>
            {/* Sparkle decorations */}
            <span className="sparkle" style={{ position: 'absolute', top: '1rem', left: '2rem' }}>✦</span>
            <span className="sparkle" style={{ position: 'absolute', top: '1rem', right: '2rem' }}>✦</span>
            <span className="sparkle" style={{ position: 'absolute', bottom: '2rem', left: '3rem' }}>✦</span>
            <span className="sparkle" style={{ position: 'absolute', bottom: '2rem', right: '3rem' }}>✦</span>

            {/* Success Icon */}
            <CheckCircle sx={{ fontSize: 80, color: '#6BA368', marginBottom: 2 }} />

            {/* Success Message */}
            <Typography 
              variant="h4" 
              sx={{ 
                fontFamily: '"DM Serif Display", serif',
                color: '#2C2C2C',
                marginBottom: '1rem'
              }}
            >
              Registration Successful!
            </Typography>

            {/* Ticket ID */}
            <Box sx={{ 
              backgroundColor: '#F4D4A8', 
              border: '2px solid #3D3D3D',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: '"Karla", sans-serif',
                  color: '#3D3D3D',
                  marginBottom: '0.5rem'
                }}
              >
                Your Ticket ID
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: '"Space Mono", monospace',
                  fontWeight: 700,
                  color: '#E8C17C',
                  letterSpacing: '0.05em'
                }}
              >
                {ticketId}
              </Typography>
            </Box>

            {/* Close Button */}
            <Button
              className="window-button window-button-gold"
              onClick={handleCancel}
              sx={{ fontSize: '0.875rem', padding: '10px 32px' }}
            >
              View My Tickets
            </Button>
          </Box>
        ) : (
          <>
            {/* Event Name Header */}
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: '"DM Serif Display", serif',
                color: '#2C2C2C',
                marginBottom: '1rem'
              }}
            >
              {event.name}
            </Typography>

            {/* Error message */}
            {error && (
              <Box sx={{ 
                mb: 2, 
                p: 1.5, 
                backgroundColor: '#ffe5e5', 
                border: '2px solid #C65D4F',
                borderRadius: '8px'
              }}>
                <Typography color="error" sx={{ fontFamily: '"Karla", sans-serif', fontSize: '0.875rem' }}>
                  {error}
                </Typography>
              </Box>
            )}

            {/* Normal Event - Dynamic Form Fields */}
            {event.type === 'normal' && event.customForm && (
              <Box>
                {event.customForm.map((field, index) => renderFormField(field, index))}
              </Box>
            )}

            {/* Merchandise Event - Variant Selector and Quantity */}
            {event.type === 'merchandise' && (
              <Box>
                {/* Select Options Heading */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: '"Space Mono", monospace',
                    color: '#2C2C2C',
                    marginTop: 2,
                    marginBottom: 2,
                    textTransform: 'uppercase',
                    fontSize: '1rem'
                  }}
                >
                  Select Options
                </Typography>

                {/* Size Selector */}
                {event.itemDetails?.variants && (
                  <Box sx={{ marginBottom: 3 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: '"Karla", sans-serif',
                        marginBottom: 1,
                        fontWeight: 600
                      }}
                    >
                      Size <span style={{ color: '#E8C17C', fontWeight: 'bold' }}>*</span>
                    </Typography>
                    <RadioGroup
                      value={formData.size || ''}
                      onChange={(e) => handleChange('size', e.target.value)}
                    >
                      {[...new Set(event.itemDetails.variants.map(v => v.size))].map((size, idx) => (
                        <FormControlLabel
                          key={idx}
                          value={size}
                          control={<Radio />}
                          label={size}
                          sx={{ 
                            '& .MuiFormControlLabel-label': {
                              fontFamily: '"Karla", sans-serif'
                            }
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </Box>
                )}

                {/* Color Selector */}
                {event.itemDetails?.variants && formData.size && (
                  <Box sx={{ marginBottom: 3 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: '"Karla", sans-serif',
                        marginBottom: 1,
                        fontWeight: 600
                      }}
                    >
                      Color <span style={{ color: '#E8C17C', fontWeight: 'bold' }}>*</span>
                    </Typography>
                    <RadioGroup
                      value={formData.color || ''}
                      onChange={(e) => {
                        handleChange('color', e.target.value);
                        // Set variant when both size and color are selected
                        const selectedVariant = event.itemDetails.variants.find(
                          v => v.size === formData.size && v.color === e.target.value
                        );
                        if (selectedVariant) {
                          handleChange('variant', JSON.stringify(selectedVariant));
                        }
                      }}
                    >
                      {event.itemDetails.variants
                        .filter(v => v.size === formData.size)
                        .map((variant, idx) => (
                          <FormControlLabel
                            key={idx}
                            value={variant.color}
                            control={<Radio />}
                            label={`${variant.color} (Stock: ${variant.stock})`}
                            disabled={variant.stock === 0}
                            sx={{ 
                              '& .MuiFormControlLabel-label': {
                                fontFamily: '"Karla", sans-serif'
                              }
                            }}
                          />
                        ))}
                    </RadioGroup>
                  </Box>
                )}

                {/* Quantity Selector */}
                <Box sx={{ marginBottom: 3 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: '"Karla", sans-serif',
                      marginBottom: 1,
                      fontWeight: 600
                    }}
                  >
                    Quantity <span style={{ color: '#E8C17C', fontWeight: 'bold' }}>*</span>
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      className="window-button"
                      onClick={decrementQuantity}
                      disabled={formData.quantity <= 1}
                      sx={{ minWidth: '40px', padding: '8px' }}
                    >
                      <RemoveIcon />
                    </Button>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontFamily: '"Space Mono", monospace',
                        fontWeight: 700,
                        minWidth: '60px',
                        textAlign: 'center'
                      }}
                    >
                      {formData.quantity || 1}
                    </Typography>
                    <Button
                      className="window-button"
                      onClick={incrementQuantity}
                      disabled={formData.quantity >= (event.itemDetails?.purchaseLimit || 10)}
                      sx={{ minWidth: '40px', padding: '8px' }}
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: '"Karla", sans-serif',
                      color: '#3D3D3D',
                      display: 'block',
                      marginTop: 0.5
                    }}
                  >
                    Max: {event.itemDetails?.purchaseLimit || 10} per person
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Registration Fee Display */}
            <Box sx={{ 
              marginTop: 3, 
              padding: 2, 
              backgroundColor: '#F4D4A8',
              border: '2px solid #3D3D3D',
              borderRadius: '8px'
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: '"Space Mono", monospace',
                  color: '#3D3D3D',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  marginBottom: 0.5
                }}
              >
                {event.type === 'merchandise' ? 'Total Amount' : 'Registration Fee'}
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: '"Space Mono", monospace',
                  fontWeight: 700,
                  color: '#2C2C2C'
                }}
              >
                {event.registrationFee === 0
                  ? 'Free'
                  : event.type === 'merchandise'
                  ? `₹${event.registrationFee * (formData.quantity || 1)}`
                  : `₹${event.registrationFee}`}
              </Typography>
            </Box>

            {/* Dialog Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, gap: 2 }}>
              <Button
                className="window-button"
                onClick={handleCancel}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                className="window-button window-button-gold"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ flex: 2 }}
              >
                {loading ? 'Processing...' : 'Complete Registration'}
              </Button>
            </Box>
          </>
        )}
      </div>
    </Dialog>
  );
};

export default RegistrationModal;
