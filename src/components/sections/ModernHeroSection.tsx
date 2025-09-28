'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'src/hooks/useLocale';
import {
  Box,
  Button,
  Container,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';

interface HeroProduct {
  id: string;
  title: string;
  category: { name: string };
  currentBid: number;
  endTime: string;
  images: string[];
  favoriteCount: number;
  viewCount: number;
}

// Helper function to calculate time left
function getTimeLeft(endTime: string): string {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const diff = end - now;
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function ModernHeroSection() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useLocale();
  const [activeItem, setActiveItem] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real products for hero section
  useEffect(() => {
    const fetchHeroProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auctions?limit=5&auctionStatus=LIVE&sortBy=currentBid');
        const data = await response.json();
        
        if (data.success && data.data?.length > 0) {
          console.log('Hero: Successfully fetched real products:', data.data.length);
          const products = data.data.map((product: any) => ({
            id: product.id,
            title: product.title,
            category: product.category,
            currentBid: Number(product.currentBid) || 0,
            endTime: product.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            images: Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]'),
            favoriteCount: product.favoriteCount || 0,
            viewCount: product.viewCount || 0,
          }));
          setHeroProducts(products);
        } else {
          console.log('Hero: No real products found, API response:', data);
          // If no real products, show message
          setHeroProducts([]);
        }
      } catch (error) {
        console.error('Hero: Error fetching products:', error);
        setHeroProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroProducts();
  }, []);

  useEffect(() => {
    if (!isPlaying || heroProducts.length === 0) return;

    const interval = setInterval(() => {
      setActiveItem((prev) => (prev + 1) % heroProducts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, heroProducts.length]);

  const currentItem = heroProducts[activeItem];
  const totalParticipants = heroProducts.reduce((acc, item) => acc + (item.favoriteCount || 0), 0);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: '50vh', md: '60vh' },
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff',
        color: '#2c3e50',
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: { xs: 4, lg: 8 },
            alignItems: 'center',
            minHeight: { xs: 'auto', lg: '50vh' },
            py: { xs: 4, lg: 6 },
          }}
        >
          {/* Left Content - Minimal */}
          <Box
            sx={{
              order: { xs: 2, lg: 1 },
              pr: { lg: 4 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ textAlign: { xs: 'center', lg: 'left' } }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', lg: '3rem' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 3,
                  color: '#2c3e50',
                  fontFamily: '"Times New Roman", serif',
                }}
              >
                Current Auctions
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', lg: 'flex-start' } }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push('/auctions')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 1,
                    bgcolor: '#CE0E2D',
                    color: 'white',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: '#b00c26',
                      boxShadow: '0 2px 8px rgba(206, 14, 45, 0.3)',
                    },
                  }}
                >
                  View All Auctions
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => router.push('/categories')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 1,
                    borderColor: '#bdc3c7',
                    color: '#2c3e50',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#95a5a6',
                      backgroundColor: '#f8f9fa',
                    },
                  }}
                >
                  Browse Categories
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Right Content - Current Auctions */}
          <Box
            sx={{
              order: { xs: 1, lg: 2 },
              pl: { lg: 4 },
            }}
          >

            <Box sx={{ position: 'relative', width: '100%' }}>
              {/* Main Featured Card */}
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: '#ffffff',
                  border: '1px solid #e9ecef',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  mb: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    borderColor: '#CE0E2D',
                  },
                }}
                onClick={() => currentItem && router.push(`/auctions/${currentItem.id}`)}
              >
                {/* Image */}
                <Box
                  sx={{
                    height: 250,
                    backgroundImage: currentItem?.images?.[0] ? `url(${currentItem.images[0]})` : 'none',
                    backgroundColor: loading || !currentItem ? '#f8f9fa' : 'transparent',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loading && (
                    <CircularProgress sx={{ color: '#CE0E2D' }} />
                  )}
                
                  {/* Status Badge */}
                  {currentItem && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        bgcolor: '#28a745',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Live
                    </Box>
                  )}

                  {/* Time Left */}
                  {currentItem && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        bgcolor: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {getTimeLeft(currentItem.endTime)}
                    </Box>
                  )}
                </Box>

                {/* Content */}
                <Box sx={{ p: 3 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: '#7f8c8d',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    {currentItem?.category?.name || 'Loading...'}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#2c3e50',
                      mb: 2,
                      lineHeight: 1.3,
                    }}
                  >
                    {currentItem?.title || 'Loading auction...'}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#7f8c8d', mb: 0.5, fontSize: '0.85rem' }}
                      >
                        Current Bid
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#CE0E2D',
                          fontFamily: '"Times New Roman", serif',
                        }}
                      >
                        ${currentItem?.currentBid?.toLocaleString() || '0'}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        sx={{ color: '#7f8c8d', mb: 0.5, fontSize: '0.85rem' }}
                      >
                        Bids
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: '#2c3e50' }}
                      >
                        {currentItem?.favoriteCount || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>


            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}