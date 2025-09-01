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
import { useLocale } from 'src/hooks/useLocale';

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
  const { t } = useLocale();
  
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
      newErrors.name = t('tags.tagNameRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('tags.descriptionRequired');
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
        setSuccessMessage(t('tags.updateSuccess'));
        setTimeout(() => {
          router.push('/dashboard/tags');
        }, 1500);
      } else {
        setErrors({ general: data.error?.message || t('tags.updateError') });
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      setErrors({ general: t('tags.unexpectedError') });
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
              {t('tags.editTag')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('tags.editDescription')}
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
                    {t('tags.tagInformation')}
                  </Typography>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label={t('tags.tagName')}
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                    />

                    <TextField
                      fullWidth
                      label={t('tags.description')}
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
                      label={t('tags.active')}
                    />
                  </Stack>
                </Card>

                {/* Color Selection */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('tags.tagColor')}
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
                    {t('tags.preview')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('tags.previewDescription')}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      label={formData.name || t('tags.tagName')}
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
                      {t('tags.tagDetails')}
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('tags.tagId')}
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {tag.id}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('tags.productCount')}
                        </Typography>
                        <Typography variant="body2">
                          {tag.productCount || 0} {t('tags.products').toLowerCase()}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('tags.created')}
                        </Typography>
                        <Typography variant="body2">
                          {new Date(tag.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('common.updated')}
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
                    {isSubmitting ? t('tags.updating') : t('tags.editTag')}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    fullWidth
                  >
                    {t('common.cancel')}
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