'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Alert,
  Button,
  Avatar,
  Divider,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BrandIcon,
  Language as WebsiteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

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

export default function ViewBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const data = await apiClient.get(`/api/brands/${brandId}`);

        if (data.success) {
          setBrand(data.data);
        } else {
          setError(data.error?.message || 'Failed to load brand');
        }
      } catch (error) {
        console.error('Error loading brand:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadBrand();
  }, [brandId]);

  const handleBack = () => {
    router.push('/dashboard/brands');
  };

  const handleEdit = () => {
    router.push(`/dashboard/brands/${brandId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this brand?')) {
      return;
    }

    try {
      const data = await apiClient.delete(`/api/brands/${brandId}`);

      if (data.success) {
        router.push('/dashboard/brands');
      } else {
        setError(data.error?.message || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      setError('An unexpected error occurred');
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (error || !brand) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Brand not found'}
          </Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back to Brands
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
            <Avatar
              src={brand.logoUrl}
              alt={brand.name}
              sx={{ width: 64, height: 64 }}
            >
              <BrandIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                {brand.name}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={brand.isActive ? 'Active' : 'Inactive'}
                  color={brand.isActive ? 'success' : 'default'}
                  variant={brand.isActive ? 'filled' : 'outlined'}
                />
                {brand.website && (
                  <Button
                    size="small"
                    startIcon={<WebsiteIcon />}
                    onClick={() => window.open(brand.website, '_blank')}
                    sx={{ textTransform: 'none' }}
                  >
                    Visit Website
                  </Button>
                )}
              </Stack>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* Left Column - Main Content */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Description */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  About {brand.name}
                </Typography>
                <Typography variant="body1">
                  {brand.description}
                </Typography>
              </Card>

              {/* Brand Logo */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Brand Logo
                </Typography>
                {brand.logoUrl ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Avatar
                      src={brand.logoUrl}
                      alt={brand.name}
                      sx={{ width: 120, height: 120 }}
                      variant="rounded"
                    >
                      <BrandIcon sx={{ fontSize: 60 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {brand.name} Logo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Official brand logo and visual identity
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 200,
                      height: 120,
                      backgroundColor: 'grey.100',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <BrandIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        No logo uploaded
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Card>
            </Stack>
          </Grid>

          {/* Right Column - Details */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Basic Info */}
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
                      Status
                    </Typography>
                    <Chip
                      label={brand.isActive ? 'Active' : 'Inactive'}
                      color={brand.isActive ? 'success' : 'default'}
                      size="small"
                      variant={brand.isActive ? 'filled' : 'outlined'}
                    />
                  </Box>

                  {brand.website && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Website
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<WebsiteIcon />}
                        onClick={() => window.open(brand.website, '_blank')}
                        sx={{ textTransform: 'none', p: 0, minWidth: 0 }}
                      >
                        {brand.website}
                      </Button>
                    </Box>
                  )}
                </Stack>
              </Card>

              {/* Statistics */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Products
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {brand.productCount || 0}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(brand.createdAt)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(brand.updatedAt)}
                    </Typography>
                  </Box>
                </Stack>
              </Card>

              {/* Brand Preview */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  How this brand appears in product listings
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={brand.logoUrl}
                    alt={brand.name}
                    sx={{ width: 48, height: 48 }}
                  >
                    <BrandIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {brand.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {brand.description}
                    </Typography>
                    {brand.website && (
                      <Typography variant="caption" color="primary.main">
                        {brand.website}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </DashboardContent>
  );
}