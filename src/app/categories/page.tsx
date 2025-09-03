'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  TrendingUp as TrendingIcon,
  LocalOffer as OfferIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
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
  Typography,
  CardContent,
  Breadcrumbs,
  Link as MuiLink,
  Fade,
  Grow,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

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

// Category icons and colors mapping
const categoryConfig = {
  'art-collectibles': {
    icon: 'solar:palette-round-bold-duotone',
    gradient: ['#FF6B6B', '#4ECDC4'],
    description: 'Paintings, sculptures, and rare collectibles'
  },
  'electronics': {
    icon: 'solar:smartphone-bold-duotone', 
    gradient: ['#4285F4', '#34A853'],
    description: 'Latest gadgets and electronics'
  },
  'vehicles': {
    icon: 'solar:car-bold-duotone',
    gradient: ['#FF4444', '#FF8A00'], 
    description: 'Cars, motorcycles, and boats'
  },
  'watches-jewelry': {
    icon: 'solar:crown-bold-duotone',
    gradient: ['#9C27B0', '#E91E63'],
    description: 'Luxury timepieces and fine jewelry'
  },
  'paintings': {
    icon: 'solar:palette-bold-duotone',
    gradient: ['#FF5722', '#FFC107'],
    description: 'Original artworks and paintings'
  },
  'classic-cars': {
    icon: 'solar:car-2-bold-duotone',
    gradient: ['#795548', '#FF9800'],
    description: 'Classic and vintage automobiles'
  },
  'motorcycles': {
    icon: 'solar:motorcycle-bold-duotone',
    gradient: ['#607D8B', '#9E9E9E'],
    description: 'Motorcycles and bikes'
  },
  'jewelry': {
    icon: 'solar:diamond-bold-duotone',
    gradient: ['#E91E63', '#9C27B0'],
    description: 'Fine jewelry and precious stones'
  },
  'sculptures': {
    icon: 'solar:figma-bold-duotone',
    gradient: ['#8BC34A', '#4CAF50'],
    description: 'Sculptures and 3D artworks'
  },
  'luxury-watches': {
    icon: 'solar:clock-circle-bold-duotone',
    gradient: ['#3F51B5', '#2196F3'],
    description: 'Premium luxury timepieces'
  }
};

