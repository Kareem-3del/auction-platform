'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Button,
  Skeleton,
  Container,
  IconButton,
  Typography,
  CardContent,
} from '@mui/material';

import { CountdownTimer } from '../common/CountdownTimer';
import { UnifiedAuctionCard } from 'src/components/product-card/unified-auction-card';
import { useLocale } from 'src/hooks/useLocale';

interface Product {
  id: string;
  title: string;
  images: string[];
  estimatedValueMin: number;
  currentBid?: number;
  auctionStatus?: string;
  agent: {
    displayName: string;
  };
  auction?: {
    startTime: string;
    endTime: string;
    status: string;
  };
}

interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl: string | null;
  productCount: number;
  products: Product[];
}

const CATEGORY_THEMES = [
  {
    gradient: 'linear-gradient(135deg, #CE0F2E 0%, #B00C24 50%, #8A0A1C 100%)',
    buttonColor: '#FFE9E9',
  },
  {
    gradient: 'linear-gradient(135deg, #15171A 0%, #495361 50%, #637381 100%)',
    buttonColor: '#CE0F2E',
  },
  {
    gradient: 'linear-gradient(135deg, #CE0F2E 0%, #8A0A1C 50%, #637381 100%)',
    buttonColor: '#FFE9E9',
  },
  {
    gradient: 'linear-gradient(135deg, #637381 0%, #495361 50%, #15171A 100%)',
    buttonColor: '#CE0F2E',
  },
  {
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #CE0F2E 50%, #B00C24 100%)',
    buttonColor: '#FFE9E9',
  },
  {
    gradient: 'linear-gradient(135deg, #8A0A1C 0%, #CE0F2E 50%, #FF6B6B 100%)',
    buttonColor: '#FFE9E9',
  },
];

export function FeaturedSection() {
  const router = useRouter();
  const { t } = useLocale();
  const [featuredCategories, setFeaturedCategories] = useState<FeaturedCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeaturedCategories = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setLoading(true);
      
      const response = await fetch('/api/categories/featured?limit=6&productsPerCategory=4', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch featured categories');

      const data = await response.json();
      
      if (data.success && data.data && data.data.data) {
        setFeaturedCategories(data.data.data);
      } else {
        console.error('Failed to fetch featured categories:', data.message);
        setFeaturedCategories([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch featured categories:', error);
      }
      setFeaturedCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedCategories();
  }, [fetchFeaturedCategories]);

  if (loading) {
    return (
      <Box sx={{ py: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          textAlign="center" 
          gutterBottom
          sx={{ mb: 6, fontWeight: 'bold' }}
        >
          {t('homepage.sections.featuredCategories')}
        </Typography>
        
        {[...Array(3)].map((_, categoryIdx) => (
          <Box key={`loading-${categoryIdx}`} sx={{ mb: 6 }}>
            <Grid container spacing={3} sx={{ height: { xs: 'auto', md: 400 } }}>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />
              </Grid>
              <Grid item xs={12} md={8}>
                <Grid container spacing={1.5} sx={{ height: '100%' }}>
                  {[...Array(4)].map((_, skelIdx) => (
                    <Grid item xs={6} key={skelIdx} sx={{ height: '50%' }}>
                      <ProductSkeleton />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        ))}
      </Box>
    );
  }

  if (featuredCategories.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h2" 
          gutterBottom
          sx={{ mb: 4, fontWeight: 'bold' }}
        >
          {t('homepage.sections.featuredCategories')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No featured categories available at the moment.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="xl">
        <Typography 
          variant="h3" 
          component="h2" 
          textAlign="center" 
          gutterBottom
          sx={{ mb: 6, fontWeight: 'bold' }}
        >
          {t('homepage.sections.featuredCategories')}
        </Typography>
      
      {featuredCategories.map((category, categoryIndex) => {
        const theme = CATEGORY_THEMES[categoryIndex % CATEGORY_THEMES.length];
        
        return (
          <Box key={category.id} sx={{ mb: 6 }}>
            <Grid container spacing={3} sx={{ height: { xs: 'auto', md: 400 } }}>
              {/* Category Card - Left Side */}
              <Grid item xs={12} md={4}>
                <CategoryCard 
                  category={category}
                  theme={theme}
                  onViewAll={() => router.push(`/categories/${category.slug}`)}
                />
              </Grid>

              {/* Products Grid - Right Side */}
              <Grid item xs={12} md={8}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Grid container spacing={1.5} sx={{ flexGrow: 1 }}>
                    {category.products.length > 0 ? (
                      category.products.map((product) => (
                        <Grid item xs={6} key={product.id} sx={{ height: { xs: 200, md: '50%' } }}>
                          <UnifiedAuctionCard 
                            product={{
                              id: product.id,
                              title: product.title,
                              category: { name: 'Featured' },
                              images: Array.isArray(product.images) ? product.images : [product.images],
                              estimatedValueMin: product.estimatedValueMin,
                              estimatedValueMax: product.estimatedValueMax,
                              currentBid: product.currentBid,
                              agent: product.agent,
                              viewCount: product.viewCount,
                              favoriteCount: product.favoriteCount,
                              auction: product.auction,
                              auctionStatus: product.auctionStatus,
                            }}
                            variant="featured"
                            size="compact"
                            onClick={() => router.push(`/products/${product.id}`)}
                            onFavorite={() => console.log('Toggle favorite for product:', product.id)}
                          />
                        </Grid>
                      ))
                    ) : (
                      [...Array(4)].map((_, index) => (
                        <Grid item xs={6} key={`empty-${index}`} sx={{ height: { xs: 200, md: '50%' } }}>
                          <EmptyProductCard />
                        </Grid>
                      ))
                    )}
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
      })}
      </Container>
    </Box>
  );
}

// Category Card Component
interface CategoryCardProps {
  category: FeaturedCategory;
  theme: { gradient: string; buttonColor: string };
  onViewAll: () => void;
}

function CategoryCard({ category, theme, onViewAll }: CategoryCardProps) {
  return (
    <Card
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: { xs: 300, md: 400 },
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: theme.gradient,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
        },
      }}
      onClick={onViewAll}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 4,
          color: 'white',
        }}
      >
        {/* Top section with category name */}
        <Box sx={{ 
          textAlign: 'center', 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center' 
        }}>
          <Typography
            variant="h2"
            component="h3"
            sx={{
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: 3,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
              lineHeight: 1.1,
              mb: 2,
            }}
          >
{category.name.toUpperCase()}
          </Typography>
        </Box>

        {/* Bottom section with count and button */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              opacity: 0.9,
              fontWeight: 400,
              fontSize: '1.1rem',
            }}
          >
            {category.productCount} Products
          </Typography>

          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: theme.buttonColor,
              color: theme.buttonColor === '#FFE9E9' ? '#CE0F2E' : 'white',
              fontWeight: 'bold',
              py: 1.5,
              borderRadius: 2,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              fontSize: '0.9rem',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: theme.buttonColor === '#FFE9E9' ? '#FFD6D6' : theme.buttonColor,
                opacity: theme.buttonColor === '#FFE9E9' ? 1 : 0.9,
                boxShadow: `0 4px 16px ${theme.buttonColor === '#FFE9E9' ? '#CE0F2E' : theme.buttonColor}40`,
              },
              transition: 'all 0.2s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onViewAll();
            }}
          >
            VIEW ALL ITEMS
          </Button>
        </Box>
      </Box>
    </Card>
  );
}

