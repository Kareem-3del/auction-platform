'use client';

import { Box, Typography } from '@mui/material';

import { FeaturedCategoryCard } from './FeaturedCategoryCard';

// Static data to prevent API memory leaks
const staticFeaturedCategories = [
  {
    id: 'cmeu9rs7f0000gz9rjiittxrj',
    name: 'Art & Collectibles',
    slug: 'art-collectibles',
    imageUrl: null,
    productCount: 4,
  }
];

export function SimpleFeaturedCategories() {
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
      
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        {staticFeaturedCategories.map((category) => (
          <Box key={category.id} sx={{ maxWidth: 400 }}>
            <FeaturedCategoryCard category={category} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}