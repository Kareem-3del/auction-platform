'use client';

import type { FC } from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productsAPI, isSuccessResponse } from 'src/lib/api-client';
import type { ProductCard } from 'src/types/common';

import {
  AccessTime as TimeIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import {
  Box,
  Grid,
  Alert,
  Button,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material';

import { EndingSoonCard } from 'src/components/product-card/ending-soon-card';

// Use Product type from API types

interface EndingSoonSectionProps {
  limit?: number;
  showHeader?: boolean;
  containerMaxWidth?: string | false;
}

export const EndingSoonSection: FC<EndingSoonSectionProps> = ({
  limit = 8,
  showHeader = true,
  containerMaxWidth = '1536px',
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEndingSoonProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productsAPI.getShowcaseProducts('ending-soon', limit);
        
        if (isSuccessResponse(response)) {
          const products = response.data.data || [];
          console.log('EndingSoonSection products:', products, 'isArray:', Array.isArray(products));
          setProducts(Array.isArray(products) ? products : []);
        } else {
          throw new Error(response.error.message || 'Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching ending soon products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchEndingSoonProducts();
  }, [limit]);

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleViewAll = () => {
    router.push('/auctions?filter=ending-soon');
  };

  if (loading) {
    return (
      <Container maxWidth={containerMaxWidth as any} sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading ending soon auctions...
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

  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#f8f9fa' }}>
      <Container maxWidth={containerMaxWidth as any}>
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
                  <TimeIcon sx={{ color: 'white', fontSize: 24 }} />
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
                    Ending Soon
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '1rem', md: '1.1rem' },
                    }}
                  >
                    Don&apos;t miss these final opportunities
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="outlined"
                endIcon={<ArrowIcon />}
                onClick={handleViewAll}
                sx={{
                  borderColor: '#CE0E2D',
                  color: '#CE0E2D',
                  fontWeight: 500,
                  px: 4,
                  py: 1,
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#CE0E2D',
                    backgroundColor: 'rgba(206, 14, 45, 0.04)',
                  },
                }}
              >
                View All Ending Soon
              </Button>
            </Box>
          </Box>
        )}

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {Array.isArray(products) ? products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <EndingSoonCard
                id={product.id}
                title={product.title}
                category={product.category.name}
                image={Array.isArray(product.images) ? product.images[0] : product.images}
                endTime={product.endTime || product.timeRemaining?.endTime}
                currentBid={typeof product.currentBid === 'string' ? parseFloat(product.currentBid) : (product.currentBid || 0)}
                bidCount={typeof product.bidCount === 'string' ? parseInt(product.bidCount) : (product.bidCount || product._count?.bids || 0)}
                viewCount={typeof product.viewCount === 'string' ? parseInt(product.viewCount) : (product.viewCount || 0)}
                onClick={() => handleProductClick(product.id)}
              />
            </Grid>
          )) : null}
        </Grid>

        {Array.isArray(products) && products.length >= limit && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 4, md: 6 } }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowIcon />}
              onClick={handleViewAll}
              sx={{
                backgroundColor: '#CE0E2D',
                color: 'white',
                fontWeight: 600,
                px: 6,
                py: 1.5,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#B00C24',
                  boxShadow: 'none',
                },
              }}
            >
              Explore All Urgent Auctions
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};