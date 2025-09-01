'use client';

import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Card,
  Avatar,
  Rating,
  Chip,
  Typography,
  IconButton,
  CardContent,
  Skeleton,
  Zoom,
  Grow,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteOutlineIcon,
  Visibility as ViewIcon,
  AccessTime as TimeIcon,
  LocalOffer as BidIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';

// ----------------------------------------------------------------------

const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  maxHeight: '640px',
  borderRadius: '28px',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
  cursor: 'pointer',
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  transformOrigin: 'center bottom',
  '&:hover': {
    transform: 'translateY(-20px) scale(1.03)',
    boxShadow: '0 32px 64px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(206, 14, 45, 0.15)',
    '& .card-image': {
      transform: 'scale(1.08) rotate(0.5deg)',
      filter: 'brightness(1.05) contrast(1.05)',
    },
    '& .card-image-overlay': {
      opacity: 1,
    },
    '& .card-content': {
      transform: 'translateY(-4px)',
    },
    '& .hover-actions': {
      opacity: 1,
      transform: 'translateY(0) scale(1)',
    },
    '& .price-section': {
      background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.08), rgba(255, 68, 68, 0.08))',
    },
  },
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '320px',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  borderRadius: '0 0 20px 20px',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.15) 100%)',
    zIndex: 1,
    pointerEvents: 'none',
  },
}));

const ProductImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
  transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
  filter: 'brightness(1.0) contrast(1.0) saturate(1.1)',
}));

const ImageOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
  opacity: 0,
  transition: 'opacity 0.4s ease',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: theme.spacing(3),
  zIndex: 2,
}));

const StatusBadge = styled(Chip)<{ variant: 'live' | 'ending' | 'featured' | 'trending' | 'upcoming' | 'recent' }>(
  ({ theme, variant }) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'live':
          return {
            background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
            animation: 'livePulse 2s infinite',
            boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)',
          };
        case 'ending':
          return {
            background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
            animation: 'urgentPulse 1.5s infinite',
            boxShadow: '0 4px 20px rgba(206, 14, 45, 0.4)',
          };
        case 'featured':
          return {
            background: 'linear-gradient(135deg, #FF9800, #FFB74D)',
            boxShadow: '0 4px 20px rgba(255, 152, 0, 0.4)',
          };
        case 'trending':
          return {
            background: 'linear-gradient(135deg, #9C27B0, #BA68C8)',
            boxShadow: '0 4px 20px rgba(156, 39, 176, 0.4)',
          };
        default:
          return {
            background: 'linear-gradient(135deg, #2196F3, #64B5F6)',
            boxShadow: '0 4px 20px rgba(33, 150, 243, 0.4)',
          };
      }
    };

    return {
      position: 'absolute',
      top: 16,
      left: 16,
      height: '32px',
      fontSize: '0.75rem',
      fontWeight: 700,
      color: 'white',
      border: 'none',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      zIndex: 3,
      ...getVariantStyles(),
      '@keyframes livePulse': {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.05)' },
      },
      '@keyframes urgentPulse': {
        '0%, 100%': { transform: 'scale(1)', opacity: 1 },
        '50%': { transform: 'scale(1.05)', opacity: 0.9 },
      },
    };
  }
);

const FavoriteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  width: 48,
  height: 48,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  zIndex: 3,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: 'white',
    transform: 'scale(1.1) rotate(5deg)',
    boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)',
  },
}));

const ContentContainer = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3.5),
  paddingBottom: `${theme.spacing(2)} !important`,
  transition: 'transform 0.4s ease',
  minHeight: '280px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
}));

const CountdownContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const CountdownItem = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(1),
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.1), rgba(255, 68, 68, 0.1))',
  border: '1px solid rgba(206, 14, 45, 0.2)',
}));

const PriceSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(3),
  marginTop: 'auto',
  background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.04), rgba(255, 68, 68, 0.04))',
  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
  borderRadius: '20px 20px 0 0',
  margin: `-${theme.spacing(0.5)} -${theme.spacing(3.5)} -${theme.spacing(2)}`,
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(206, 14, 45, 0.2), transparent)',
  },
}));

const HoverActions = styled(Box)(({ theme }) => ({
  opacity: 0,
  transform: 'translateY(24px) scale(0.9)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
  display: 'flex',
  gap: theme.spacing(1.5),
  justifyContent: 'center',
  alignItems: 'center',
}));

const ImageSkeleton = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  background: `
    linear-gradient(90deg, 
      rgba(240, 240, 240, 0.8) 0%, 
      rgba(250, 250, 250, 1) 50%, 
      rgba(240, 240, 240, 0.8) 100%
    )`,
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.disabled,
  fontSize: '0.875rem',
  fontWeight: 500,
  '@keyframes shimmer': {
    '0%': { backgroundPosition: '200% 0' },
    '100%': { backgroundPosition: '-200% 0' },
  },
}));

const AgentSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2, 0),
  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  marginBottom: theme.spacing(2),
}));

const MetricsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: theme.spacing(1.5),
  paddingTop: theme.spacing(1.5),
  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
}));

const MetricItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.secondary,
  fontSize: '0.8rem',
  fontWeight: 500,
}));

const QuickViewButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: 12,
  right: 12,
  width: 40,
  height: 40,
  backgroundColor: '#CE0E2D',
  color: 'white',
  opacity: 0,
  transform: 'translateY(8px)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#a10e24',
  },
}));

// ----------------------------------------------------------------------

