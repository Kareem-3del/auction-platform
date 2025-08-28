'use client';

import type { FC } from 'react';

import { Box, Grid, Stack, Container, Typography } from '@mui/material';

import { FeaturedCategoryCard } from './featured-category-card';

// ----------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  productCount: number;
  icon?: string;
  colorVariant?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  isFeatured?: boolean;
}

export interface FeaturedCategoriesGridProps {
  categories: Category[];
  title?: string;
  subtitle?: string;
  onCategoryClick?: (categoryId: string) => void;
}

const defaultColorVariants: Array<'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'> = [
  'primary',
  'secondary', 
  'info',
  'success',
  'warning',
  'error',
];

export const FeaturedCategoriesGrid: FC<FeaturedCategoriesGridProps> = ({
  categories,
  title = 'Featured Categories',
  subtitle = 'Explore our most popular product categories',
  onCategoryClick,
}) => {
  const featuredCategories = categories.filter(category => category.isFeatured);

  if (featuredCategories.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: 'background.neutral' }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack spacing={2} textAlign="center">
            <Typography
              variant="h3"
              sx={{
                fontWeight: 'fontWeightBold',
                color: 'text.primary',
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              {title}
            </Typography>
            
            {subtitle && (
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  fontSize: '1.125rem',
                  fontWeight: 'fontWeightRegular',
                  maxWidth: 600,
                  mx: 'auto',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Stack>

          <Grid container spacing={3}>
            {featuredCategories.map((category, index) => (
              <Grid 
                item 
                xs={12} 
                sm={6} 
                md={4} 
                key={category.id}
              >
                <FeaturedCategoryCard
                  id={category.id}
                  name={category.name}
                  productCount={category.productCount}
                  icon={category.icon}
                  colorVariant={category.colorVariant || defaultColorVariants[index % defaultColorVariants.length]}
                  onClick={() => onCategoryClick?.(category.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
};