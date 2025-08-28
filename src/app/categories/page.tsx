'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Category as CategoryIcon,
  ArrowForward as ArrowIcon,
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
  CardMedia,
  Typography,
  CardContent,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';

import Layout from 'src/components/layout/Layout';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
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

export default function CategoriesPage() {
  const router = useRouter();
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

      const response = await fetch('/api/categories?includeStats=true');
      const data = await response.json();

      if (data.success) {
        // Handle the nested data structure from API
        const categoriesData = Array.isArray(data.data.data) ? data.data.data : data.data;
        setCategories(categoriesData);
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
    const totalItems = category.productCount + (category.childrenCount || 0);

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
        <Card
          sx={{
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': { 
              boxShadow: 6,
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease-in-out',
            },
          }}
          onClick={() => handleCategoryClick(category)}
        >
          {category.imageUrl ? (
            <CardMedia
              component="img"
              height="160"
              image={category.imageUrl}
              alt={category.name}
              sx={{ objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                height: 160,
                bgcolor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CategoryIcon sx={{ fontSize: 48, color: 'grey.400' }} />
            </Box>
          )}

          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {category.name}
            </Typography>

            {category.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                {category.description}
              </Typography>
            )}

            {/* Stats */}
            <Stack direction="row" spacing={1} mb={2}>
              {category.productCount > 0 && (
                <Chip 
                  label={`${category.productCount} Products`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {(category as any).auctionCount > 0 && (
                <Chip 
                  label={`${(category as any).auctionCount} Auctions`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Stack>

            {/* Subcategories indicator */}
            {category.children && category.children.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                {category.children.length} subcategories
              </Typography>
            )}

            <Button
              fullWidth
              variant="outlined"
              endIcon={<ArrowIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleCategoryClick(category);
              }}
              sx={{ mt: 'auto' }}
            >
              Explore {totalItems.toLocaleString()} Items
            </Button>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(12)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card sx={{ height: 320 }}>
            <Skeleton variant="rectangular" height={160} />
            <CardContent>
              <Skeleton variant="text" height={28} sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} width="80%" sx={{ mb: 2 }} />
              <Stack direction="row" spacing={1} mb={2}>
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rounded" width={80} height={24} />
              </Stack>
              <Skeleton variant="rounded" height={36} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const organizeCategories = (categories: Category[]) => {
    if (!Array.isArray(categories)) return [];
    const rootCategories = categories.filter(cat => !cat.parent);
    const sortedCategories = rootCategories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return sortedCategories;
  };

  const topCategories = organizeCategories(categories);

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
          
          <Typography variant="h3" component="h1" gutterBottom>
            Browse Categories
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Discover items across all categories and find exactly what you're looking for
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Categories Grid */}
        <Box mb={4}>
          {loading ? (
            renderSkeleton()
          ) : topCategories.length > 0 ? (
            <Grid container spacing={3}>
              {topCategories.map(renderCategoryCard)}
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
                variant="outlined"
                onClick={() => router.push('/')}
                sx={{ mt: 2 }}
              >
                Return Home
              </Button>
            </Paper>
          )}
        </Box>

        {/* Popular Categories Section */}
        {!loading && topCategories.length > 0 && (
          <Box mt={8}>
            <Typography variant="h4" component="h2" gutterBottom textAlign="center">
              Most Popular Categories
            </Typography>
            <Typography variant="h6" color="text.secondary" textAlign="center" paragraph sx={{ mb: 4 }}>
              Categories with the most active auctions and products
            </Typography>

            <Grid container spacing={3}>
              {topCategories
                .sort((a, b) => (b.productCount + (b as any).auctionCount) - (a.productCount + (a as any).auctionCount))
                .slice(0, 8)
                .map(renderCategoryCard)}
            </Grid>
          </Box>
        )}
      </Container>
    </Layout>
  );
}