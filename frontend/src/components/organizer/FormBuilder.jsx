import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Checkbox,
  FormControlLabel,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  TextFields as TextIcon,
  Email as EmailIcon,
  Numbers as NumbersIcon,
  List as ListIcon,
  CheckBox as CheckboxIcon,
  AttachFile as FileIcon,
} from '@mui/icons-material';

/**
 * Form Builder Component
 * Allows organizers to create custom registration forms for events
 * Returns array of field objects to parent component
 */
const FormBuilder = ({ fields = [], onChange }) => {
  // Local state for form fields
  const [formFields, setFormFields] = useState(fields);

  // Sync with parent when fields change
  useEffect(() => {
    if (onChange) {
      onChange(formFields);
    }
  }, [formFields, onChange]);

  // Add new field to the form
  const handleAddField = () => {
    const newField = {
      id: Date.now(), // Simple unique ID using timestamp
      fieldType: 'text',
      label: '',
      required: false,
      options: [] // For dropdown/checkbox fields
    };
    setFormFields([...formFields, newField]);
  };

  // Delete a field from the form
  const handleDeleteField = (id) => {
    setFormFields(formFields.filter(field => field.id !== id));
  };

  // Move field up in the list
  const handleMoveUp = (index) => {
    if (index === 0) return; // Already at top
    const newFields = [...formFields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    setFormFields(newFields);
  };

  // Move field down in the list
  const handleMoveDown = (index) => {
    if (index === formFields.length - 1) return; // Already at bottom
    const newFields = [...formFields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    setFormFields(newFields);
  };

  // Update field property
  const handleFieldChange = (id, property, value) => {
    setFormFields(formFields.map(field =>
      field.id === id ? { ...field, [property]: value } : field
    ));
  };

  // Convert comma-separated string to options array
  const handleOptionsChange = (id, value) => {
    const options = value.split(',').map(opt => opt.trimStart());
    handleFieldChange(id, 'options', options);
  };

  // Get icon based on field type
  const getFieldIcon = (fieldType) => {
    switch (fieldType) {
      case 'text':
        return <TextIcon sx={{ fontSize: 28, color: '#E8C17C' }} />;
      case 'email':
        return <EmailIcon sx={{ fontSize: 28, color: '#E8C17C' }} />;
      case 'number':
        return <NumbersIcon sx={{ fontSize: 28, color: '#E8C17C' }} />;
      case 'dropdown':
        return <ListIcon sx={{ fontSize: 28, color: '#E8C17C' }} />;
      case 'checkbox':
        return <CheckboxIcon sx={{ fontSize: 28, color: '#E8C17C' }} />;
      case 'file':
        return <FileIcon sx={{ fontSize: 28, color: '#E8C17C' }} />;
      default:
        return <TextIcon sx={{ fontSize: 28, color: '#E8C17C' }} />;
    }
  };

  return (
    <div className="window-box">
      {/* Header */}
      <div className="window-header">
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Space Mono, monospace',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontSize: '0.95rem',
          }}
        >
          FORM_BUILDER.EXE
        </Typography>
      </div>

      {/* Body */}
      <div className="window-body">
        {/* Fields List */}
        {formFields.length === 0 ? (
          /* Empty State */
          <Box sx={{ textAlign: 'center', padding: 3 }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'Karla, sans-serif',
                color: '#3D3D3D',
                mb: 1,
              }}
            >
              No form fields yet
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'Karla, sans-serif',
                color: '#3D3D3D',
              }}
            >
              Click Add Field to start
            </Typography>
          </Box>
        ) : (
          formFields.map((field, index) => (
            <div key={field.id} className="window-box" style={{ marginBottom: '1rem' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  padding: '1.5rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Left Side - Icon */}
                <Box sx={{ flexShrink: 0 }}>
                  {getFieldIcon(field.fieldType)}
                </Box>

                {/* Center - Field Config */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Question"
                    value={field.label}
                    onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                    placeholder="Enter question"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Karla, sans-serif',
                      },
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Field Type</InputLabel>
                      <Select
                        value={field.fieldType}
                        label="Field Type"
                        onChange={(e) => handleFieldChange(field.id, 'fieldType', e.target.value)}
                        sx={{
                          fontFamily: 'Karla, sans-serif',
                        }}
                      >
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="email">Email</MenuItem>
                        <MenuItem value="number">Number</MenuItem>
                        <MenuItem value="dropdown">Dropdown</MenuItem>
                        <MenuItem value="checkbox">Checkbox</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.required}
                          onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                          size="small"
                          sx={{
                            '&.Mui-checked': {
                              color: '#E8C17C',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          sx={{
                            fontFamily: 'Karla, sans-serif',
                            fontSize: '0.875rem',
                          }}
                        >
                          Required
                        </Typography>
                      }
                    />
                  </Box>

                  {/* Options input for dropdown/checkbox */}
                  {(field.fieldType === 'dropdown' || field.fieldType === 'checkbox') && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Options (comma-separated)"
                      value={field.options?.join(', ') || ''}
                      onChange={(e) => handleOptionsChange(field.id, e.target.value)}
                      placeholder="e.g., S, M, L, XL"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: 'Karla, sans-serif',
                        },
                      }}
                    />
                  )}
                </Box>

                {/* Right Side - Actions */}
                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move Up"
                    sx={{
                      color: '#2C2C2C',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                      },
                      '&:disabled': {
                        opacity: 0.3,
                      },
                    }}
                  >
                    <ArrowUpIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === formFields.length - 1}
                    title="Move Down"
                    sx={{
                      color: '#2C2C2C',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                      },
                      '&:disabled': {
                        opacity: 0.3,
                      },
                    }}
                  >
                    <ArrowDownIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => handleDeleteField(field.id)}
                    title="Delete Field"
                    sx={{
                      color: '#D32F2F',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </div>
          ))
        )}

        {/* Add Field Button */}
        <Button
          className="window-button"
          startIcon={<AddIcon />}
          onClick={handleAddField}
          fullWidth
          sx={{ mt: 2 }}
        >
          Add Field
        </Button>

        {/* Summary */}
        {formFields.length > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              backgroundColor: '#F4D4A8',
              border: '2px solid #2C2C2C',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'Karla, sans-serif',
                color: '#2C2C2C',
                fontWeight: 600,
              }}
            >
              <strong>{formFields.length}</strong> custom field{formFields.length !== 1 ? 's' : ''} added to registration form
            </Typography>
          </Box>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;
