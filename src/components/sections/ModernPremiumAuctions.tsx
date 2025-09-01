'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  Alert,
  Button,
  Container,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Fade,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  FiberNew as NewIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

import { PremiumAuctionCard } from '../product-card/PremiumAuctionCard';
import { productsAPI, isSuccessResponse } from 'src/lib/api-client';
import type { ProductCard } from 'src/types/common';

interface ModernPremiumAuctionsProps {
  limit?: number;
  showTabs?: boolean;
}

// Mock data generator for demonstration
const createMockProducts = (section: string, count: number): ProductCard[] => {
  const baseProducts = [
    {
      id: '1',
      title: '1955 Mercedes-Benz 300SL Gullwing',
      category: { name: 'Classic Cars' },
      images: ['/api/placeholder/400/300'],
      estimatedValueMin: 1200000,
      estimatedValueMax: 1800000,
      currentBid: 1450000,
      agent: {
        displayName: 'Classic Car Specialists',
        businessName: 'Heritage Motors',
        logoUrl: '/api/placeholder/80/80',
        rating: 4.9,
      },
      viewCount: 2847,
      favoriteCount: 156,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      auction: {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'LIVE',
      },
    },
    {
      id: '2',
      title: 'Patek Philippe Nautilus 5711/1A',
      category: { name: 'Luxury Watches' },
      images: ['/api/placeholder/400/300'],
      estimatedValueMin: 180000,
      estimatedValueMax: 220000,
      currentBid: 195000,
      agent: {
        displayName: 'Swiss Timepieces',
        businessName: 'Chronos Collection',
        logoUrl: '/api/placeholder/80/80',
        rating: 4.8,
      },
      viewCount: 1923,
      favoriteCount: 234,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      auction: {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        status: 'LIVE',
      },
    },
    {
      id: '3',
      title: 'Picasso - Woman with a Hat (1962)',
      category: { name: 'Fine Art' },
      images: ['/api/placeholder/400/300'],
      estimatedValueMin: 2500000,
      estimatedValueMax: 3500000,
      currentBid: 2750000,
      agent: {
        displayName: 'Fine Art Gallery',
        businessName: 'Masterpiece Auctions',
        logoUrl: '/api/placeholder/80/80',
        rating: 4.9,
      },
      viewCount: 3456,
      favoriteCount: 289,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      auction: {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        status: 'LIVE',
      },
    },
    {
      id: '4',
      title: 'Hermès Birkin Himalaya Crocodile',
      category: { name: 'Luxury Goods' },
      images: ['/api/placeholder/400/300'],
      estimatedValueMin: 150000,
      estimatedValueMax: 200000,
      currentBid: 175000,
      agent: {
        displayName: 'Luxury Consignment',
        businessName: 'Elite Collections',
        logoUrl: '/api/placeholder/80/80',
        rating: 4.7,
      },
      viewCount: 1567,
      favoriteCount: 198,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      auction: {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        status: 'LIVE',
      },
    },
    {
      id: '5',
      title: 'Rolex Daytona Paul Newman',
      category: { name: 'Luxury Watches' },
      images: ['/api/placeholder/400/300'],
      estimatedValueMin: 250000,
      estimatedValueMax: 350000,
      currentBid: 285000,
      agent: {
        displayName: 'Watch Specialists',
        businessName: 'Vintage Rolex',
        logoUrl: '/api/placeholder/80/80',
        rating: 4.9,
      },
      viewCount: 2134,
      favoriteCount: 267,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      auction: {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        status: 'LIVE',
      },
    },
    {
      id: '6',
      title: 'Ferrari 250 GT California Spider',
      category: { name: 'Classic Cars' },
      images: ['/api/placeholder/400/300'],
      estimatedValueMin: 8000000,
      estimatedValueMax: 12000000,
      currentBid: 9500000,
      agent: {
        displayName: 'Ferrari Specialists',
        businessName: 'Prancing Horse Collection',
        logoUrl: '/api/placeholder/80/80',
        rating: 4.8,
      },
      viewCount: 4231,
      favoriteCount: 456,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      auction: {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        status: 'LIVE',
      },
    },
    {
      id: '7',
      title: 'Van Gogh Starry Night Sketch',
      category: { name: 'Fine Art' },
      images: ['/api/placeholder/400/300'],
      estimatedValueMin: 850000,
      estimatedValueMax: 1200000,
      currentBid: 975000,
      agent: {
        displayName: 'Elite Art Gallery',
        businessName: 'Renaissance Auctions',
        logoUrl: '/api/placeholder/80/80',
        rating: 4.9,
      },
      viewCount: 1890,
      favoriteCount: 312,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      auction: {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        status: 'LIVE',
      },
    },
    {
      id: '8',
      title: 'Cartier Panthère Diamond Necklace',
      category: { name: 'Fine Jewelry' },
      images: ['/api/placeholder/400/300'],
      estimatedValueMin: 320000,
      estimatedValueMax: 450000,
      currentBid: 385000,
      agent: {
        displayName: 'Luxury Jewelry House',
        businessName: 'Brilliant Collections',
        logoUrl: '/api/placeholder/80/80',
        rating: 4.8,
      },
      viewCount: 1456,
      favoriteCount: 198,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      auction: {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
        status: 'LIVE',
      },
    }
  ];

  // Extend the array if we need more items
  const extendedProducts = [];
  for (let i = 0; i < count; i++) {
    const baseIndex = i % baseProducts.length;
    extendedProducts.push({
      ...baseProducts[baseIndex],
      id: `${section}-${baseProducts[baseIndex].id}-${i}`,
    });
  }

  return extendedProducts as ProductCard[];
};

