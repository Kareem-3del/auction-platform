'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Grid,
  Card,
  Skeleton,
  Typography,
  CardContent,
} from '@mui/material';

import { FeaturedCategoryCard } from './FeaturedCategoryCard';

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
}

interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
}

const STATIC_CATEGORY: FeaturedCategory = {
  id: 'cmeu9rs7f0000gz9rjiittxrj',
  name: 'Art & Collectibles',
  slug: 'art-collectibles',
  imageUrl: null,
  productCount: 4,
};

export function OptimizedFeaturedSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      setLoading(true);
      
      const response = await fetch(`/api/auctions?categoryId=${STATIC_CATEGORY.id}&limit=4`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const productsData = data.data.data || data.data.products || data.data || [];
        setProducts(productsData.slice(0, 4));
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <Box sx={{ py: 6 }}>
      <Grid container spacing={3} sx={{ height: 400 }}>
        {/* Category Card - Left Side */}
        <Grid item xs={12} md={4}>
          <Box sx={{ height: '100%' }}>
            <FeaturedCategoryCard category={STATIC_CATEGORY} />
          </Box>
        </Grid>

        {/* Products Grid - Right Side */}
        <Grid item xs={12} md={8}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={1.5} sx={{ flexGrow: 1 }}>
              {loading ? (
                [...Array(4)].map((_, index) => (
                  <Grid item xs={6} key={index} sx={{ height: '50%' }}>
                    <ProductSkeleton />
                  </Grid>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <Grid item xs={6} key={product.id} sx={{ height: '50%' }}>
                    <ProductCard product={product} />
                  </Grid>
                ))
              ) : (
                [...Array(4)].map((_, index) => (
                  <Grid item xs={6} key={`mock-${index}`} sx={{ height: '50%' }}>
                    <MockProductCard index={index} />
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const primaryImage = Array.isArray(product.images) 
    ? product.images[0] 
    : typeof product.images === 'string' 
    ? JSON.parse(product.images)[0] 
    : '/api/placeholder/150/150';

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
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main',
        },
      }}
    >
      <Box
        sx={{
          height: '55%',
          backgroundImage: `url(${primaryImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#f8f9fa',
          position: 'relative',
        }}
      >
        {isEnded && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'error.main',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 'bold',
            }}
          >
            ENDED
          </Box>
        )}
      </Box>

      <CardContent sx={{ p: 1.5, height: '45%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.8rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 0.5,
          }}
        >
          {product.title}
        </Typography>

        <Box>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'bold',
              color: isEnded ? 'error.main' : 'success.main',
              fontSize: '0.85rem',
            }}
          >
            {isEnded ? 'Ended' : `$${currentPrice?.toLocaleString() || 'N/A'}`}
          </Typography>
          {!isEnded && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Current Bid
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function ProductSkeleton() {
  return (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <Skeleton variant="rectangular" height="55%" />
      <CardContent sx={{ p: 1.5, height: '45%' }}>
        <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={16} width="60%" sx={{ mb: 1 }} />
        <Skeleton variant="text" height={14} width="40%" />
      </CardContent>
    </Card>
  );
}

// Mock Product Card (fallback if API fails)
function MockProductCard({ index }: { index: number }) {
  const mockProducts = [
    { title: 'Desktop Gamer Las Vegas', price: '$1,200.00', isEnded: false },
    { title: 'Desktop TTX Gamer', price: '$90.99', isEnded: false },
    { title: 'Galaxy S10+ Dual SIM', price: 'Ended', isEnded: true },
    { title: 'Gaming Computer', price: '$20.00', isEnded: false },
  ];

  const mock = mockProducts[index] || mockProducts[0];

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main',
        },
      }}
    >
      <Box
        sx={{
          height: '55%',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {mock.isEnded && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'error.main',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 'bold',
            }}
          >
            ENDED
          </Box>
        )}
        <Typography variant="caption" color="text.secondary">
          No Image
        </Typography>
      </Box>

      <CardContent sx={{ p: 1.5, height: '45%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.8rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 0.5,
          }}
        >
          {mock.title}
        </Typography>

        <Box>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'bold',
              color: mock.isEnded ? 'error.main' : 'success.main',
              fontSize: '0.85rem',
            }}
          >
            {mock.price}
          </Typography>
          {!mock.isEnded && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Current Bid
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}