'use client';

import type { FC } from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Schedule as ScheduleIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import {
  Box,
  Grid,
  Alert,
  Button,
  Snackbar,
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
  startTime: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  viewCount: number;
}

interface ComingSoonSectionProps {
  limit?: number;
  showHeader?: boolean;
  containerMaxWidth?: string | false;
}

export const ComingSoonSection: FC<ComingSoonSectionProps> = ({
  limit = 8,
  showHeader = true,
  containerMaxWidth = '1536px',
}) => {
  const router = useRouter();
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchComingSoonProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/auctions?auctionStatus=SCHEDULED&sortBy=newest&limit=${limit}`);
        
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
        console.error('Error fetching coming soon products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchComingSoonProducts();
  }, [limit]);

  const handleProductClick = (productId: string) => {
    router.push(`/auctions/${productId}`);
  };

  const handleViewAll = () => {
    router.push('/auctions?filter=coming-soon');
  };

  const handleNotifyMe = async (productId: string) => {
    try {
      // Here you would make an API call to set up notifications
      // For now, we'll just show a success message
      setNotificationMessage('You&apos;ll be notified when this auction goes live!');
    } catch (err) {
      setNotificationMessage('Failed to set up notification. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth={containerMaxWidth as any} sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading upcoming auctions...
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
                  <ScheduleIcon sx={{ color: 'white', fontSize: 24 }} />
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
                    {t('homepage.sections.comingSoon')}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '1rem', md: '1.1rem' },
                    }}
                  >
                    {t('homepage.sections.getEarlyPreviews')}
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
                View All Coming Soon
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
                  favoriteCount: Math.floor((typeof product.viewCount === 'string' ? parseInt(product.viewCount) : (product.viewCount || 0)) / 2),
                  auction: {
                    startTime: product.startTime,
                    endTime: new Date(new Date(product.startTime).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'SCHEDULED',
                  },
                }}
                variant="upcoming"
                onClick={() => handleProductClick(product.id)}
                onFavorite={() => handleNotifyMe(product.id)}
              />
            </Grid>
          ))}
        </Grid>

        {products.length >= limit && (
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
              Explore All Upcoming Auctions
            </Button>
          </Box>
        )}

        <Snackbar
          open={!!notificationMessage}
          autoHideDuration={4000}
          onClose={() => setNotificationMessage(null)}
          message={notificationMessage}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setNotificationMessage(null)}
            >
              Close
            </Button>
          }
          sx={{
            '& .MuiSnackbarContent-root': {
              bgcolor: 'success.main',
              color: 'success.contrastText',
            },
          }}
        />
      </Container>
    </Box>
  );
};