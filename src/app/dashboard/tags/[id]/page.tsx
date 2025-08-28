'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Edit as EditIcon,
  Label as TagIcon,
  Delete as DeleteIcon,
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
  Divider,
  Typography,
  IconButton,
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

export default function ViewTagPage() {
  const router = useRouter();
  const params = useParams();
  const tagId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState<Tag | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTag = async () => {
      try {
        const data = await apiClient.get(`/api/tags/${tagId}`);

        if (data.success) {
          setTag(data.data);
        } else {
          setError(data.error?.message || 'Failed to load tag');
        }
      } catch (error) {
        console.error('Error loading tag:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadTag();
  }, [tagId]);

  const handleBack = () => {
    router.push('/dashboard/tags');
  };

  const handleEdit = () => {
    router.push(`/dashboard/tags/${tagId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tag?')) {
      return;
    }

    try {
      const data = await apiClient.delete(`/api/tags/${tagId}`);

      if (data.success) {
        router.push('/dashboard/tags');
      } else {
        setError(data.error?.message || 'Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
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

  if (error || !tag) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Tag not found'}
          </Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back to Tags
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
                {tag.name}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={tag.isActive ? 'Active' : 'Inactive'}
                  color={tag.isActive ? 'success' : 'default'}
                  variant={tag.isActive ? 'filled' : 'outlined'}
                />
                <Chip
                  label={tag.name}
                  size="small"
                  icon={<TagIcon />}
                  sx={{
                    backgroundColor: tag.color,
                    color: 'white',
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }}
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
                  {tag.description}
                </Typography>
              </Card>

              {/* Color Information */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Color & Appearance
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Color Value
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          backgroundColor: tag.color,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      <Typography variant="body1" fontFamily="monospace">
                        {tag.color}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tag Previews
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Chip
                        label={tag.name}
                        size="small"
                        icon={<TagIcon />}
                        sx={{
                          backgroundColor: tag.color,
                          color: 'white',
                          '& .MuiChip-icon': {
                            color: 'white',
                          },
                        }}
                      />
                      <Chip
                        label={tag.name}
                        size="medium"
                        icon={<TagIcon />}
                        sx={{
                          backgroundColor: tag.color,
                          color: 'white',
                          '& .MuiChip-icon': {
                            color: 'white',
                          },
                        }}
                      />
                      <Chip
                        label={tag.name}
                        variant="outlined"
                        size="small"
                        icon={<TagIcon />}
                        sx={{
                          borderColor: tag.color,
                          color: tag.color,
                          '& .MuiChip-icon': {
                            color: tag.color,
                          },
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Grid>

          {/* Right Column - Details */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Basic Info */}
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
                      Status
                    </Typography>
                    <Chip
                      label={tag.isActive ? 'Active' : 'Inactive'}
                      color={tag.isActive ? 'success' : 'default'}
                      size="small"
                      variant={tag.isActive ? 'filled' : 'outlined'}
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Color
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 0.5,
                          backgroundColor: tag.color,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      <Typography variant="body2" fontFamily="monospace">
                        {tag.color}
                      </Typography>
                    </Stack>
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
                      {tag.productCount || 0}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(tag.createdAt)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(tag.updatedAt)}
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