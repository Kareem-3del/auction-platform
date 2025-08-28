'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Button,
  Container,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundColor?: string;
  textColor?: string;
  type: 'hero' | 'promotion' | 'announcement';
}

const defaultBanners: Banner[] = [
  {
    id: '1',
    title: 'Discover Rare Collectibles',
    subtitle: 'Exclusive Auction Event',
    description: 'Find unique antiques, art pieces, and collectibles from verified sellers worldwide.',
    image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    ctaText: 'Explore Auctions',
    ctaLink: '/auctions',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
    type: 'hero',
  },
  {
    id: '2', 
    title: 'Sell Your Items with Confidence',
    subtitle: 'Join Our Marketplace',
    description: 'List your products and reach thousands of potential buyers. Get started in minutes.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    ctaText: 'Start Selling',
    ctaLink: '/dashboard',
    backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    textColor: '#ffffff',
    type: 'promotion',
  },
  {
    id: '3',
    title: 'New Features Available',
    subtitle: 'Enhanced Bidding Experience',
    description: 'Auto-bidding, real-time notifications, and improved user interface now live.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    ctaText: 'Learn More',
    ctaLink: '/products',
    backgroundColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    textColor: '#ffffff',
    type: 'announcement',
  },
];

interface HomepageBannerProps {
  banners?: Banner[];
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  height?: number;
}

export default function HomepageBanner({
  banners = defaultBanners,
  autoPlay = true,
  interval = 5000,
  showDots = true,
  showArrows = true,
  height = 400,
}: HomepageBannerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState<string[]>([]);

  const activeBanners = banners.filter(banner => !isDismissed.includes(banner.id));

  useEffect(() => {
    if (!autoPlay || activeBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, activeBanners.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? activeBanners.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleCTAClick = (banner: Banner) => {
    if (banner.ctaLink) {
      router.push(banner.ctaLink);
    }
  };

  const handleDismiss = (bannerId: string) => {
    setIsDismissed(prev => [...prev, bannerId]);
    if (currentIndex >= activeBanners.length - 1) {
      setCurrentIndex(0);
    }
  };

  if (activeBanners.length === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex];

  return (
    <Container maxWidth="xl" sx={{ mb: 4 }}>
      <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
        <Card
          sx={{
            position: 'relative',
            height,
            display: 'flex',
            alignItems: 'center',
            background: currentBanner.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: currentBanner.textColor || '#ffffff',
            overflow: 'hidden',
          }}
        >
          {/* Background Image */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${currentBanner.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.3,
              '&::after': {
                content: '\"\"',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: currentBanner.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                opacity: 0.7,
              },
            }}
          />

          {/* Content */}
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, py: 4 }}>
            <Box textAlign="center">
              {currentBanner.subtitle && (
                <Typography
                  variant="overline"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    letterSpacing: 1,
                    mb: 1,
                    opacity: 0.9,
                  }}
                >
                  {currentBanner.subtitle}
                </Typography>
              )}
              
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' },
                  lineHeight: 1.2,
                }}
              >
                {currentBanner.title}
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  maxWidth: 600,
                  mx: 'auto',
                  opacity: 0.95,
                  lineHeight: 1.6,
                }}
              >
                {currentBanner.description}
              </Typography>
              
              {currentBanner.ctaText && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => handleCTAClick(currentBanner)}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'inherit',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {currentBanner.ctaText}
                </Button>
              )}
            </Box>
          </Container>

          {/* Dismiss Button */}
          <IconButton
            onClick={() => handleDismiss(currentBanner.id)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'inherit',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Navigation Arrows */}
          {showArrows && activeBanners.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'inherit',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 60,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'inherit',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </>
          )}
        </Card>

        {/* Dots Indicator */}
        {showDots && activeBanners.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
            }}
          >
            {activeBanners.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentIndex(index)}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'white',
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}