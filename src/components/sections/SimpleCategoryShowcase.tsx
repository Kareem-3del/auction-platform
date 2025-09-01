'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  Container,
  Typography,
  Grid,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Watch as WatchIcon,
  Palette as ArtIcon,
  Diamond as JewelryIcon,
} from '@mui/icons-material';

const CATEGORIES = [
  {
    id: 'luxury-cars',
    name: 'Luxury Cars',
    description: 'Classic & Modern Supercars',
    icon: CarIcon,
    itemCount: '2.1K+',
    averagePrice: '$450K',
    color: '#CE0E2D',
  },
  {
    id: 'luxury-watches',
    name: 'Luxury Watches', 
    description: 'Swiss & Premium Timepieces',
    icon: WatchIcon,
    itemCount: '5.8K+',
    averagePrice: '$85K',
    color: '#44A08D',
  },
  {
    id: 'fine-art',
    name: 'Fine Art',
    description: 'Paintings & Sculptures',
    icon: ArtIcon,
    itemCount: '3.2K+',
    averagePrice: '$125K',
    color: '#6C5CE7',
  },
  {
    id: 'jewelry',
    name: 'Fine Jewelry',
    description: 'Diamonds & Precious Stones',
    icon: JewelryIcon,
    itemCount: '4.5K+',
    averagePrice: '$65K',
    color: '#19547B',
  },
];

export function SimpleCategoryShowcase() {
  const router = useRouter();

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/categories/${categoryId}`);
  };

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FAFAFA' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #0F1419, #2D3748)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 3,
              lineHeight: 1.2,
            }}
          >
            Explore Premium Categories
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            Discover extraordinary items across our curated collection of luxury categories
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {CATEGORIES.map((category, index) => (
            <Grid item xs={12} sm={6} md={3} key={category.id}>
              <Card
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '280px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-12px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                    borderColor: category.color,
                  },
                }}
                onClick={() => handleCategoryClick(category.id)}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '20px',
                    background: `${category.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <category.icon sx={{ fontSize: 40, color: category.color }} />
                </Box>
                
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mb: 2, color: '#0F1419' }}
                >
                  {category.name}
                </Typography>
                
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', mb: 3 }}
                >
                  {category.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', fontSize: '0.9rem' }}
                  >
                    {category.itemCount} items
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ 
                      fontWeight: 700,
                      color: category.color,
                      fontSize: '1rem',
                    }}
                  >
                    {category.averagePrice}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}