// Product Card Component
interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
  const primaryImage = Array.isArray(product.images) 
    ? product.images[0] 
    : typeof product.images === 'string' 
    ? JSON.parse(product.images)[0] 
    : '/api/placeholder/300/200';

  const isAuction = product.auctionStatus && ['SCHEDULED', 'LIVE', 'ENDED'].includes(product.auctionStatus);
  const currentPrice = isAuction ? product.currentBid || product.estimatedValueMin : product.estimatedValueMin;
  const isEnded = product.auctionStatus === 'ENDED';

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': {
          boxShadow: 4,
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
        },
      }}
      onClick={onClick}
    >
      {/* Image Section */}
      <Box
        sx={{
          height: '60%',
          backgroundImage: `url(${primaryImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#f5f5f5',
          position: 'relative',
        }}
      >
        {/* Status Badge */}
        {isEnded ? (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'error.main',
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            AUCTION ENDED
          </Box>
        ) : isAuction && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'success.main',
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            LIVE AUCTION
          </Box>
        )}

        {/* Action Buttons */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.5,
          }}
        >
          <IconButton
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'white',
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon icon="mdi:arrow-top-right" width={16} />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'white',
                color: 'primary.main',
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon icon="mdi:magnify" width={16} />
          </IconButton>
        </Box>
      </Box>

      {/* Content Section */}
      <CardContent sx={{ 
        p: 2, 
        height: '40%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between' 
      }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            fontSize: '0.9rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            mb: 1,
            color: 'text.primary',
          }}
        >
          {product.title}
        </Typography>

        {/* Countdown Timer for auctions */}
        {isAuction && product.auction && (
          <Box sx={{ mb: 1 }}>
            <CountdownTimer
              startTime={product.auction.startTime ? new Date(product.auction.startTime) : undefined}
              endTime={product.auction.endTime ? new Date(product.auction.endTime) : undefined}
              size="small"
              variant="compact"
            />
          </Box>
        )}

        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: '0.75rem',
              mb: 0.5,
            }}
          >
            {isEnded ? 'Auction Ended' : 'Current Bid'}
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              color: isEnded ? 'error.main' : 'primary.main',
              fontSize: '1rem',
            }}
          >
            {isEnded ? 'Ended' : `$${currentPrice?.toLocaleString() || 'N/A'}`}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function ProductSkeleton() {
  return (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <Skeleton variant="rectangular" height="60%" />
      <CardContent sx={{ p: 2, height: '40%' }}>
        <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={16} width="60%" sx={{ mb: 1 }} />
        <Skeleton variant="text" height={24} width="40%" />
      </CardContent>
    </Card>
  );
}

// Empty Product Card (when no products available)
function EmptyProductCard() {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        border: '2px dashed',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Icon 
          icon="mdi:package-variant" 
          width={32} 
          height={32} 
          style={{ opacity: 0.3, marginBottom: 8 }} 
        />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          No products yet
        </Typography>
      </Box>
    </Card>
  );
}