'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Chip,
  Stack,
  Fade,
  Grow,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Favorite as FavoriteIcon,
  TrendingUp as TrendingIcon,
  Person as PersonIcon,
  Timer as TimerIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
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

// Spotify-inspired gradient backgrounds
const gradients = [
  'linear-gradient(135deg, #1DB954 0%, #1ED760 50%, #1AA34A 100%)',
  'linear-gradient(135deg, #CE0E2D 0%, #FF4444 50%, #B71C1C 100%)', 
  'linear-gradient(135deg, #8E24AA 0%, #BA68C8 50%, #7B1FA2 100%)',
  'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FF8C00 100%)',
  'linear-gradient(135deg, #00ACC1 0%, #26C6DA 50%, #0097A7 100%)',
];

function getTimeLeft(endTime: string): { text: string; urgent: boolean } {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const diff = end - now;
  
  if (diff <= 0) return { text: 'Ended', urgent: false };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  const urgent = days === 0 && hours < 1;
  
  if (days > 0) return { text: `${days}d ${hours}h`, urgent: false };
  if (hours > 0) return { text: `${hours}h ${minutes}m`, urgent };
  return { text: `${minutes}m`, urgent: true };
}

export function SpotifyHeroSection() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { t } = useLocale();
  
  const [activeItem, setActiveItem] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentGradient, setCurrentGradient] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const heroRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for subtle parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePosition({ x: x * 20, y: y * 20 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch hero products
  useEffect(() => {
    const fetchHeroProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auctions?limit=5&auctionStatus=LIVE&sortBy=relevance');
        const data = await response.json();
        
        if (data.success && data.data?.length > 0) {
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
          // Fallback demo data for better design showcase
          setHeroProducts([
            {
              id: '1',
              title: 'Luxury Watch Collection',
              category: { name: 'Watches & Jewelry' },
              currentBid: 15000,
              endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              images: ['/assets/images/demo/watch.jpg'],
              favoriteCount: 24,
              viewCount: 1200,
            },
            {
              id: '2', 
              title: 'Classic Sports Car',
              category: { name: 'Vehicles' },
              currentBid: 125000,
              endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
              images: ['/assets/images/demo/car.jpg'],
              favoriteCount: 89,
              viewCount: 3400,
            }
          ]);
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

  // Auto-play carousel
  useEffect(() => {
    if (!isPlaying || heroProducts.length === 0) return;

    const interval = setInterval(() => {
      setActiveItem((prev) => {
        const next = (prev + 1) % heroProducts.length;
        setCurrentGradient(next % gradients.length);
        return next;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [isPlaying, heroProducts.length]);

  const currentItem = heroProducts[activeItem];
  const timeLeft = currentItem ? getTimeLeft(currentItem.endTime) : { text: '--', urgent: false };

  return (
    <Box
      ref={heroRef}
      sx={{
        position: 'relative',
        minHeight: '100vh',
        background: gradients[currentGradient],
        overflow: 'hidden',
        color: 'white',
        transition: 'background 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      {/* Dynamic Background Effects */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at ${20 + mousePosition.x}% ${30 + mousePosition.y}%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at ${80 - mousePosition.x}% ${70 - mousePosition.y}%, rgba(0,0,0,0.2) 0%, transparent 50%)
          `,
          transition: 'background 0.3s ease',
        }}
      />

      {/* Animated Mesh Gradient */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            conic-gradient(from 180deg at 50% 50%, 
              transparent 0deg, 
              rgba(255,255,255,0.05) 90deg, 
              transparent 180deg, 
              rgba(0,0,0,0.1) 270deg, 
              transparent 360deg)
          `,
          animation: 'rotate 20s linear infinite',
          '@keyframes rotate': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      />

      {/* Floating Elements */}
      {[...Array(8)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: { xs: 2, md: 4 },
            height: { xs: 2, md: 4 },
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 3) * 25}%`,
            animation: `float${i % 3} ${8 + i}s ease-in-out infinite`,
            '@keyframes float0': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: 0.3 },
              '50%': { transform: 'translateY(-20px) scale(1.5)', opacity: 0.8 },
            },
            '@keyframes float1': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: 0.4 },
              '50%': { transform: 'translateY(15px) scale(0.8)', opacity: 0.6 },
            },
            '@keyframes float2': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: 0.5 },
              '50%': { transform: 'translateY(-10px) scale(1.2)', opacity: 0.9 },
            },
          }}
        />
      ))}

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 10, height: '100vh' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' },
            gap: { xs: 4, lg: 8 },
            alignItems: 'center',
            height: '100%',
            py: { xs: 8, lg: 0 },
          }}
        >
          {/* Left Content - Spotify-style */}
          <Box
            sx={{
              animation: 'slideIn 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              '@keyframes slideIn': {
                '0%': { transform: 'translateY(40px)', opacity: 0 },
                '100%': { transform: 'translateY(0)', opacity: 1 },
              },
            }}
          >
            {/* Live Indicator - Spotify Style */}
            <Fade in timeout={800}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: { xs: 3, lg: 4 },
                  px: 4,
                  py: 1.5,
                  borderRadius: '100px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#1DB954',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.6, transform: 'scale(1.4)' },
                    },
                  }}
                />
                Live Auctions
              </Box>
            </Fade>

            {/* Main Heading - Modern Typography */}
            <Grow in timeout={1000}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.8rem', sm: '3.8rem', md: '4.5rem', lg: '5.5rem', xl: '6.5rem' },
                  fontWeight: 900,
                  lineHeight: { xs: 0.95, lg: 0.9 },
                  mb: { xs: 2, lg: 3 },
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.8) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                Discover.{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #FFE082 0%, #FFD54F 50%, #FFC107 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -8,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #FFE082, #FFC107)',
                      borderRadius: 2,
                      opacity: 0.7,
                    },
                  }}
                >
                  Bid.
                </Box>{' '}
                Win.
              </Typography>
            </Grow>

            {/* Subtitle - Spotify-style */}
            <Fade in timeout={1200}>
              <Typography
                variant="h5"
                sx={{
                  mb: { xs: 4, lg: 6 },
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  maxWidth: { xs: '100%', lg: '480px' },
                  fontSize: { xs: '1.3rem', lg: '1.5rem' },
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                Experience the thrill of live bidding on exclusive items from around the world. 
                Your next treasure awaits.
              </Typography>
            </Fade>

            {/* CTA Buttons - Spotify Design */}
            <Fade in timeout={1400}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: { xs: 6, lg: 8 } }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push('/auctions')}
                  startIcon={<PlayIcon />}
                  sx={{
                    px: { xs: 4, sm: 6 },
                    py: { xs: 1.8, sm: 2.2 },
                    fontSize: { xs: '1.1rem', sm: '1.2rem' },
                    fontWeight: 700,
                    borderRadius: '100px',
                    background: '#ffffff',
                    color: '#000000',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    textTransform: 'none',
                    fontFamily: '"Inter", sans-serif',
                    minWidth: { xs: 'auto', sm: 200 },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: '#f5f5f5',
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                    },
                    '&:active': {
                      transform: 'translateY(0px) scale(1)',
                    },
                  }}
                >
                  Start Bidding
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => router.push('/about')}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: { xs: 4, sm: 6 },
                    py: { xs: 1.8, sm: 2.2 },
                    fontSize: { xs: '1.1rem', sm: '1.2rem' },
                    fontWeight: 600,
                    borderRadius: '100px',
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#ffffff',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    textTransform: 'none',
                    fontFamily: '"Inter", sans-serif',
                    minWidth: { xs: 'auto', sm: 180 },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.6)',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Learn More
                </Button>
              </Stack>
            </Fade>

            {/* Stats - Minimalist Design */}
            <Fade in timeout={1600}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: { xs: 3, sm: 4 },
                  pt: { xs: 4, lg: 6 },
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                {[
                  { value: '1M+', label: 'Active Users', icon: PersonIcon },
                  { value: '$2.5B+', label: 'Total Volume', icon: TrendingIcon },
                  { value: '99.9%', label: 'Satisfaction', icon: StarIcon },
                ].map((stat, index) => (
                  <Box key={index} sx={{ textAlign: 'left' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <stat.icon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }} />
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '1.8rem', sm: '2.2rem' },
                        lineHeight: 1,
                        mb: 0.5,
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Fade>
          </Box>

          {/* Right Content - Featured Auction Card */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Grow in timeout={1800}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: { xs: 320, md: 380, lg: 420 },
                }}
              >
                {/* Main Card - Spotify-inspired */}
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
                      '& .play-button': {
                        transform: 'scale(1.1)',
                        background: '#ffffff',
                      },
                    },
                  }}
                  onClick={() => currentItem && router.push(`/auctions/${currentItem.id}`)}
                >
                  {/* Image Container */}
                  <Box
                    sx={{
                      height: { xs: 280, md: 300, lg: 320 },
                      background: currentItem?.images?.[0] 
                        ? `url(${currentItem.images[0]})` 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
                      },
                    }}
                  >
                    {/* Status Badges */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        display: 'flex',
                        gap: 1,
                        zIndex: 2,
                      }}
                    >
                      <Chip
                        label="LIVE"
                        size="small"
                        sx={{
                          background: '#1DB954',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          height: 28,
                          '& .MuiChip-label': { px: 1.5 },
                        }}
                      />
                      <Chip
                        label={timeLeft.text}
                        size="small"
                        sx={{
                          background: timeLeft.urgent ? '#ff4444' : 'rgba(0,0,0,0.6)',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 28,
                          backdropFilter: 'blur(10px)',
                          '& .MuiChip-label': { px: 1.5 },
                        }}
                      />
                    </Box>

                    {/* Favorites */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 2,
                        py: 1,
                        borderRadius: '100px',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        zIndex: 2,
                      }}
                    >
                      <FavoriteIcon sx={{ fontSize: 16, color: '#ff4444' }} />
                      {currentItem?.favoriteCount || 0}
                    </Box>

                    {/* Play Button */}
                    <IconButton
                      className="play-button"
                      sx={{
                        width: 80,
                        height: 80,
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(20px)',
                        zIndex: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: '#ffffff',
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPlaying(!isPlaying);
                      }}
                    >
                      {isPlaying ? (
                        <PauseIcon sx={{ fontSize: 32, color: '#000' }} />
                      ) : (
                        <PlayIcon sx={{ fontSize: 32, color: '#000', ml: 0.5 }} />
                      )}
                    </IconButton>
                  </Box>

                  {/* Card Content */}
                  <Box sx={{ p: 4 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        mb: 1,
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {currentItem?.category?.name || 'Premium Collection'}
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: 'white',
                        mb: 3,
                        lineHeight: 1.3,
                        fontSize: '1.4rem',
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {currentItem?.title || 'Exclusive Auction Item'}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ 
                            color: 'rgba(255,255,255,0.7)', 
                            mb: 0.5,
                            fontSize: '0.8rem',
                            fontWeight: 500,
                          }}
                        >
                          Current Bid
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 800,
                            color: '#FFE082',
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '1.5rem',
                          }}
                        >
                          ${currentItem?.currentBid?.toLocaleString() || '12,500'}
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          sx={{ 
                            color: 'rgba(255,255,255,0.7)', 
                            mb: 0.5,
                            fontSize: '0.8rem',
                            fontWeight: 500,
                          }}
                        >
                          Watchers
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ 
                            fontWeight: 700, 
                            color: 'white',
                            fontFamily: '"Inter", sans-serif',
                          }}
                        >
                          {currentItem?.favoriteCount || 24}
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
                    mt: 3,
                  }}
                >
                  {heroProducts.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => {
                        setActiveItem(index);
                        setCurrentGradient(index % gradients.length);
                      }}
                      sx={{
                        width: activeItem === index ? 32 : 8,
                        height: 8,
                        borderRadius: '100px',
                        background: activeItem === index 
                          ? '#ffffff'
                          : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: 'rgba(255,255,255,0.7)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grow>
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
          opacity: 0.8,
          animation: 'bounce 2s infinite',
          '@keyframes bounce': {
            '0%, 20%, 50%, 80%, 100%': { transform: 'translateX(-50%) translateY(0)' },
            '40%': { transform: 'translateX(-50%) translateY(-8px)' },
            '60%': { transform: 'translateX(-50%) translateY(-4px)' },
          },
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontSize: '0.8rem',
            fontWeight: 500,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          Scroll to explore
        </Typography>
        <Box
          sx={{
            width: 2,
            height: 24,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)',
            borderRadius: '2px',
          }}
        />
      </Box>
    </Box>
  );
}