const SECTION_CONFIGS = {
  ending: {
    title: 'Ending Soon',
    subtitle: 'Last chance to bid on these exclusive items',
    icon: TimeIcon,
    color: '#CE0E2D',
    variant: 'ending' as const,
    background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.02) 0%, rgba(255, 68, 68, 0.02) 100%)',
  },
  trending: {
    title: 'Trending Auctions',
    subtitle: 'Most popular items with active bidding',
    icon: TrendingIcon,
    color: '#9C27B0',
    variant: 'trending' as const,
    background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.02) 0%, rgba(186, 104, 200, 0.02) 100%)',
  },
  featured: {
    title: 'Featured Collection',
    subtitle: 'Carefully curated premium selections',
    icon: StarIcon,
    color: '#FF9800',
    variant: 'featured' as const,
    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.02) 0%, rgba(255, 183, 77, 0.02) 100%)',
  },
  recent: {
    title: 'Latest Additions',
    subtitle: 'Fresh arrivals from verified sellers',
    icon: NewIcon,
    color: '#4CAF50',
    variant: 'recent' as const,
    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.02) 0%, rgba(129, 199, 132, 0.02) 100%)',
  },
};

export function ModernPremiumAuctions({ limit = 8, showTabs = true }: ModernPremiumAuctionsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState<{ [key: string]: ProductCard[] }>(() => {
    // Initialize with mock data to ensure cards are always visible
    console.log('Initializing ModernPremiumAuctions with mock data', { limit, showTabs });
    return {
      ending: createMockProducts('ending', limit),
      trending: createMockProducts('trending', limit), 
      featured: createMockProducts('featured', limit),
      recent: createMockProducts('recent', limit),
    };
  });
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<{ [key: string]: string | null }>({});

  const sections = Object.keys(SECTION_CONFIGS);
  const currentSection = sections[activeTab];
  const config = SECTION_CONFIGS[currentSection as keyof typeof SECTION_CONFIGS];

  const fetchProducts = async (section: string) => {
    try {
      setLoading(prev => ({ ...prev, [section]: true }));
      setError(prev => ({ ...prev, [section]: null }));

      const apiSection = section === 'ending' ? 'ending-soon' : section;
      const response = await productsAPI.getShowcaseProducts(apiSection, limit);
      
      if (isSuccessResponse(response)) {
        const fetchedProducts = response.data.data || [];
        setProducts(prev => ({
          ...prev,
          [section]: Array.isArray(fetchedProducts) ? fetchedProducts : []
        }));
      } else {
        throw new Error(response.error.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error(`Error fetching ${section} products:`, err);
      setError(prev => ({
        ...prev,
        [section]: err instanceof Error ? err.message : 'Failed to load products'
      }));
    } finally {
      setLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  useEffect(() => {
    // Load all sections on mount with error handling
    sections.forEach(section => {
      fetchProducts(section);
    });
  }, [limit]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleViewAll = () => {
    const filterMap = {
      ending: 'ending-soon',
      trending: 'trending',
      featured: 'featured',
      recent: 'recent',
    };
    
    router.push(`/auctions?filter=${filterMap[currentSection as keyof typeof filterMap]}`);
  };

  const currentProducts = products[currentSection] || [];
  const isLoading = loading[currentSection];
  const currentError = error[currentSection];

  if (!showTabs) {
    // Render all sections without tabs
    return (
      <Box>
        {sections.map((sectionKey) => {
          const sectionConfig = SECTION_CONFIGS[sectionKey as keyof typeof SECTION_CONFIGS];
          const sectionProducts = products[sectionKey] || [];
          const sectionLoading = loading[sectionKey];
          const sectionError = error[sectionKey];

          return (
            <Box key={sectionKey} sx={{ py: { xs: 6, md: 8 }, background: sectionConfig.background }}>
              <Container maxWidth="xl">
                {/* Section Header */}
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 8 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '20px',
                        background: `linear-gradient(135deg, ${sectionConfig.color}, ${sectionConfig.color}CC)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 8px 32px ${sectionConfig.color}40`,
                      }}
                    >
                      <sectionConfig.icon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                  </Box>
                  
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '2rem', md: '3rem' },
                      color: '#0F1419',
                      mb: 2,
                      lineHeight: 1.2,
                    }}
                  >
                    {sectionConfig.title}
                  </Typography>
                  
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'text.secondary',
                      maxWidth: '500px',
                      mx: 'auto',
                      fontWeight: 400,
                      lineHeight: 1.6,
                    }}
                  >
                    {sectionConfig.subtitle}
                  </Typography>
                </Box>

                {/* Products Grid */}
                {sectionLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={40} sx={{ color: sectionConfig.color }} />
                  </Box>
                ) : sectionError ? (
                  <Alert severity="error" sx={{ mb: 4 }}>
                    {sectionError}
                  </Alert>
                ) : sectionProducts.length > 0 ? (
                  <>
                    <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                      {sectionProducts.map((product, index) => (
                        <Grid item xs={12} sm={6} lg={4} xl={3} key={product.id}>
                          <Fade in timeout={600 + index * 100}>
                            <div>
                              <PremiumAuctionCard
                                product={{
                                  id: product.id,
                                  title: product.title,
                                  category: { name: product.category.name },
                                  images: Array.isArray(product.images) ? product.images : [product.images],
                                  estimatedValueMin: typeof product.estimatedValueMin === 'string' ? parseFloat(product.estimatedValueMin) : (product.estimatedValueMin || 0),
                                  estimatedValueMax: typeof product.estimatedValueMax === 'string' ? parseFloat(product.estimatedValueMax) : (product.estimatedValueMax || 0),
                                  currentBid: typeof product.currentBid === 'string' ? parseFloat(product.currentBid) : product.currentBid,
                                  agent: {
                                    displayName: product.agent?.displayName || 'Auction House',
                                    businessName: product.agent?.businessName,
                                    logoUrl: product.agent?.logoUrl || '',
                                    rating: typeof product.agent?.rating === 'string' ? parseFloat(product.agent.rating) : (product.agent?.rating || 4.5),
                                  },
                                  viewCount: typeof product.viewCount === 'string' ? parseInt(product.viewCount) : (product.viewCount || 0),
                                  favoriteCount: typeof product.favoriteCount === 'string' ? parseInt(product.favoriteCount) : (product.favoriteCount || 0),
                                  auction: product.auction || {
                                    startTime: product.startTime || new Date().toISOString(),
                                    endTime: product.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                    status: 'LIVE',
                                  },
                                }}
                                variant={sectionConfig.variant}
                                onClick={() => handleProductClick(product.id)}
                                onFavorite={() => console.log('Toggle favorite for product:', product.id)}
                              />
                            </div>
                          </Fade>
                        </Grid>
                      ))}
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 6, md: 8 } }}>
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowIcon />}
                        onClick={() => {
                          const filterMap = {
                            ending: 'ending-soon',
                            trending: 'trending',
                            featured: 'featured',
                            recent: 'recent',
                          };
                          router.push(`/auctions?filter=${filterMap[sectionKey as keyof typeof filterMap]}`);
                        }}
                        sx={{
                          background: `linear-gradient(135deg, ${sectionConfig.color}, ${sectionConfig.color}CC)`,
                          color: 'white',
                          fontWeight: 700,
                          px: { xs: 4, md: 6 },
                          py: { xs: 1.5, md: 2 },
                          borderRadius: '50px',
                          boxShadow: `0 6px 24px ${sectionConfig.color}40`,
                          textTransform: 'none',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${sectionConfig.color}CC, ${sectionConfig.color}99)`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 32px ${sectionConfig.color}60`,
                          },
                        }}
                      >
                        View All {sectionConfig.title}
                      </Button>
                    </Box>
                  </>
                ) : null}
              </Container>
            </Box>
          );
        })}
      </Box>
    );
  }

  // Render with tabs
  return (
    <Box sx={{ py: { xs: 6, md: 10 }, background: config.background }}>
      <Container maxWidth="xl">
        {/* Header with Tabs */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 8 } }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '3rem' },
              color: '#0F1419',
              mb: 6,
              lineHeight: 1.2,
            }}
          >
            Premium Auction Collections
          </Typography>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 6,
              '& .MuiTabs-flexContainer': {
                justifyContent: 'center',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minWidth: 120,
                py: 2,
                px: 3,
                borderRadius: '50px',
                margin: '0 8px',
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  color: config.color,
                  background: `${config.color}15`,
                },
                '&:hover': {
                  background: `${config.color}08`,
                },
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            {sections.map((sectionKey) => {
              const sectionConfig = SECTION_CONFIGS[sectionKey as keyof typeof SECTION_CONFIGS];
              return (
                <Tab
                  key={sectionKey}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <sectionConfig.icon sx={{ fontSize: 20 }} />
                      {sectionConfig.title}
                    </Box>
                  }
                />
              );
            })}
          </Tabs>
        </Box>

        {/* Content */}
        <Fade in key={currentSection} timeout={500}>
          <Box>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={40} sx={{ color: config.color }} />
              </Box>
            ) : currentError ? (
              <Alert severity="error" sx={{ mb: 4 }}>
                {currentError}
              </Alert>
            ) : currentProducts.length > 0 ? (
              <>
                <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                  {currentProducts.map((product, index) => (
                    <Grid item xs={12} sm={6} lg={4} xl={3} key={product.id}>
                      <Fade in timeout={600 + index * 100}>
                        <div>
                          <PremiumAuctionCard
                            product={{
                              id: product.id,
                              title: product.title,
                              category: { name: product.category.name },
                              images: Array.isArray(product.images) ? product.images : [product.images],
                              estimatedValueMin: typeof product.estimatedValueMin === 'string' ? parseFloat(product.estimatedValueMin) : (product.estimatedValueMin || 0),
                              estimatedValueMax: typeof product.estimatedValueMax === 'string' ? parseFloat(product.estimatedValueMax) : (product.estimatedValueMax || 0),
                              currentBid: typeof product.currentBid === 'string' ? parseFloat(product.currentBid) : product.currentBid,
                              agent: {
                                displayName: product.agent?.displayName || 'Auction House',
                                businessName: product.agent?.businessName,
                                logoUrl: product.agent?.logoUrl || '',
                                rating: typeof product.agent?.rating === 'string' ? parseFloat(product.agent.rating) : (product.agent?.rating || 4.5),
                              },
                              viewCount: typeof product.viewCount === 'string' ? parseInt(product.viewCount) : (product.viewCount || 0),
                              favoriteCount: typeof product.favoriteCount === 'string' ? parseInt(product.favoriteCount) : (product.favoriteCount || 0),
                              auction: product.auction || {
                                startTime: product.startTime || new Date().toISOString(),
                                endTime: product.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                status: 'LIVE',
                              },
                            }}
                            variant={config.variant}
                            onClick={() => handleProductClick(product.id)}
                            onFavorite={() => console.log('Toggle favorite for product:', product.id)}
                          />
                        </div>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 6, md: 8 } }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowIcon />}
                    onClick={handleViewAll}
                    sx={{
                      background: `linear-gradient(135deg, ${config.color}, ${config.color}CC)`,
                      color: 'white',
                      fontWeight: 700,
                      px: { xs: 4, md: 6 },
                      py: { xs: 1.5, md: 2 },
                      borderRadius: '50px',
                      boxShadow: `0 6px 24px ${config.color}40`,
                      textTransform: 'none',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${config.color}CC, ${config.color}99)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 32px ${config.color}60`,
                      },
                    }}
                  >
                    View All {config.title}
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No {config.title.toLowerCase()} available at the moment
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}