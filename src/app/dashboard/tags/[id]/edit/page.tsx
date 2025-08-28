'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Save as SaveIcon,
  Label as TagIcon,
  Palette as ColorIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Alert,
  Button,
  Switch,
  TextField,
  Typography,
  IconButton,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Tag {
  id: string;
  name: string;
  description: string;
  color: string;
  productCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_COLORS = [
  '#1976d2', // Blue
  '#388e3c', // Green
  '#f57c00', // Orange
  '#d32f2f', // Red
  '#7b1fa2', // Purple
  '#00796b', // Teal
  '#455a64', // Blue Grey
  '#e64a19', // Deep Orange
];

export default function EditTagPage() {
  const router = useRouter();
  const params = useParams();
  const tagId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
    isActive: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadTag = async () => {
      try {
        const data = await apiClient.get(`/api/tags/${tagId}`);

        if (data.success) {
          const t = data.data || data;
          setTag(t);
          
          setFormData({
            name: t.name || '',
            description: t.description || '',
            color: t.color || DEFAULT_COLORS[0],
            isActive: t.isActive ?? true,
          });
        }
      } catch (error) {
        console.error('Error loading tag:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTag();
  }, [tagId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.color.trim()) {
      newErrors.color = 'Color is required';
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
      const data = await apiClient.put(`/api/tags/${tagId}`, formData);

      if (data.success) {
        setSuccessMessage('Tag updated successfully!');
        setTimeout(() => {
          router.push('/dashboard/tags');
        }, 1500);
      } else {
        setErrors({ general: data.error?.message || 'Failed to update tag' });
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/tags');
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

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
              Edit Tag
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update tag information and settings
            </Typography>
          </Box>
        </Stack>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                {/* Basic Information */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Tag Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                    />

                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      error={!!errors.description}
                      helperText={errors.description}
                      required
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        />
                      }
                      label="Active"
                    />
                  </Stack>
                </Card>

                {/* Color Selection */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Tag Color
                  </Typography>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Color (Hex)"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      error={!!errors.color}
                      helperText={errors.color || 'Enter a valid hex color (e.g., #1976d2)'}
                      required
                      InputProps={{
                        startAdornment: (
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: 1,
                              backgroundColor: formData.color,
                              border: '1px solid',
                              borderColor: 'divider',
                              mr: 1,
                            }}
                          />
                        ),
                      }}
                    />

                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Quick Colors
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {DEFAULT_COLORS.map((color) => (
                          <IconButton
                            key={color}
                            size="small"
                            onClick={() => handleInputChange('color', color)}
                            sx={{
                              width: 40,
                              height: 40,
                              backgroundColor: color,
                              border: formData.color === color ? '3px solid' : '1px solid',
                              borderColor: formData.color === color ? 'primary.main' : 'divider',
                              '&:hover': {
                                backgroundColor: color,
                                opacity: 0.8,
                              },
                            }}
                          >
                            <ColorIcon sx={{ fontSize: 16, color: 'white' }} />
                          </IconButton>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Preview */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Preview
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This is how your tag will appear
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      label={formData.name || 'Tag Name'}
                      size="small"
                      icon={<TagIcon />}
                      sx={{
                        backgroundColor: formData.color,
                        color: 'white',
                        '& .MuiChip-icon': {
                          color: 'white',
                        },
                      }}
                    />
                    <Chip
                      label={formData.name || 'Tag Name'}
                      size="medium"
                      icon={<TagIcon />}
                      sx={{
                        backgroundColor: formData.color,
                        color: 'white',
                        '& .MuiChip-icon': {
                          color: 'white',
                        },
                      }}
                    />
                  </Stack>
                </Card>

                {/* Tag Details */}
                {tag && (
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Tag Details
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Tag ID
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {tag.id}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Product Count
                        </Typography>
                        <Typography variant="body2">
                          {tag.productCount || 0} products
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body2">
                          {new Date(tag.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body2">
                          {new Date(tag.updatedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                )}

                {/* Actions */}
                <Stack direction="column" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                    fullWidth
                  >
                    {isSubmitting ? 'Updating...' : 'Update Tag'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Box>
    </DashboardContent>
  );
}