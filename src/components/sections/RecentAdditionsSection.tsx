'use client';

import type { FC } from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  FiberNew as NewIcon,
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

import { UnifiedAuctionCard } from 'src/components/product-card/unified-auction-card';
import { useLocale } from 'src/hooks/useLocale';

interface Product {
  id: string;
  title: string;
  images: string[];
  category: { name: string };
  estimatedValueMin: number;
  estimatedValueMax: number;
  viewCount: number;
  createdAt: string;
}

interface RecentAdditionsSectionProps {
  limit?: number;
  showHeader?: boolean;
  containerMaxWidth?: string | false;
}

export const RecentAdditionsSection: FC<RecentAdditionsSectionProps> = ({
  limit = 4,
  showHeader = true,
  containerMaxWidth = 'xl',
}) => {
  const router = useRouter();
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/auctions?sortBy=newest&limit=${limit}`);
        
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
        console.error('Error fetching recent products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProducts();
  }, [limit]);

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleViewAll = () => {
    router.push('/auctions?filter=recent');
  };

  const isNewProduct = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours < 48; // Consider new if added within last 48 hours
  };

  if (loading) {
    return (
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#0F1419' }}>
        <Container maxWidth={containerMaxWidth as any}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={40} sx={{ color: '#CE0E2D' }} />
            <Typography variant="body1" sx={{ ml: 2, color: 'white' }}>
              {t('common.loading')}
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#0F1419' }}>
        <Container maxWidth={containerMaxWidth as any}>
          <Alert 
            severity="error" 
            sx={{ mb: 4 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => window.location.reload()}
              >
                {t('common.retry', 'Retry')}
              </Button>
            }
          >
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#0F1419' }}>
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
                  <NewIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography
                    variant="h3"
                    component="h2"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.75rem', md: '2.25rem' },
                      color: 'white',
                      background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {t('homepage.sections.latestAdditions')}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ 
                      fontWeight: 500,
                      fontSize: { xs: '0.9rem', md: '1.1rem' },
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {t('homepage.sections.recentlyAdded')}
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
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 3,
                  '&:hover': {
                    borderColor: '#CE0E2D',
                    backgroundColor: 'rgba(206, 14, 45, 0.04)',
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                View All Recent
              </Button>
            </Box>
          </Box>
        )}

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <UnifiedAuctionCard
                product={{
                  id: product.id,
                  title: product.title,
                  category: { name: product.category.name },
                  images: Array.isArray(product.images) ? product.images : [product.images],
                  estimatedValueMin: typeof product.estimatedValueMin === 'string' ? parseFloat(product.estimatedValueMin) : (product.estimatedValueMin || 0),
                  estimatedValueMax: typeof product.estimatedValueMax === 'string' ? parseFloat(product.estimatedValueMax) : (product.estimatedValueMax || 0),
                  currentBid: undefined,
                  agent: {
                    displayName: 'Auction House',
                    businessName: 'Auction House',
                    logoUrl: '',
                    rating: 4.5,
                  },
                  viewCount: typeof product.viewCount === 'string' ? parseInt(product.viewCount) : (product.viewCount || 0),
                  favoriteCount: Math.floor((typeof product.viewCount === 'string' ? parseInt(product.viewCount) : (product.viewCount || 0)) / 3),
                }}
                variant="recent"
                onClick={() => handleProductClick(product.id)}
                onFavorite={() => console.log('Toggle favorite for product:', product.id)}
              />
            </Grid>
          ))}
        </Grid>

      </Container>
    </Box>
  );
};