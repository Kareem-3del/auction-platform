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

import { SimplePremiumCard } from '../product-card/SimplePremiumCard';
import { auctionsAPI, isSuccessResponse } from 'src/lib/api-client';
import type { ProductCard } from 'src/types/common';
import { useLocale } from 'src/hooks/useLocale';

interface ModernPremiumAuctionsProps {
  limit?: number;
  showTabs?: boolean;
}


// No more mock data - everything uses real API calls

const getSectionConfigs = (t: (key: string) => string) => ({
  ending: {
    title: t('homepage.sections.endingSoon'),
    subtitle: t('homepage.sections.lastChanceToBid'),
    icon: TimeIcon,
    color: '#CE0E2D',
    variant: 'ending' as const,
    background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.02) 0%, rgba(255, 68, 68, 0.02) 100%)',
  },
  trending: {
    title: t('homepage.sections.trendingAuctions'),
    subtitle: t('homepage.sections.mostPopularItems'),
    icon: TrendingIcon,
    color: '#9C27B0',
    variant: 'trending' as const,
    background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.02) 0%, rgba(186, 104, 200, 0.02) 100%)',
  },
  featured: {
    title: t('homepage.sections.featuredCollection'),
    subtitle: t('homepage.sections.curatedPremiumSelections'),
    icon: StarIcon,
    color: '#FF9800',
    variant: 'featured' as const,
    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.02) 0%, rgba(255, 183, 77, 0.02) 100%)',
  },
  recent: {
    title: t('homepage.sections.recentAdditions'),
    subtitle: t('homepage.sections.freshArrivals'),
    icon: NewIcon,
    color: '#4CAF50',
    variant: 'recent' as const,
    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.02) 0%, rgba(129, 199, 132, 0.02) 100%)',
  },
});

export function ModernPremiumAuctions({ limit = 8, showTabs = true }: ModernPremiumAuctionsProps) {
  const router = useRouter();
  const { t, isRTL } = useLocale();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState<{ [key: string]: ProductCard[] }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<{ [key: string]: string | null }>({});

  const SECTION_CONFIGS = getSectionConfigs(t);
  const sections = Object.keys(SECTION_CONFIGS);
  const currentSection = sections[activeTab];
  const config = SECTION_CONFIGS[currentSection as keyof typeof SECTION_CONFIGS];

  const fetchProducts = async (section: string) => {
    try {
      setLoading(prev => ({ ...prev, [section]: true }));
      setError(prev => ({ ...prev, [section]: null }));

      console.log(`Fetching ${section} products...`);
      
      // Try direct auctions API with appropriate filters for each section
      let apiParams: Record<string, any> = {
        limit: limit
      };
      
      // Apply section-specific filters
      switch (section) {
        case 'ending':
          apiParams.auctionStatus = 'LIVE';
          apiParams.sortBy = 'ending_soon';
          break;
        case 'trending':
          apiParams.sortBy = 'relevance';
          break;
        case 'featured':
          // Use activity-based sorting instead of featured field
          apiParams.sortBy = 'relevance';
          break;
        case 'recent':
          apiParams.sortBy = 'newest';
          break;
      }
      
      const queryString = Object.entries(apiParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      console.log(`API call: /api/auctions?${queryString}`);
      
      console.log(`Attempting to fetch real data for ${section}...`);
      const response = await fetch(`/api/auctions?${queryString}`);
      let data;
      
      try {
        data = await response.json();
      } catch (e) {
        console.log(`API response parsing failed for ${section}:`, e);
        data = { success: false };
      }
      
      if (response.ok && data.success && data.data?.length > 0) {
        console.log(`Successfully fetched ${data.data.length} real products for ${section}:`, data.data[0]?.title);
        setProducts(prev => ({
          ...prev,
          [section]: data.data
        }));
      } else {
        // If no real data, try showcase API as fallback
        const apiSection = section === 'ending' ? 'ending-soon' : section;
        const showcaseResponse = await auctionsAPI.getAuctions({ 
          featured: true, 
          limit,
          sortBy: apiSection === 'ending_soon' ? 'ending_soon' : apiSection === 'trending' ? 'relevance' : 'newest' 
        });
        
        if (isSuccessResponse(showcaseResponse) && showcaseResponse.data?.length > 0) {
          console.log(`Using auction API data for ${section}`);
          setProducts(prev => ({
            ...prev,
            [section]: showcaseResponse.data
          }));
        } else {
          // No mock data fallback - show empty state
          console.log(`No real data found for ${section}, showing empty state`);
          setProducts(prev => ({
            ...prev,
            [section]: []
          }));
        }
      }
    } catch (err) {
      console.error(`Error fetching ${section} products:`, err);
      // Show empty state on error
      setProducts(prev => ({
        ...prev,
        [section]: []
      }));
      setError(prev => ({
        ...prev,
        [section]: `Failed to load ${section} products`
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
    router.push(`/auctions/${productId}`);
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
                <Box sx={{ mb: { xs: 4, md: 6 } }}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.75rem', md: '2.25rem' },
                      color: '#0F1419',
                      mb: 1,
                      lineHeight: 1.3,
                      letterSpacing: '-0.025em',
                    }}
                  >
                    {sectionConfig.title}
                  </Typography>
                  
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 400,
                      fontSize: '1rem',
                      opacity: 0.8,
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
                              <SimplePremiumCard
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
                        {t(`homepage.sections.viewAll${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}` as any)}
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
        <Box sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: '#0F1419',
              mb: 4,
              lineHeight: 1.3,
              letterSpacing: '-0.025em',
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('homepage.sections.premiumCollections')}
          </Typography>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 6,
              '& .MuiTabs-flexContainer': {
                justifyContent: 'flex-start',
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
                  label={sectionConfig.title}
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
                          <SimplePremiumCard
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
                    {t(`homepage.sections.viewAll${currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}` as any)}
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  {t('homepage.sections.noItemsAvailable', { section: config.title })}
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}