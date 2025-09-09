'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  Container,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Grow,
  Zoom,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Watch as WatchIcon,
  Palette as ArtIcon,
  Diamond as JewelryIcon,
  Home as AntiqueIcon,
  SportsTennis as SportsIcon,
  MenuBook as BooksIcon,
  Camera as VintageIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

import { useLocale } from 'src/hooks/useLocale';

const getCategoriesConfig = (t: any) => [
  {
    id: 'luxury-cars',
    nameKey: 'categories.luxuryCars',
    descriptionKey: 'categories.descriptions.luxuryCars',
    icon: CarIcon,
    itemCountKey: 'categories.luxuryItemCounts.luxuryCars',
    averagePriceKey: 'categories.luxuryValues.luxuryCars',
    image: '/api/placeholder/400/300',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #CE0E2D 100%)',
    color: '#CE0E2D',
    featured: true,
  },
  {
    id: 'luxury-watches',
    nameKey: 'categories.luxuryWatches',
    descriptionKey: 'categories.descriptions.luxuryWatches',
    icon: WatchIcon,
    itemCountKey: 'categories.luxuryItemCounts.luxuryWatches',
    averagePriceKey: 'categories.luxuryValues.luxuryWatches',
    image: '/api/placeholder/400/300',
    gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
    color: '#44A08D',
    featured: true,
  },
  {
    id: 'fine-art',
    nameKey: 'categories.fineArt',
    descriptionKey: 'categories.descriptions.fineArt',
    icon: ArtIcon,
    itemCountKey: 'categories.luxuryItemCounts.fineArt',
    averagePriceKey: 'categories.luxuryValues.fineArt',
    image: '/api/placeholder/400/300',
    gradient: 'linear-gradient(135deg, #A8EDEA 0%, #6C5CE7 100%)',
    color: '#6C5CE7',
    featured: true,
  },
  {
    id: 'jewelry',
    nameKey: 'categories.fineJewelry',
    descriptionKey: 'categories.descriptions.fineJewelry',
    icon: JewelryIcon,
    itemCountKey: 'categories.luxuryItemCounts.fineJewelry',
    averagePriceKey: 'categories.luxuryValues.fineJewelry',
    image: '/api/placeholder/400/300',
    gradient: 'linear-gradient(135deg, #FFD89B 0%, #19547B 100%)',
    color: '#19547B',
    featured: false,
  },
  {
    id: 'antiques',
    nameKey: 'categories.artCollectibles',
    descriptionKey: 'categories.descriptions.artCollectibles',
    icon: AntiqueIcon,
    itemCountKey: 'categories.luxuryItemCounts.fineArt',
    averagePriceKey: 'categories.luxuryValues.fineArt',
    image: '/api/placeholder/400/300',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#764ba2',
    featured: false,
  },
  {
    id: 'sports',
    nameKey: 'categories.artCollectibles',
    descriptionKey: 'categories.descriptions.artCollectibles',
    icon: SportsIcon,
    itemCountKey: 'categories.luxuryItemCounts.fineArt',
    averagePriceKey: 'categories.luxuryValues.fineArt',
    image: '/api/placeholder/400/300',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f5576c',
    featured: false,
  },
  {
    id: 'books',
    nameKey: 'categories.artCollectibles',
    descriptionKey: 'categories.descriptions.artCollectibles',
    icon: BooksIcon,
    itemCountKey: 'categories.luxuryItemCounts.fineArt',
    averagePriceKey: 'categories.luxuryValues.fineArt',
    image: '/api/placeholder/400/300',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#00f2fe',
    featured: false,
  },
  {
    id: 'vintage',
    nameKey: 'categories.artCollectibles',
    descriptionKey: 'categories.descriptions.artCollectibles',
    icon: VintageIcon,
    itemCountKey: 'categories.luxuryItemCounts.fineArt',
    averagePriceKey: 'categories.luxuryValues.fineArt',
    image: '/api/placeholder/400/300',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#fa709a',
    featured: false,
  },
];

