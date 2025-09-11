'use client';

import type { FC } from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auctionsAPI, isSuccessResponse } from 'src/lib/api-client';
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

import { UnifiedAuctionCard } from 'src/components/product-card/unified-auction-card';
import { useLocale } from 'src/hooks/useLocale';

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
  const { t, isRTL } = useLocale();
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEndingSoonProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await auctionsAPI.getAuctions({ 
          sortBy: 'ending_soon', 
          limit,
          auctionStatus: 'LIVE'
        });
        
        if (isSuccessResponse(response)) {
          const products = response.data || [];
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
            {t('homepage.sections.loadingEndingSoon')}
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
              {t('homepage.sections.retry')}
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
    <Box sx={{ 
      py: { xs: 8, md: 12 }, 
      background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.02) 0%, rgba(255, 68, 68, 0.02) 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(206, 14, 45, 0.04) 0%, transparent 50%)',
        pointerEvents: 'none',
      }
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, position: 'relative', zIndex: 1 }}>
        {showHeader && (
          <Box sx={{ mb: { xs: 4, md: 8 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 3,
              mb: 2,
              direction: isRTL ? 'rtl' : 'ltr',
            }}>
              <Box>
                <Typography
                  variant="h2"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    color: '#0F1419',
                    mb: 1,
                    lineHeight: 1.3,
                    letterSpacing: '-0.025em',
                  }}
                >
                  {t('homepage.sections.endingSoon')}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ 
                    fontSize: '1rem',
                    fontWeight: 400,
                    opacity: 0.8,
                  }}
                >
                  {t('homepage.sections.endingSoonSubtitle')}
                </Typography>
              </Box>
              
              <Button
                variant="outlined"
                endIcon={isRTL ? undefined : <ArrowIcon />}
                startIcon={isRTL ? <ArrowIcon sx={{ transform: 'rotate(180deg)' }} /> : undefined}
                onClick={handleViewAll}
                sx={{
                  borderColor: '#CE0E2D',
                  color: '#CE0E2D',
                  fontWeight: 600,
                  px: { xs: 3, md: 5 },
                  py: { xs: 1, md: 1.5 },
                  textTransform: 'none',
                  borderRadius: 3,
                  borderWidth: 2,
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  '&:hover': {
                    borderColor: '#CE0E2D',
                    borderWidth: 2,
                    backgroundColor: 'rgba(206, 14, 45, 0.06)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(206, 14, 45, 0.2)',
                  },
                }}
              >
                {t('homepage.sections.viewAllEndingSoon')}
              </Button>
            </Box>
          </Box>
        )}

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {Array.isArray(products) ? products.map((product) => (
            <Grid item xs={12} sm={6} lg={4} xl={3} key={product.id}>
              <UnifiedAuctionCard
                product={{
                  id: product.id,
                  title: product.title,
                  category: { name: product.category.name },
                  images: Array.isArray(product.images) ? product.images : [product.images],
                  estimatedValueMin: typeof product.estimatedValueMin === 'string' ? parseFloat(product.estimatedValueMin) : (product.estimatedValueMin || 0),
                  estimatedValueMax: typeof product.estimatedValueMax === 'string' ? parseFloat(product.estimatedValueMax) : (product.estimatedValueMax || 0),
                  currentBid: typeof product.currentBid === 'string' ? parseFloat(product.currentBid) : product.currentBid,
                  agent: {
                    displayName: product.agent?.displayName || 'Agent',
                    businessName: product.agent?.businessName,
                    logoUrl: product.agent?.logoUrl || '',
                    rating: typeof product.agent?.rating === 'string' ? parseFloat(product.agent.rating) : (product.agent?.rating || 4.5),
                  },
                  viewCount: typeof product.viewCount === 'string' ? parseInt(product.viewCount) : (product.viewCount || 0),
                  favoriteCount: typeof product.favoriteCount === 'string' ? parseInt(product.favoriteCount) : (product.favoriteCount || 0),
                  auction: {
                    startTime: product.startTime || new Date().toISOString(),
                    endTime: product.endTime || product.timeRemaining?.endTime || new Date().toISOString(),
                    status: 'LIVE',
                  },
                }}
                variant="ending"
                onClick={() => handleProductClick(product.id)}
                onFavorite={() => console.log('Toggle favorite for product:', product.id)}
              />
            </Grid>
          )) : null}
        </Grid>

        {Array.isArray(products) && products.length >= limit && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 6, md: 10 } }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowIcon />}
              onClick={handleViewAll}
              sx={{
                background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
                color: 'white',
                fontWeight: 700,
                px: { xs: 6, md: 8 },
                py: { xs: 1.5, md: 2 },
                textTransform: 'none',
                borderRadius: 4,
                boxShadow: '0 6px 24px rgba(206, 14, 45, 0.3)',
                fontSize: { xs: '1rem', md: '1.1rem' },
                '&:hover': {
                  background: 'linear-gradient(135deg, #b00c26, #e63939)',
                  boxShadow: '0 8px 32px rgba(206, 14, 45, 0.4)',
                  transform: 'translateY(-3px)',
                },
              }}
            >
              {t('homepage.sections.exploreAllUrgent')}
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};