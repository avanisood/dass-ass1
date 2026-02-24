import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const RegistrationFormModal = ({ open, onClose, event, onSubmit, registering }) => {
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Reset form when opened with a new event
  useEffect(() => {
    if (open && event) {
      const initialData = {};
      if (event.type === 'normal' && event.customForm) {
        event.customForm.forEach(field => {
          initialData[field.label] = field.fieldType === 'checkbox' ? false : '';
        });
      }
      setFormData(initialData);
      setFormErrors({});
      setSelectedColor('');
      setSelectedSize('');
      setQuantity(1);
    }
  }, [open, event]);

  const handleChange = (label, value) => {
    setFormData(prev => ({
      ...prev,
      [label]: value
    }));
    if (formErrors[label]) {
      setFormErrors(prev => ({ ...prev, [label]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (event.type === 'normal' && event.customForm) {
      event.customForm.forEach(field => {
        if (field.required) {
          const val = formData[field.label];
          if (field.fieldType === 'checkbox' && !val) {
            errors[field.label] = 'This field is required';
            isValid = false;
          } else if (field.fieldType !== 'checkbox' && (!val || val.trim() === '')) {
            errors[field.label] = 'This field is required';
            isValid = false;
          }
        }
      });
    } else if (event.type === 'merchandise') {
      if (!selectedColor) {
        errors['variant'] = 'Please select a variant';
        isValid = false;
      }
      if (selectedColor && !selectedSize) {
        errors['size'] = 'Please select a size';
        isValid = false;
      }
      if (quantity < 1) {
        errors['quantity'] = 'Quantity must be at least 1';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      if (event.type === 'merchandise') {
        const variant = event.itemDetails.variants.find(
          v => v.color === selectedColor && v.size === selectedSize
        );
        onSubmit({
          variant: { size: variant.size, color: variant.color },
          quantity
        });
      } else {
        onSubmit({ formData });
      }
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onClose={!registering ? onClose : undefined} maxWidth="sm" fullWidth PaperProps={{ className: 'window-box' }}>
      <div className="window-header" style={{ position: 'relative' }}>
        <Typography sx={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '0.9rem' }}>
          REGISTRATION_FORM.EXE
        </Typography>
        <IconButton
          onClick={onClose}
          disabled={registering}
          size="small"
          sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ padding: '2rem' }}>
          <Typography variant="h6" sx={{ fontFamily: '"DM Serif Display", serif', mb: 2 }}>
            {event.type === 'merchandise' ? 'Purchase Details' : 'Registration Form'} for {event.name}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {event.type === 'normal' && event.customForm && event.customForm.map((field, index) => {
              if (field.fieldType === 'text') {
                return (
                  <TextField
                    key={index}
                    label={field.label}
                    required={field.required}
                    value={formData[field.label] || ''}
                    onChange={(e) => handleChange(field.label, e.target.value)}
                    error={!!formErrors[field.label]}
                    helperText={formErrors[field.label]}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"Karla", sans-serif' } }}
                  />
                );
              } else if (field.fieldType === 'dropdown') {
                return (
                  <FormControl key={index} fullWidth error={!!formErrors[field.label]} required={field.required}>
                    <InputLabel sx={{ fontFamily: '"Karla", sans-serif' }}>{field.label}</InputLabel>
                    <Select
                      value={formData[field.label] || ''}
                      onChange={(e) => handleChange(field.label, e.target.value)}
                      label={field.label}
                      sx={{ fontFamily: '"Karla", sans-serif' }}
                    >
                      {field.options && field.options.map((opt, i) => (
                        <MenuItem key={i} value={opt}>{opt}</MenuItem>
                      ))}
                    </Select>
                    {formErrors[field.label] && <Typography color="error" variant="caption">{formErrors[field.label]}</Typography>}
                  </FormControl>
                );
              } else if (field.fieldType === 'checkbox') {
                return (
                  <FormControl key={index} error={!!formErrors[field.label]} required={field.required}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!formData[field.label]}
                          onChange={(e) => handleChange(field.label, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography sx={{ fontFamily: '"Karla", sans-serif' }}>
                          {field.label} {field.required && '*'}
                        </Typography>
                      }
                    />
                    {formErrors[field.label] && <Typography color="error" variant="caption">{formErrors[field.label]}</Typography>}
                  </FormControl>
                );
              }
              return null;
            })}

            {event.type === 'merchandise' && event.itemDetails && (
              <>
                <FormControl fullWidth error={!!formErrors['variant']} required>
                  <InputLabel sx={{ fontFamily: '"Karla", sans-serif' }}>Select Variant</InputLabel>
                  <Select
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
                      setSelectedSize(''); // Reset size when variant changes
                      setFormErrors(prev => ({ ...prev, variant: undefined, size: undefined }));
                    }}
                    label="Select Variant"
                    sx={{ fontFamily: '"Karla", sans-serif' }}
                  >
                    {[...new Set(event.itemDetails.variants.map(v => v.color))].map((color, i) => (
                      <MenuItem key={i} value={color}>
                        {color}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors['variant'] && <Typography color="error" variant="caption">{formErrors['variant']}</Typography>}
                </FormControl>

                {selectedColor && (
                  <FormControl fullWidth error={!!formErrors['size']} required sx={{ mt: 2 }}>
                    <InputLabel sx={{ fontFamily: '"Karla", sans-serif' }}>Select Size</InputLabel>
                    <Select
                      value={selectedSize}
                      onChange={(e) => {
                        setSelectedSize(e.target.value);
                        setFormErrors(prev => ({ ...prev, size: undefined }));
                      }}
                      label="Select Size"
                      sx={{ fontFamily: '"Karla", sans-serif' }}
                    >
                      {event.itemDetails.variants
                        .filter(v => v.color === selectedColor)
                        .map((v, i) => (
                          <MenuItem key={i} value={v.size} disabled={v.stock <= 0}>
                            {v.size} (Stock: {v.stock})
                          </MenuItem>
                        ))}
                    </Select>
                    {formErrors['size'] && <Typography color="error" variant="caption">{formErrors['size']}</Typography>}
                  </FormControl>
                )}
                <TextField
                  label="Quantity"
                  type="number"
                  required
                  value={quantity}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val) || val < 1) val = 1;
                    setQuantity(val);
                    setFormErrors(prev => ({ ...prev, quantity: undefined }));
                  }}
                  inputProps={{ min: 1 }}
                  error={!!formErrors['quantity']}
                  helperText={formErrors['quantity']}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"Karla", sans-serif' } }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '1.5rem', justifyContent: 'space-between', borderTop: '1px solid #eee' }}>
          <Button
            className="window-button"
            onClick={onClose}
            disabled={registering}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="window-button window-button-gold"
            disabled={registering}
            startIcon={registering ? <CircularProgress size={20} /> : null}
          >
            {registering ? 'Submitting...' : (event.type === 'merchandise' ? 'Purchase' : 'Submit Registration')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RegistrationFormModal;