const getDefaultConfig = (slug: string) => ({
  icon: 'solar:widget-4-bold-duotone',
  gradient: ['#9E9E9E', '#607D8B'],
  description: 'Discover amazing items in this category'
});

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

  const renderCategoryCard = (category: Category, index: number) => {
    const config = categoryConfig[category.slug as keyof typeof categoryConfig] || getDefaultConfig(category.slug);
    const isLarge = index < 4; // First 4 categories get larger cards
    
    return (
      <Grow in timeout={300 + index * 100} key={category.id}>
        <Grid item xs={12} sm={6} md={isLarge ? 6 : 4} lg={isLarge ? 3 : 4}>
          <Card
            sx={{
              cursor: 'pointer',
              height: isLarge ? 280 : 240,
              background: `linear-gradient(135deg, ${alpha(config.gradient[0], 0.1)} 0%, ${alpha(config.gradient[1], 0.05)} 100%)`,
              border: `1px solid ${alpha(config.gradient[0], 0.1)}`,
              position: 'relative',
              overflow: 'visible',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
                boxShadow: `0 20px 40px ${alpha(config.gradient[0], 0.15)}`,
                '& .category-icon': {
                  transform: 'scale(1.1) rotate(5deg)',
                },
                '& .category-stats': {
                  transform: 'translateY(-2px)',
                },
                '& .explore-button': {
                  background: `linear-gradient(135deg, ${config.gradient[0]} 0%, ${config.gradient[1]} 100%)`,
                  color: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 20px ${alpha(config.gradient[0], 0.3)}`,
                }
              },
            }}
            onClick={() => handleCategoryClick(category)}
          >
            {/* Background Pattern */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 120,
                height: 120,
                background: `linear-gradient(135deg, ${alpha(config.gradient[0], 0.05)} 0%, ${alpha(config.gradient[1], 0.02)} 100%)`,
                borderRadius: '50%',
                transform: 'translate(30px, -30px)',
              }}
            />

            <CardContent sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              zIndex: 2,
              p: 3
            }}>
              {/* Icon and Title */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  mb: 1
                }}>
                  <Box
                    className="category-icon"
                    sx={{
                      width: isLarge ? 56 : 48,
                      height: isLarge ? 56 : 48,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${config.gradient[0]} 0%, ${config.gradient[1]} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.3s ease',
                      boxShadow: `0 8px 24px ${alpha(config.gradient[0], 0.25)}`,
                    }}
                  >
                    <Iconify 
                      icon={config.icon} 
                      sx={{ 
                        fontSize: isLarge ? 28 : 24,
                        color: 'white'
                      }} 
                    />
                  </Box>
                  
                  {category.isFeatured && (
                    <Chip
                      label="Featured"
                      size="small"
                      sx={{
                        background: `linear-gradient(135deg, ${alpha('#FFD700', 0.2)} 0%, ${alpha('#FFA000', 0.2)} 100%)`,
                        border: `1px solid ${alpha('#FFD700', 0.3)}`,
                        color: '#F57F17',
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                </Box>

                <Typography 
                  variant={isLarge ? "h4" : "h5"} 
                  component="h3" 
                  sx={{
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${config.gradient[0]} 0%, ${config.gradient[1]} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    lineHeight: 1.2
                  }}
                >
                  {category.name}
                </Typography>

                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: isLarge ? '0.95rem' : '0.85rem',
                    lineHeight: 1.4,
                    mb: 2
                  }}
                >
                  {category.description || config.description}
                </Typography>
              </Box>

              {/* Stats */}
              <Stack 
                className="category-stats"
                direction="row" 
                spacing={1} 
                sx={{ 
                  mb: 3,
                  transition: 'transform 0.3s ease'
                }}
              >
                <Chip
                  icon={<TrendingIcon sx={{ fontSize: '16px !important' }} />}
                  label={`${category.productCount} Items`}
                  size="small"
                  sx={{
                    backgroundColor: alpha(config.gradient[0], 0.1),
                    border: `1px solid ${alpha(config.gradient[0], 0.2)}`,
                    color: config.gradient[0],
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: config.gradient[0]
                    }
                  }}
                />
                
                {/* Random auction count for demo */}
                <Chip
                  icon={<ScheduleIcon sx={{ fontSize: '16px !important' }} />}
                  label={`${Math.floor(category.productCount * 0.6)} Live`}
                  size="small"
                  sx={{
                    backgroundColor: alpha('#FF4444', 0.1),
                    border: `1px solid ${alpha('#FF4444', 0.2)}`,
                    color: '#FF4444',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: '#FF4444'
                    }
                  }}
                />
              </Stack>

              {/* Explore Button */}
              <Box sx={{ mt: 'auto' }}>
                <Button
                  className="explore-button"
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowIcon />}
                  sx={{
                    borderColor: alpha(config.gradient[0], 0.3),
                    color: config.gradient[0],
                    fontWeight: 600,
                    py: 1.25,
                    borderRadius: 3,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    '& .MuiButton-endIcon': {
                      transition: 'transform 0.3s ease',
                    },
                    '&:hover .MuiButton-endIcon': {
                      transform: 'translateX(4px)',
                    }
                  }}
                >
                  Explore Category
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grow>
    );
  };

  const renderSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(8)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card sx={{ height: 280 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} mb={2}>
                <Skeleton variant="rounded" width={48} height={48} />
                <Box>
                  <Skeleton variant="text" height={32} width={120} />
                  <Skeleton variant="text" height={20} width={80} />
                </Box>
              </Stack>
              <Skeleton variant="text" height={20} width="90%" sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} width="70%" sx={{ mb: 3 }} />
              <Stack direction="row" spacing={1} mb={3}>
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rounded" width={70} height={24} />
              </Stack>
              <Skeleton variant="rounded" height={42} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Organize categories: featured first, then by product count
  const organizedCategories = categories
    .sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.productCount - a.productCount;
    });

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Fade in timeout={800}>
          <Box mb={6}>
            <Breadcrumbs sx={{ mb: 2 }}>
              <MuiLink href="/" underline="hover" color="inherit">
                Home
              </MuiLink>
              <Typography color="text.primary">Categories</Typography>
            </Breadcrumbs>
            
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}
              >
                Browse Categories
              </Typography>
              <Typography 
                variant="h5" 
                color="text.secondary" 
                sx={{ 
                  fontWeight: 400,
                  maxWidth: 600,
                  mx: 'auto'
                }}
              >
                Discover amazing auction items across all categories and find exactly what you're looking for
              </Typography>
            </Box>

            {/* Quick Stats */}
            <Paper
              sx={{
                p: 3,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha('#1976d2', 0.05)} 0%, ${alpha('#42a5f5', 0.02)} 100%)`,
                border: `1px solid ${alpha('#1976d2', 0.1)}`,
              }}
            >
              <Grid container spacing={3} sx={{ textAlign: 'center' }}>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                      {categories.reduce((sum, cat) => sum + cat.productCount, 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Items
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF4444' }}>
                      {Math.floor(categories.reduce((sum, cat) => sum + cat.productCount, 0) * 0.6)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Live Auctions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                      {categories.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Categories
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Fade>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        {/* Categories Grid */}
        <Box>
          {loading ? (
            renderSkeleton()
          ) : organizedCategories.length > 0 ? (
            <Grid container spacing={3}>
              {organizedCategories.map((category, index) => renderCategoryCard(category, index))}
            </Grid>
          ) : (
            <Paper 
              sx={{ 
                p: 8, 
                textAlign: 'center',
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.5)} 0%, ${alpha(theme.palette.grey[50], 0.8)} 100%)`,
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}
              >
                <Iconify icon="solar:widget-4-bold-duotone" sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                No Categories Available
              </Typography>
              <Typography color="text.secondary" paragraph sx={{ fontSize: '1.1rem' }}>
                Categories are being set up. Please check back soon for amazing auction items.
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/')}
                sx={{ 
                  mt: 2,
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
                }}
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