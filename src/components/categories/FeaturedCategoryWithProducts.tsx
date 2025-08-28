'use client';

import { memo, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Card,
  Typography,
  CircularProgress,
} from '@mui/material';

import { FeaturedCategoryCard } from './FeaturedCategoryCard';

interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
}

interface Product {
  id: string;
  title: string;
  images: string[];
  estimatedValueMin: number;
  estimatedValueMax: number;
  currentBid?: number;
  auctionStatus?: string;
  condition: string;
  agent: {
    displayName: string;
    logoUrl?: string;
  };
}

interface FeaturedCategoryWithProductsProps {
  category: FeaturedCategory;
}

export function FeaturedCategoryWithProducts({ category }: FeaturedCategoryWithProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
        
        const response = await fetch(`/api/products?categoryId=${category.id}&limit=4`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (isMounted && data.success && data.data) {
          const productsData = data.data.data || data.data.products || data.data || [];
          setProducts(productsData.slice(0, 4)); // Show max 4 products
        }
      } catch (error) {
        if (isMounted && error.name !== 'AbortError') {
          console.error(`Error fetching products for ${category.name}:`, error);
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategoryProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [category.id, category.name]);

  return (
    <Box sx={{ mb: 8 }}>
      <Grid container spacing={3} alignItems="stretch">
        {/* Category Card - Left Side */}
        <Grid item xs={12} md={4}>
          <FeaturedCategoryCard category={category} />
        </Grid>

        {/* Products - Right Side */}
        <Grid item xs={12} md={8}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              Featured in {category.name}
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <CircularProgress />
              </Box>
            ) : products.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography color="text.secondary">No products found in this category</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {products.map((product, index) => (
                  <Grid item xs={6} sm={6} md={6} key={product.id}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

// Individual Product Card Component (Memoized to prevent unnecessary re-renders)
const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const primaryImage = Array.isArray(product.images) ? product.images[0] : 
                      typeof product.images === 'string' ? JSON.parse(product.images)[0] : 
                      '/placeholder-product.jpg';

  const isAuction = product.auctionStatus && ['SCHEDULED', 'LIVE', 'ENDED'].includes(product.auctionStatus);
  const currentPrice = isAuction ? product.currentBid || product.estimatedValueMin : product.estimatedValueMin;

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 8px 24px rgba(0, 0, 0, 0.3)'
            : '0 8px 24px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {/* Product Image */}
      <Box
        sx={{
          height: 150,
          backgroundImage: `url(${primaryImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {/* Price Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: isAuction ? 'error.main' : 'success.main',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          {isAuction ? 'AUCTION' : 'BUY NOW'}
        </Box>
      </Box>

      {/* Product Info */}
      <Box sx={{ p: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.5rem',
          }}
        >
          {product.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {isAuction ? 'Current Bid:' : 'Price:'}{' '}
          <Typography component="span" variant="body2" fontWeight="bold" color="primary.main">
            ${currentPrice?.toLocaleString()}
          </Typography>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            {product.agent.displayName.charAt(0)}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {product.agent.displayName}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
});