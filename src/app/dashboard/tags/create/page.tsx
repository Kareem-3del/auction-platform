'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Save as SaveIcon,
  Palette as PaletteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  Switch,
  TextField,
  Typography,
  IconButton,
  FormControlLabel,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

const predefinedColors = [
  { name: 'Blue', value: '#1976d2' },
  { name: 'Red', value: '#d32f2f' },
  { name: 'Green', value: '#2e7d32' },
  { name: 'Purple', value: '#7b1fa2' },
  { name: 'Orange', value: '#f57c00' },
  { name: 'Cyan', value: '#0288d1' },
  { name: 'Pink', value: '#c2185b' },
  { name: 'Brown', value: '#5d4037' },
  { name: 'Blue Grey', value: '#455a64' },
  { name: 'Deep Orange', value: '#e65100' },
  { name: 'Teal', value: '#00695c' },
  { name: 'Indigo', value: '#3f51b5' },
];

export default function CreateTagPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2',
    isActive: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked 
      : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Creating tag:', formData);
      
      setSuccessMessage('Tag created successfully!');
      
      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard/tags');
      }, 1500);
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/tags');
  };

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              Create Tag
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a new tag to categorize and label your products
            </Typography>
          </Box>
        </Stack>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3} sx={{ maxWidth: 600 }}>
            {/* Basic Information */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tag Information
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Tag Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  placeholder="e.g., Premium, Sale, New Arrival"
                />

                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  error={!!errors.description}
                  helperText={errors.description || 'Describe what this tag represents'}
                  required
                  placeholder="Brief description of when to use this tag"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleInputChange('isActive')}
                    />
                  }
                  label="Active"
                />
              </Stack>
            </Card>

            {/* Color Selection */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaletteIcon />
                Tag Color
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose a color that will represent this tag
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Color
                </Typography>
                <Box
                  sx={{
                    width: 80,
                    height: 40,
                    backgroundColor: formData.color,
                    borderRadius: 1,
                    border: '2px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'medium',
                    fontSize: '0.875rem',
                  }}
                >
                  {formData.name || 'Tag'}
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Predefined Colors
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {predefinedColors.map((color) => (
                    <Box
                      key={color.value}
                      onClick={() => handleColorSelect(color.value)}
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: color.value,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: formData.color === color.value ? '3px solid #000' : '2px solid transparent',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                      title={color.name}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Custom Color
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    type="color"
                    value={formData.color}
                    onChange={handleInputChange('color')}
                    sx={{ width: 60 }}
                  />
                  <TextField
                    size="small"
                    value={formData.color}
                    onChange={handleInputChange('color')}
                    placeholder="#1976d2"
                    sx={{ width: 120 }}
                  />
                </Stack>
              </Box>
            </Card>

            {/* Preview */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This is how your tag will appear on products
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    backgroundColor: formData.color,
                    color: 'white',
                    borderRadius: 1,
                    fontWeight: 'medium',
                    fontSize: '0.875rem',
                  }}
                >
                  {formData.name || 'Tag Name'}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {formData.description || 'Tag description will appear here'}
                </Typography>
              </Stack>
            </Card>

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Tag'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </DashboardContent>
  );
}