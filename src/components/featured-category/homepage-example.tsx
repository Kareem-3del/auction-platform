'use client';

import type { FC } from 'react';

import { type Category, FeaturedCategoriesGrid } from './featured-categories-grid';

// ----------------------------------------------------------------------

// Example usage component for homepage
export const HomepageFeaturedCategories: FC = () => {
  // This would come from your API/database
  const sampleCategories: Category[] = [
    {
      id: '1',
      name: 'PHONES',
      productCount: 12,
      icon: 'mdi:cellphone',
      colorVariant: 'primary',
      isFeatured: true,
    },
    {
      id: '2',
      name: 'LAPTOPS',
      productCount: 8,
      icon: 'mdi:laptop',
      colorVariant: 'secondary',
      isFeatured: true,
    },
    {
      id: '3',
      name: 'GAMING',
      productCount: 15,
      icon: 'mdi:gamepad-variant',
      colorVariant: 'info',
      isFeatured: true,
    },
    {
      id: '4',
      name: 'CAMERAS',
      productCount: 6,
      icon: 'mdi:camera',
      colorVariant: 'success',
      isFeatured: true,
    },
    {
      id: '5',
      name: 'WATCHES',
      productCount: 22,
      icon: 'mdi:watch',
      colorVariant: 'warning',
      isFeatured: true,
    },
    {
      id: '6',
      name: 'FURNITURE',
      productCount: 11,
      icon: 'mdi:sofa',
      colorVariant: 'error',
      isFeatured: true,
    },
  ];

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to category page
    console.log(`Navigate to category: ${categoryId}`);
    // Example: router.push(`/categories/${categoryId}`);
  };

  return (
    <FeaturedCategoriesGrid
      categories={sampleCategories}
      title="Featured Categories"
      subtitle="Discover our most popular auction categories"
      onCategoryClick={handleCategoryClick}
    />
  );
};