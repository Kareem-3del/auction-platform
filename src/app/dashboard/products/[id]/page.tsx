'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  ImageSearch as ImageIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as ApprovedIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Alert,
  Table,
  Button,
  Avatar,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  Typography,
  IconButton,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { formatCurrency } from 'src/lib/utils';
import { DashboardContent } from 'src/layouts/dashboard';
import { useLocale } from 'src/hooks/useLocale';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Agent {
  id: string;
  displayName: string;
  businessName?: string;
  logoUrl?: string;
  rating?: number;
  reviewCount?: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  condition: string;
  location?: string;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  reservePrice?: number;
  specifications?: any;
  customFields?: any;
  images?: string[];
  videos?: string[];
  documents?: string[];
  thumbnailIndex?: number;
  status: string;
  rejectionReason?: string;
  viewCount?: number;
  favoriteCount?: number;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  categoryId?: string;
  category?: Category;
  agentId?: string;
  agent?: Agent;
}

export default function ViewProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { t } = useLocale();
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await apiClient.get(`/api/products/${productId}`);

        if (data.success) {
          console.log('Product API response:', data); // Debug log
          const productData = data.data.product || data.data;
          setProduct(productData);
        } else {
          setError(data.error?.message || t('products.loadProductError'));
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setError(t('products.unexpectedError'));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleBack = () => {
    router.push('/dashboard/products');
  };

  const handleEdit = () => {
    router.push(`/dashboard/products/${productId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm(t('products.confirmDeleteProduct'))) {
      return;
    }

    try {
      const data = await apiClient.delete(`/api/products/${productId}`);

      if (data.success) {
        router.push('/dashboard/products');
      } else {
        setError(data.error?.message || t('products.deleteProductError'));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(t('products.unexpectedError'));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <ApprovedIcon color="success" />;
      case 'REJECTED':
        return <RejectedIcon color="error" />;
      case 'PENDING_APPROVAL':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING_APPROVAL':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW':
        return 'success';
      case 'EXCELLENT':
        return 'info';
      case 'GOOD':
        return 'warning';
      case 'FAIR':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const parseSpecifications = (specs: any) => {
    if (!specs) return [];
    try {
      const parsed = typeof specs === 'string' ? JSON.parse(specs) : specs;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to parse specifications:', e);
      return [];
    }
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

  if (error || !product) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || t('products.productNotFound')}
          </Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            {t('products.backToProducts')}
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  const specifications = parseSpecifications(product.specifications);

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" gutterBottom>
                {product.title}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  icon={getStatusIcon(product.status || 'UNKNOWN')}
                  label={product.status ? product.status.replace('_', ' ') : 'Unknown'}
                  color={getStatusColor(product.status || 'UNKNOWN') as any}
                />
                <Chip
                  label={product.condition || 'Unknown'}
                  color={getConditionColor(product.condition || 'UNKNOWN') as any}
                  size="small"
                />
              </Stack>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              {t('common.delete')}
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
                  {t('products.description')}
                </Typography>
                <Typography variant="body1" paragraph>
                  {product.description}
                </Typography>
                {product.shortDescription && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      {t('products.shortDescription')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {product.shortDescription}
                    </Typography>
                  </>
                )}
              </Card>

              {/* Images */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('products.images')}
                </Typography>
                {product.images && product.images.length > 0 ? (
                  <Grid container spacing={2}>
                    {(product.images || []).map((image, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Box
                          sx={{
                            aspectRatio: '1',
                            borderRadius: 1,
                            overflow: 'hidden',
                            backgroundColor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ImageIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t('products.noImagesUploaded')}
                  </Typography>
                )}
              </Card>

              {/* Specifications */}
              {specifications.length > 0 && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.specifications')}
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {specifications.map((spec, index) => (
                          <TableRow key={index}>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                              {spec.key}
                            </TableCell>
                            <TableCell>{spec.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}
            </Stack>
          </Grid>

          {/* Right Column - Details */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Basic Info */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('products.productDetails')}
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('products.productId')}
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {product.id}
                    </Typography>
                  </Box>

                  {product.category && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('products.category')}
                      </Typography>
                      <Typography variant="body2">
                        {product.category.name}
                      </Typography>
                    </Box>
                  )}

                  {product.location && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('products.location')}
                      </Typography>
                      <Typography variant="body2">
                        {product.location}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('products.condition')}
                    </Typography>
                    <Chip
                      label={product.condition}
                      color={getConditionColor(product.condition) as any}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Card>

              {/* Valuation */}
              {(product.estimatedValueMin || product.estimatedValueMax || product.reservePrice) && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.valuation')}
                  </Typography>
                  <Stack spacing={2}>
                    {(product.estimatedValueMin || product.estimatedValueMax) && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('products.estimatedValue')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {product.estimatedValueMin && product.estimatedValueMax
                            ? `${formatCurrency(product.estimatedValueMin)} - ${formatCurrency(product.estimatedValueMax)}`
                            : product.estimatedValueMin
                            ? t('products.fromValue', { value: formatCurrency(product.estimatedValueMin) })
                            : t('products.upToValue', { value: formatCurrency(product.estimatedValueMax!) })}
                        </Typography>
                      </Box>
                    )}

                    {product.reservePrice && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('products.reservePrice')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="primary.main">
                          {formatCurrency(product.reservePrice)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Card>
              )}

              {/* Agent Info */}
              {product.agent && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.listedBy')}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={product.agent.logoUrl}
                      alt={product.agent.displayName}
                      sx={{ width: 48, height: 48 }}
                    >
                      {product.agent.displayName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {product.agent.businessName || product.agent.displayName}
                      </Typography>
                      {product.agent.rating && (
                        <Typography variant="body2" color="text.secondary">
                          ⭐ {product.agent.rating.toFixed(1)} ({product.agent.reviewCount} {t('products.reviews')})
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Card>
              )}

              {/* Statistics */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('products.statistics')}
                </Typography>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('products.views')}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {product.viewCount || 0}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('products.favorites')}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {product.favoriteCount || 0}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('products.created')}
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(product.createdAt)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('products.updated')}
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(product.updatedAt)}
                    </Typography>
                  </Box>
                  {product.approvedAt && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        {t('products.approved')}
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(product.approvedAt)}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Card>

              {/* Rejection Reason */}
              {product.status === 'REJECTED' && product.rejectionReason && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="error.main">
                    {t('products.rejectionReason')}
                  </Typography>
                  <Typography variant="body2">
                    {product.rejectionReason}
                  </Typography>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </DashboardContent>
  );
}