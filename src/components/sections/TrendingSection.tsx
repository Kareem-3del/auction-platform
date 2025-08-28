'use client';

import type { FC } from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Grid,
  Alert,
  Button,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Star as StarIcon,
  ArrowForward as ArrowIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';

import { FeaturedCard } from 'src/components/product-card/featured-card';

interface Product {
  id: string;
  title: string;
  images: string[];
  category: { name: string };
  estimatedValueMin: number;
  estimatedValueMax: number;
  currentBid?: number;
  agent: {
    displayName: string;
    businessName: string;
    logoUrl: string;
    rating: number;
  };
  viewCount: number;
  favoriteCount: number;
}

interface TrendingSectionProps {
  limit?: number;
  showHeader?: boolean;
  containerMaxWidth?: string | false;
  section?: 'trending' | 'featured';
}

export const TrendingSection: FC<TrendingSectionProps> = ({
  limit = 6,
  showHeader = true,
  containerMaxWidth = '1536px',
  section = 'trending',
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/products/showcase?section=${section}&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          const products = data.data?.data?.data || [];
          setProducts(Array.isArray(products) ? products : []);
        } else {
          throw new Error(data.message || 'Failed to fetch products');
        }
      } catch (err) {
        console.error(`Error fetching ${section} products:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, [limit, section]);

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleViewAll = () => {
    router.push(`/products?filter=${section}`);
  };

  const handleFavorite = async (productId: string) => {
    // Here you would make an API call to toggle favorite status
    console.log('Toggle favorite for product:', productId);
  };

  if (loading) {
    return (
      <Container maxWidth={containerMaxWidth as any} sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading {section} products...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth={containerMaxWidth as any} sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 4 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (products.length === 0) {
    return null;
  }

  const sectionConfig = {
    trending: {
      title: 'Trending Auctions',
      subtitle: 'Most Popular Items',
      color: '#CE0E2D',
      icon: TrendingIcon,
      buttonText: 'View All Trending',
    },
    featured: {
      title: 'Featured Collection',
      subtitle: 'Editor\'s Choice',
      color: '#CE0E2D',
      icon: StarIcon,
      buttonText: 'View All Featured',
    },
  };

  const config = sectionConfig[section];
  const IconComponent = config.icon;

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#ffffff' }}>
      <Container maxWidth="xl">
        {showHeader && (
          <Box sx={{ mb: { xs: 3, md: 6 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(206, 14, 45, 0.3)',
                  }}
                >
                  <IconComponent sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography
                    variant="h3"
                    component="h2"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.75rem', md: '2.25rem' },
                      color: '#0F1419',
                      mb: 0.5,
                    }}
                  >
                    {config.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '1rem', md: '1.1rem' },
                    }}
                  >
                    {config.subtitle}
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="outlined"
                endIcon={<ArrowIcon />}
                onClick={handleViewAll}
                sx={{
                  borderColor: config.color,
                  color: config.color,
                  fontWeight: 500,
                  px: 4,
                  py: 1,
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: config.color,
                    backgroundColor: 'rgba(206, 14, 45, 0.04)',
                  },
                }}
              >
                {config.buttonText}
              </Button>
            </Box>
          </Box>
        )}

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <FeaturedCard
                id={product.id}
                title={product.title}
                category={product.category.name}
                image={Array.isArray(product.images) ? product.images[0] : product.images}
                estimatedValueMin={typeof product.estimatedValueMin === 'string' ? parseFloat(product.estimatedValueMin) : (product.estimatedValueMin || 0)}
                estimatedValueMax={typeof product.estimatedValueMax === 'string' ? parseFloat(product.estimatedValueMax) : (product.estimatedValueMax || 0)}
                currentBid={typeof product.currentBid === 'string' ? parseFloat(product.currentBid) : product.currentBid}
                agent={{
                  name: product.agent.businessName || product.agent.displayName,
                  avatar: product.agent.logoUrl,
                  rating: typeof product.agent.rating === 'string' ? parseFloat(product.agent.rating) : (product.agent.rating || 4.5),
                  isVerified: true, // Mock verification status
                }}
                viewCount={product.viewCount}
                favoriteCount={product.favoriteCount}
                isFavorited={false} // Mock favorite status
                isTrending={section === 'trending'}
                onClick={() => handleProductClick(product.id)}
                onFavorite={() => handleFavorite(product.id)}
              />
            </Grid>
          ))}
        </Grid>

      </Container>
    </Box>
  );
};