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
  Divider,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  ArrowBack as ArrowBackIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  parentId: string | null;
  level: number;
  productCount: number;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: Category | null;
  children?: Category[];
}

export default function ViewCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const data = await apiClient.get(`/api/categories/${categoryId}`);

        if (data.success) {
          setCategory(data.data);
        } else {
          setError(data.error?.message || 'Failed to load category');
        }
      } catch (error) {
        console.error('Error loading category:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [categoryId]);

  const handleBack = () => {
    router.push('/dashboard/categories');
  };

  const handleEdit = () => {
    router.push(`/dashboard/categories/${categoryId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const data = await apiClient.delete(`/api/categories/${categoryId}`);

      if (data.success) {
        router.push('/dashboard/categories');
      } else {
        setError(data.error?.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('An unexpected error occurred');
    }
  };

  const getCategoryIcon = (level: number) => level === 0 ? <FolderIcon color="primary" /> : <FolderOpenIcon color="primary" />;

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

  if (error || !category) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Category not found'}
          </Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back to Categories
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
            <Box>
              <Typography variant="h4" gutterBottom>
                {category.name}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={category.isActive ? 'Active' : 'Inactive'}
                  color={category.isActive ? 'success' : 'default'}
                  variant={category.isActive ? 'filled' : 'outlined'}
                />
                <Chip
                  label={`Level ${category.level}`}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  /{category.slug}
                </Typography>
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
                  Description
                </Typography>
                <Typography variant="body1">
                  {category.description}
                </Typography>
              </Card>

              {/* Image */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Category Image
                </Typography>
                {category.imageUrl ? (
                  <Box
                    component="img"
                    src={category.imageUrl}
                    alt={category.name}
                    sx={{
                      width: '100%',
                      maxWidth: 400,
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 1,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 400,
                      height: 200,
                      backgroundColor: 'grey.100',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        No image uploaded
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Card>

              {/* Child Categories */}
              {category.children && category.children.length > 0 && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Subcategories
                  </Typography>
                  <Grid container spacing={2}>
                    {category.children.map((child) => (
                      <Grid item xs={12} sm={6} md={4} key={child.id}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            {getCategoryIcon(child.level)}
                            <Box>
                              <Typography variant="subtitle2" fontWeight="medium">
                                {child.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {child.productCount} products
                              </Typography>
                            </Box>
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
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
                  Category Details
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category ID
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {category.id}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      URL Slug
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      /{category.slug}
                    </Typography>
                  </Box>

                  {category.parent && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Parent Category
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getCategoryIcon(category.parent.level)}
                        <Typography variant="body2">
                          {category.parent.name}
                        </Typography>
                      </Stack>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Level
                    </Typography>
                    <Typography variant="body2">
                      Level {category.level}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={category.isActive ? 'Active' : 'Inactive'}
                      color={category.isActive ? 'success' : 'default'}
                      size="small"
                      variant={category.isActive ? 'filled' : 'outlined'}
                    />
                  </Box>
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
                      {category.productCount || 0}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Subcategories
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {category.children?.length || 0}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(category.createdAt)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(category.updatedAt)}
                    </Typography>
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