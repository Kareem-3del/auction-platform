'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import {
  Box,
  Grid,
  Card,
  Chip,
  Paper,
  Stack,
  Alert,
  Button,
  Skeleton,
  Container,
  Typography,
  CardContent,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import Layout from 'src/components/layout/Layout';
import { Iconify } from 'src/components/iconify';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  productCount: number;
  childrenCount?: number;
  children?: Category[];
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
}

// Simple category icons mapping
const categoryIcons = {
  'art-collectibles': 'solar:palette-round-bold-duotone',
  'electronics': 'solar:smartphone-bold-duotone',
  'vehicles': 'solar:car-bold-duotone',
  'watches-jewelry': 'solar:crown-bold-duotone',
  'paintings': 'solar:palette-bold-duotone',
  'classic-cars': 'solar:car-2-bold-duotone',
  'motorcycles': 'solar:motorcycle-bold-duotone',
  'jewelry': 'solar:diamond-bold-duotone',
  'sculptures': 'solar:figma-bold-duotone',
  'luxury-watches': 'solar:clock-circle-bold-duotone',
};

export default function CategoriesPage() {
  const router = useRouter();
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/categories');
      const data = await response.json();

      if (data.success) {
        // Handle various API response formats
        let categoriesData: Category[] = [];
        
        if (Array.isArray(data.data)) {
          categoriesData = data.data;
        } else if (data.data && Array.isArray(data.data.data)) {
          categoriesData = data.data.data;
        } else if (data.data) {
          categoriesData = [data.data];
        }

        // Only show active categories with products
        const activeCategories = categoriesData.filter(cat => 
          cat.isActive && cat.productCount > 0
        );

        setCategories(activeCategories);
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError('Failed to fetch categories');
      console.error('Categories fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    router.push(`/categories/${category.slug}`);
  };

  const renderCategoryCard = (category: Category) => {
    const icon = categoryIcons[category.slug as keyof typeof categoryIcons] || 'solar:widget-4-bold-duotone';
    
    return (
      <Grid item xs={12} sm={6} md={4} key={category.id}>
        <Card
          sx={{
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: 2,
              transform: 'translateY(-2px)',
            },
          }}
          onClick={() => handleCategoryClick(category)}
        >
          <CardContent sx={{ flexGrow: 1, p: 3 }}>
            {/* Icon and Title */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify 
                  icon={icon} 
                  sx={{ 
                    fontSize: 24,
                    color: 'white'
                  }} 
                />
              </Box>
              
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="h6" 
                  component="h3" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 0.5,
                    color: 'text.primary'
                  }}
                >
                  {category.name}
                </Typography>
                
                {category.isFeatured && (
                  <Chip
                    label="Featured"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>

            {/* Description */}
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 3, lineHeight: 1.5 }}
            >
              {category.description || `Discover exciting auctions in ${category.name.toLowerCase()}`}
            </Typography>

            {/* Stats */}
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <Chip
                icon={<TrendingIcon sx={{ fontSize: '14px !important' }} />}
                label={`${category.productCount} Auctions`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
              <Chip
                icon={<ScheduleIcon sx={{ fontSize: '14px !important' }} />}
                label={`${Math.floor(category.productCount * 0.6)} Live`}
                size="small"
                variant="outlined" 
                color="error"
                sx={{ fontSize: '0.75rem' }}
              />
            </Stack>

            {/* Browse Button */}
            <Button
              fullWidth
              variant="outlined"
              endIcon={<ArrowIcon />}
              sx={{
                mt: 'auto',
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 2,
              }}
            >
              Browse Category
            </Button>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ height: 280 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Skeleton variant="rounded" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" height={28} width="80%" />
                  <Skeleton variant="text" height={20} width={60} />
                </Box>
              </Box>
              <Skeleton variant="text" height={20} width="100%" sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} width="80%" sx={{ mb: 3 }} />
              <Stack direction="row" spacing={1} mb={3}>
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rounded" width={70} height={24} />
              </Stack>
              <Skeleton variant="rounded" height={36} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Sort categories: featured first, then by product count
  const sortedCategories = categories.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return b.productCount - a.productCount;
  });

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <MuiLink href="/" underline="hover" color="inherit">
              Home
            </MuiLink>
            <Typography color="text.primary">Categories</Typography>
          </Breadcrumbs>
          
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Browse Categories
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Discover exciting auctions across all categories
          </Typography>
        </Box>

        {/* Quick Stats */}
        {!loading && categories.length > 0 && (
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Grid container spacing={3} sx={{ textAlign: 'center' }}>
              <Grid item xs={12} sm={4}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {categories.reduce((sum, cat) => sum + cat.productCount, 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Auctions
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
                  {Math.floor(categories.reduce((sum, cat) => sum + cat.productCount, 0) * 0.6)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Live Auctions
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                  {categories.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categories
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Categories Grid */}
        <Box>
          {loading ? (
            renderSkeleton()
          ) : sortedCategories.length > 0 ? (
            <Grid container spacing={3}>
              {sortedCategories.map(renderCategoryCard)}
            </Grid>
          ) : (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <CategoryIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No Categories Available
              </Typography>
              <Typography color="text.secondary" paragraph>
                Categories are being set up. Please check back soon.
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/')}
                sx={{ mt: 2 }}
              >
                Return Home
              </Button>
            </Paper>
          )}
        </Box>
      </Container>
    </Layout>
  );
}