'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [activeItem, setActiveItem] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real products for hero section
  useEffect(() => {
    const fetchHeroProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?limit=3&status=APPROVED&auctionStatus=LIVE&sortBy=relevance');
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
        overflow: 'hidden',
        color: 'white',
      }}
    >
      {/* Animated Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 30% 40%, rgba(206, 14, 45, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 70% 60%, rgba(255, 215, 0, 0.1) 0%, transparent 50%)`,
          animation: 'subtleFloat 8s ease-in-out infinite alternate',
          '@keyframes subtleFloat': {
            '0%': { transform: 'translateY(0px) rotate(0deg)' },
            '100%': { transform: 'translateY(-20px) rotate(1deg)' },
          },
        }}
      />

      {/* Floating Elements */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: { xs: 4, md: 8 },
            height: { xs: 4, md: 8 },
            borderRadius: '50%',
            background: 'linear-gradient(45deg, rgba(206, 14, 45, 0.6), rgba(255, 215, 0, 0.6))',
            animation: `float${i} ${8 + i * 2}s ease-in-out infinite`,
            left: `${15 + i * 15}%`,
            top: `${20 + i * 10}%`,
            '@keyframes float0': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(-30px) scale(1.2)' },
            },
            '@keyframes float1': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(25px) scale(0.8)' },
            },
            '@keyframes float2': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(-20px) scale(1.1)' },
            },
            '@keyframes float3': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(35px) scale(0.9)' },
            },
            '@keyframes float4': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(-25px) scale(1.15)' },
            },
            '@keyframes float5': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(20px) scale(0.85)' },
            },
          }}
        />
      ))}

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: { xs: 4, lg: 8 },
            alignItems: 'center',
            minHeight: { xs: 'auto', lg: '80vh' },
            py: { xs: 8, lg: 12 },
          }}
        >
          {/* Left Content */}
          <Box
            sx={{
              order: { xs: 2, lg: 1 },
              animation: 'slideInLeft 1s ease-out',
              '@keyframes slideInLeft': {
                '0%': { transform: 'translateX(-100px)', opacity: 0 },
                '100%': { transform: 'translateX(0)', opacity: 1 },
              },
            }}
          >
            {/* Live Indicator */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 4,
                px: 3,
                py: 1.5,
                borderRadius: '50px',
                background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.2), rgba(255, 68, 68, 0.2))',
                border: '1px solid rgba(206, 14, 45, 0.3)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: '#4CAF50',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.7, transform: 'scale(1.2)' },
                  },
                }}
              />
              <Typography
                variant="body2"
                sx={{ 
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.9rem',
                }}
              >
                Live Auctions • {totalParticipants > 0 ? `${totalParticipants}+` : '0'} Active Bidders
              </Typography>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.5rem', lg: '4.5rem' },
                fontWeight: 800,
                lineHeight: 1.1,
                mb: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Discover Extraordinary{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #CE0E2D, #FF4444, #FFD700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 3s ease-in-out infinite',
                  '@keyframes shimmer': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                  },
                  backgroundSize: '200% 200%',
                }}
              >
                Auctions
              </Box>
            </Typography>

            <Typography
              variant="h5"
              sx={{
                mb: 6,
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: '500px',
              }}
            >
              Join the world's most prestigious auction house. Bid on rare collectibles, luxury items, and priceless artifacts from verified sellers worldwide.
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 6 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/auctions')}
                sx={{
                  px: { xs: 4, md: 6 },
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 700,
                  borderRadius: '50px',
                  background: 'linear-gradient(135deg, #CE0E2D 0%, #FF4444 100%)',
                  boxShadow: '0 8px 32px rgba(206, 14, 45, 0.4)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: '0 12px 40px rgba(206, 14, 45, 0.5)',
                    background: 'linear-gradient(135deg, #b00c26 0%, #e63939 100%)',
                  },
                }}
              >
                Start Bidding Now
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push('/about')}
                sx={{
                  px: { xs: 4, md: 6 },
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 600,
                  borderRadius: '50px',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Learn More
              </Button>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { icon: TrendingIcon, value: '50K+', label: 'Active Users' },
                { icon: ScheduleIcon, value: '1M+', label: 'Items Sold' },
                { icon: OfferIcon, value: '$2.5B+', label: 'Total Volume' },
              ].map((stat, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.2), rgba(255, 215, 0, 0.2))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <stat.icon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', lineHeight: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right Content - Featured Auction Card */}
          <Box
            sx={{
              order: { xs: 1, lg: 2 },
              display: 'flex',
              justifyContent: 'center',
              animation: 'slideInRight 1s ease-out 0.2s both',
              '@keyframes slideInRight': {
                '0%': { transform: 'translateX(100px)', opacity: 0 },
                '100%': { transform: 'translateX(0)', opacity: 1 },
              },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                maxWidth: { xs: '100%', lg: '500px' },
                width: '100%',
              }}
            >
              {/* Main Featured Card */}
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-12px) scale(1.02)',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
                  },
                }}
                onClick={() => currentItem && router.push(`/products/${currentItem.id}`)}
              >
                {/* Image */}
                <Box
                  sx={{
                    height: { xs: 300, md: 350 },
                    backgroundImage: currentItem?.images?.[0] ? `url(${currentItem.images[0]})` : 'none',
                    backgroundColor: loading || !currentItem ? '#333' : 'transparent',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: currentItem ? 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)' : 'none',
                    },
                  }}
                >
                  {loading && (
                    <CircularProgress sx={{ color: 'white', zIndex: 1 }} />
                  )}
                
                  {/* Live Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 20,
                      left: 20,
                      px: 3,
                      py: 1,
                      borderRadius: '50px',
                      background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
                      color: 'white',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)',
                      animation: 'pulse 2s infinite',
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'white',
                      }}
                    />
                    LIVE
                  </Box>

                  {/* Time Left */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      px: 3,
                      py: 1,
                      borderRadius: '50px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(20px)',
                      color: 'white',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    {currentItem ? getTimeLeft(currentItem.endTime) : '--'}
                  </Box>

                  {/* Play Button */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 80,
                      height: 80,
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(20px)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 1)',
                        transform: 'translate(-50%, -50%) scale(1.1)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(!isPlaying);
                    }}
                  >
                    <PlayIcon sx={{ fontSize: 36, color: '#CE0E2D', ml: 0.5 }} />
                  </IconButton>
                </Box>

                {/* Content */}
                <Box sx={{ p: 4 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    {currentItem?.category?.name || 'Loading...'}
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: 'white',
                      mb: 3,
                      lineHeight: 1.3,
                    }}
                  >
                    {currentItem?.title || 'Loading auction...'}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}
                      >
                        Current Bid
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          color: '#FFD700',
                          fontFamily: '"Roboto Mono", monospace',
                        }}
                      >
                        ${currentItem?.currentBid?.toLocaleString() || '0'}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}
                      >
                        Participants
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: 'white' }}
                      >
                        {currentItem?.favoriteCount || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Carousel Indicators */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 1,
                  mt: 4,
                }}
              >
                {heroProducts.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => setActiveItem(index)}
                    sx={{
                      width: activeItem === index ? 40 : 12,
                      height: 6,
                      borderRadius: '50px',
                      background: activeItem === index 
                        ? 'linear-gradient(135deg, #CE0E2D, #FF4444)'
                        : 'rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: activeItem === index 
                          ? 'linear-gradient(135deg, #CE0E2D, #FF4444)'
                          : 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
            ) : (
              // Fallback when no products are available
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  p: 4,
                  textAlign: 'center',
                  color: 'white',
                }}
              >
                <Typography variant="h5" sx={{ mb: 2, opacity: 0.7 }}>
                  No Live Auctions Available
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.5 }}>
                  Check back soon for exciting new auctions
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      {/* Scroll Indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          opacity: 0.7,
          animation: 'bounce 2s infinite',
          '@keyframes bounce': {
            '0%, 20%, 50%, 80%, 100%': { transform: 'translateX(-50%) translateY(0)' },
            '40%': { transform: 'translateX(-50%) translateY(-10px)' },
            '60%': { transform: 'translateX(-50%) translateY(-5px)' },
          },
        }}
      >
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
          Scroll to explore
        </Typography>
        <Box
          sx={{
            width: 2,
            height: 30,
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%)',
            borderRadius: '2px',
          }}
        />
      </Box>
    </Box>
  );
}