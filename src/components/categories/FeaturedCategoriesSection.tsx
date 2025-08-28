'use client';

import { useState, useEffect } from 'react';

import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';

import { FeaturedCategoryWithProducts } from './FeaturedCategoryWithProducts';

interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
}

export function FeaturedCategoriesSection() {
  const [featuredCategories, setFeaturedCategories] = useState<FeaturedCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCategories();
  }, []);

  const fetchFeaturedCategories = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('/api/categories?featured=true&flat=true', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // Handle the API response format: {success: true, data: {data: Array, message: string}}
      let categories = [];
      if (data.success && data.data) {
        if (Array.isArray(data.data.data)) {
          categories = data.data.data;
        } else if (Array.isArray(data.data)) {
          categories = data.data;
        }
      }
      
      setFeaturedCategories(categories.map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl,
        productCount: category.productCount || category._count?.products || 0,
      })));
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching featured categories:', error);
      }
      setFeaturedCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Don't show section if no featured categories
  if (!loading && featuredCategories.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: 8 }}>
      <Typography 
        variant="h3" 
        component="h2" 
        textAlign="center" 
        gutterBottom
        sx={{ mb: 6 }}
      >
        Featured Categories
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {featuredCategories.map((category) => (
            <FeaturedCategoryWithProducts key={category.id} category={category} />
          ))}
        </Box>
      )}
    </Box>
  );
}