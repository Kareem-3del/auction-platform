'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Business as BrandIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  Switch,
  Avatar,
  TextField,
  Typography,
  IconButton,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Brand {
  id: string;
  name: string;
  description: string;
  website: string;
  logoUrl: string;
  productCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    isActive: true,
  });
  const [logoUrl, setLogoUrl] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const data = await apiClient.get(`/api/brands/${brandId}`);

        if (data.success) {
          const b = data.data.brand || data.data || data;
          setBrand(b);
          setLogoUrl(b.logoUrl || '');
          
          setFormData({
            name: b.name || '',
            description: b.description || '',
            website: b.websiteUrl || '',
            isActive: b.isActive ?? true,
          });
        }
      } catch (error) {
        console.error('Error loading brand:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBrand();
  }, [brandId]);

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

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Brand name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const data = await apiClient.put(`/api/brands/${brandId}`, {
        name: formData.name,
        description: formData.description,
        websiteUrl: formData.website,
        isActive: formData.isActive,
        logoUrl,
      });

      if (data.success) {
        setSuccessMessage('Brand updated successfully!');
        setTimeout(() => {
          router.push('/dashboard/brands');
        }, 1500);
      } else {
        setErrors({ general: data.error?.message || 'Failed to update brand' });
      }
    } catch (error) {
      console.error('Error updating brand:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/brands');
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
              Edit Brand
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update brand information and settings
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
          <Stack spacing={3} sx={{ maxWidth: 600 }}>
            {/* Logo Upload */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Brand Logo
              </Typography>
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar
                  src={logoUrl}
                  alt="Brand Logo"
                  sx={{ width: 80, height: 80 }}
                >
                  <BrandIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <UploadIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to upload brand logo
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PNG, JPG, SVG up to 2MB
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Card>

            {/* Basic Information */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Brand Information
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Brand Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  placeholder="e.g., Apple, Nike, Samsung"
                />

                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  error={!!errors.description}
                  helperText={errors.description || 'Brief description of the brand'}
                  required
                  placeholder="Describe what this brand is known for..."
                />

                <TextField
                  fullWidth
                  label="Website (Optional)"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange('website')}
                  error={!!errors.website}
                  helperText={errors.website || 'Official brand website'}
                  placeholder="https://example.com"
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

            {/* Brand Details */}
            {brand && (
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Brand Details
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Brand ID
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {brand.id}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Product Count
                    </Typography>
                    <Typography variant="body2">
                      {brand.productCount || 0} products
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {new Date(brand.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body2">
                      {new Date(brand.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            )}

            {/* Preview */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This is how your brand will appear in product listings
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={logoUrl}
                  alt={formData.name || 'Brand Logo'}
                  sx={{ width: 48, height: 48 }}
                >
                  <BrandIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {formData.name || 'Brand Name'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.description || 'Brand description will appear here'}
                  </Typography>
                  {formData.website && (
                    <Typography variant="caption" color="primary.main">
                      {formData.website}
                    </Typography>
                  )}
                </Box>
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
                {isSubmitting ? 'Updating...' : 'Update Brand'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </DashboardContent>
  );
}