export function ElegantCategoryShowcase() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const { t, isRTL } = useLocale();

  const handleCategoryClick = useCallback((categoryId: string) => {
    router.push(`/categories/${categoryId}`);
  }, [router]);

  const categories = getCategoriesConfig(t);
  const featuredCategories = categories.filter(cat => cat.featured);
  const otherCategories = categories.filter(cat => !cat.featured);

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FAFAFA' }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 }, direction: isRTL ? 'rtl' : 'ltr' }}>
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
            {t('homepage.sections.explorePremiumCategories')}
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
            {t('homepage.sections.discoverExtraordinaryItems')}
          </Typography>
        </Box>

        {/* Featured Categories Grid */}
        <Box sx={{ mb: { xs: 6, md: 10 }, direction: isRTL ? 'rtl' : 'ltr' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#0F1419',
              mb: 4,
              fontSize: { xs: '1.8rem', md: '2.2rem' },
            }}
          >
            {t('homepage.sections.featuredCategories')}
          </Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '2fr 1fr 1fr',
                lg: '2fr 1fr 1fr',
              },
              gridTemplateRows: {
                xs: 'repeat(3, 1fr)',
                md: 'repeat(2, 350px)',
              },
              gap: 3,
              height: { xs: 'auto', md: '700px' },
            }}
          >
            {/* Large Featured Card */}
            <Grow in timeout={800}>
              <Card
                sx={{
                  gridRow: { xs: 'span 1', md: 'span 2' },
                  borderRadius: '24px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  background: featuredCategories[0]?.gradient,
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
                  },
                }}
                onClick={() => handleCategoryClick(featuredCategories[0]?.id)}
                onMouseEnter={() => setHoveredCategory(featuredCategories[0]?.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Box
                  sx={{
                    height: '100%',
                    position: 'relative',
                    background: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${featuredCategories[0]?.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: { xs: 4, md: 6 },
                    color: 'white',
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '20px',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 4,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {featuredCategories[0] && (
                        <featuredCategories[0].icon sx={{ fontSize: 40, color: 'white' }} />
                      )}
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        mb: 2,
                        lineHeight: 1.2,
                      }}
                    >
                      {t(featuredCategories[0]?.nameKey)}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: { xs: '1rem', md: '1.2rem' },
                        opacity: 0.9,
                        mb: 4,
                        fontWeight: 400,
                      }}
                    >
                      {t(featuredCategories[0]?.descriptionKey)}
                    </Typography>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                          {t('homepage.sections.items')}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {t(featuredCategories[0]?.itemCountKey)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                          {t('common.price')}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {t(featuredCategories[0]?.averagePriceKey)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 3,
                        py: 2,
                        borderRadius: '16px',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                        },
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('homepage.sections.viewAll')}
                      </Typography>
                      <IconButton sx={{ color: 'white' }}>
                        <ArrowIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grow>

            {/* Two Medium Cards */}
            {featuredCategories.slice(1, 3).map((category, index) => (
              <Zoom key={category.id} in timeout={1000 + index * 200}>
                <Card
                  sx={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    background: category.gradient,
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
                    },
                  }}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <Box
                    sx={{
                      height: '100%',
                      background: `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${category.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      p: 4,
                      color: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '16px',
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(20px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 3,
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <category.icon sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}
                      >
                        {t(category.nameKey)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.9, mb: 3 }}
                      >
                        {t(category.descriptionKey)}
                      </Typography>
                    </Box>

                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          {t(category.itemCountKey)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {t(category.averagePriceKey)}
                        </Typography>
                      </Box>
                      
                      <Box
                        sx={{
                          height: 3,
                          borderRadius: '2px',
                          bgcolor: 'rgba(255, 255, 255, 0.3)',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${Math.random() * 60 + 40}%`,
                            height: '100%',
                            bgcolor: 'white',
                            borderRadius: '2px',
                            animation: 'growWidth 1.5s ease-out',
                            '@keyframes growWidth': {
                              '0%': { width: '0%' },
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Zoom>
            ))}
          </Box>
        </Box>

        {/* Other Categories Grid */}
        <Box sx={{ direction: isRTL ? 'rtl' : 'ltr' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#0F1419',
              mb: 4,
              fontSize: { xs: '1.8rem', md: '2.2rem' },
            }}
          >
            {t('categories.artCollectibles')}
          </Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
                xl: 'repeat(5, 1fr)',
              },
              gap: 3,
            }}
          >
            {otherCategories.map((category, index) => (
              <Grow key={category.id} in timeout={1200 + index * 100}>
                <Card
                  sx={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    height: '280px',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'white',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                      '& .category-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                        background: category.gradient,
                      },
                      '& .category-image': {
                        transform: 'scale(1.1)',
                      },
                    },
                  }}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <Box
                    sx={{
                      height: '60%',
                      position: 'relative',
                      background: `url(${category.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(180deg, transparent 0%, ${category.color}20 100%)`,
                      },
                    }}
                  >
                    <Box
                      className="category-icon"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      <category.icon sx={{ fontSize: 24, color: category.color }} />
                    </Box>
                  </Box>

                  <Box sx={{ p: 3, height: '40%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 1, color: '#0F1419' }}
                      >
                        {t(category.nameKey)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', mb: 2 }}
                      >
                        {t(category.descriptionKey)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
                      >
                        {t(category.itemCountKey)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ 
                          fontWeight: 700,
                          color: category.color,
                          fontSize: '0.9rem',
                        }}
                      >
                        {t(category.averagePriceKey)}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grow>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}