interface PremiumAuctionCardProps {
  product: {
    id: string;
    title: string;
    category: { name: string };
    images: string[];
    estimatedValueMin: number;
    estimatedValueMax: number;
    currentBid?: number;
    agent: {
      displayName: string;
      businessName?: string;
      logoUrl: string;
      rating: number;
    };
    viewCount?: number;
    favoriteCount?: number;
    auction?: {
      startTime: string;
      endTime: string;
      status: string;
    };
    auctionStatus?: string;
  };
  variant?: 'live' | 'ending' | 'featured' | 'trending' | 'upcoming' | 'recent';
  onClick?: () => void;
  onFavorite?: () => void;
  onQuickView?: () => void;
}

export function PremiumAuctionCard({
  product,
  variant = 'featured',
  onClick,
  onFavorite,
  onQuickView,
}: PremiumAuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const endTime = product.auction?.endTime;
  const startTime = product.auction?.startTime;

  useEffect(() => {
    if (!endTime && !startTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetTime = variant === 'upcoming' ? startTime : endTime;
      if (!targetTime) return;

      const target = new Date(targetTime).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime, startTime, variant]);

  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1606220945770-b5b6c2c5bdc5?w=640&h=480&fit=crop&crop=center&auto=format&q=85';
  const displayPrice = product.currentBid || product.estimatedValueMin;
  const priceLabel = product.currentBid ? 'Current Bid' : 'Starting Price';

  const showCountdown = (variant === 'live' || variant === 'ending' || variant === 'upcoming') &&
    (endTime || startTime) &&
    (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0);

  const getBadgeContent = () => {
    switch (variant) {
      case 'live':
        return { icon: <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />, text: 'Live' };
      case 'ending':
        return { icon: <TimeIcon sx={{ fontSize: 14 }} />, text: 'Ending Soon' };
      case 'featured':
        return { icon: <StarIcon sx={{ fontSize: 14 }} />, text: 'Featured' };
      case 'trending':
        return { icon: <TrendingIcon sx={{ fontSize: 14 }} />, text: 'Trending' };
      case 'upcoming':
        return { icon: <TimeIcon sx={{ fontSize: 14 }} />, text: 'Coming Soon' };
      case 'recent':
        return { icon: <StarIcon sx={{ fontSize: 14 }} />, text: 'New' };
      default:
        return { icon: <StarIcon sx={{ fontSize: 14 }} />, text: 'Auction' };
    }
  };

  const badgeContent = getBadgeContent();

  return (
    <StyledCard onClick={onClick}>
      <ImageContainer>
        {/* Simple Image Display */}
        <ProductImage
          className="card-image"
          src={primaryImage}
          alt={product.title}
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/400x240/f1f5f9/64748b?text=No+Image';
          }}
        />

        {/* Status Badge */}
        <StatusBadge
          variant={variant}
          label={getBadgeContent().text}
        />

        {/* Favorite Button */}
        {onFavorite && (
          <FavoriteButton
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorited(!isFavorited);
              onFavorite();
            }}
          >
            {isFavorited ? <FavoriteIcon sx={{ color: '#CE0E2D' }} /> : <FavoriteOutlineIcon />}
          </FavoriteButton>
        )}

        {/* Quick View Button */}
        <QuickViewButton
          className="quick-view-btn"
          onClick={(e) => {
            e.stopPropagation();
            onQuickView?.();
          }}
        >
          <LaunchIcon sx={{ fontSize: 20 }} />
        </QuickViewButton>
      </ImageContainer>

        <ContentContainer className="card-content">
          <Box>
            {/* Category */}
            <Typography
              variant="body2"
              sx={{
                color: '#CE0E2D',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontSize: '0.75rem',
                fontWeight: 600,
                mb: 1,
              }}
            >
              {product.category.name}
            </Typography>

            {/* Title */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'text.primary',
                mb: 2,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minHeight: '2.8em',
              }}
            >
              {product.title}
            </Typography>

            {/* Countdown Timer */}
            {showCountdown && (
              <CountdownContainer>
                <CountdownItem>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#CE0E2D', fontFamily: '"Roboto Mono", monospace' }}>
                    {timeLeft.days.toString().padStart(2, '0')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                    Days
                  </Typography>
                </CountdownItem>
                <CountdownItem>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#CE0E2D', fontFamily: '"Roboto Mono", monospace' }}>
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                    Hours
                  </Typography>
                </CountdownItem>
                <CountdownItem>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#CE0E2D', fontFamily: '"Roboto Mono", monospace' }}>
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                    Min
                  </Typography>
                </CountdownItem>
              </CountdownContainer>
            )}

            {/* Agent Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                src={product.agent.logoUrl}
                alt={product.agent.businessName || product.agent.displayName}
                sx={{ width: 32, height: 32 }}
              >
                {(product.agent.businessName || product.agent.displayName).charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.agent.businessName || product.agent.displayName}
                  </Typography>
                  <VerifiedIcon sx={{ fontSize: 14, color: '#CE0E2D' }} />
                </Box>
                <Rating
                  value={product.agent.rating}
                  readOnly
                  size="small"
                  precision={0.1}
                  sx={{ fontSize: '0.7rem' }}
                />
              </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ViewIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {product.viewCount?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FavoriteIcon sx={{ fontSize: 16, color: '#CE0E2D' }} />
                <Typography variant="body2" color="text.secondary">
                  {product.favoriteCount?.toLocaleString() || 0}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Price Section */}
          <PriceSection>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.8rem' }}
            >
              {priceLabel}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#CE0E2D',
                  fontFamily: '"Roboto Mono", monospace',
                }}
              >
                ${displayPrice?.toLocaleString() || 'N/A'}
              </Typography>
              <BidIcon sx={{ fontSize: 24, color: '#CE0E2D', opacity: 0.7 }} />
            </Box>
          </PriceSection>
        </ContentContainer>
      </StyledCard>
    </Grow>
  );
}