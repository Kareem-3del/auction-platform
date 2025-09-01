'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';

import { styled } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Avatar,
  Rating,
  Typography,
  IconButton,
  CardContent,
  Skeleton,
} from '@mui/material';
import {
  Star as StarIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  LocalOffer as BidIcon,
  Favorite as FavoriteIcon,
  Verified as VerifiedIcon,
  TrendingUp as TrendingIcon,
  FavoriteBorder as FavoriteOutlineIcon,
} from '@mui/icons-material';

// ----------------------------------------------------------------------

const StyledCard = styled(Card)<{ size?: 'default' | 'compact' }>(({ theme, size = 'default' }) => ({
  height: '100%',
  maxHeight: size === 'compact' ? '360px' : '520px', // Adjusted height for compact
  display: 'flex',
  flexDirection: 'column',
  borderRadius: size === 'compact' ? '16px' : '20px',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  '&:hover': {
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
    transform: size === 'compact' ? 'translateY(-6px) scale(1.01)' : 'translateY(-12px) scale(1.02)',
    borderColor: theme.palette.primary.main,
    '& .product-image': {
      transform: 'scale(1.08)',
    },
    '& .overlay-content': {
      opacity: 1,
    },
  },
}));

const ImageContainer = styled(Box)<{ size?: 'default' | 'compact' }>(({ theme, size = 'default' }) => ({
  position: 'relative',
  width: '100%',
  height: size === 'compact' ? '160px' : '240px', // Adjusted height for compact
  overflow: 'hidden',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ProductImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover', // Ensures image fills entire space while maintaining aspect ratio
  objectPosition: 'center',
  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.grey[100],
}));

const ImageOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  zIndex: 2,
}));

const StatusBadge = styled(Box)<{ variant: 'live' | 'ending' | 'featured' | 'trending' | 'upcoming' | 'recent' }>(({ theme, variant }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'live':
        return {
          background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
          animation: 'pulse 2s infinite',
          boxShadow: '0 4px 16px rgba(76, 175, 80, 0.4)',
        };
      case 'ending':
        return {
          background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
          animation: 'urgentPulse 1.5s infinite',
          boxShadow: '0 4px 16px rgba(206, 14, 45, 0.4)',
        };
      case 'featured':
        return {
          background: 'linear-gradient(135deg, #FF9800, #FFB74D)',
          boxShadow: '0 4px 16px rgba(255, 152, 0, 0.4)',
        };
      case 'trending':
        return {
          background: 'linear-gradient(135deg, #9C27B0, #BA68C8)',
          boxShadow: '0 4px 16px rgba(156, 39, 176, 0.4)',
        };
      case 'upcoming':
        return {
          background: 'linear-gradient(135deg, #2196F3, #64B5F6)',
          boxShadow: '0 4px 16px rgba(33, 150, 243, 0.4)',
        };
      case 'recent':
        return {
          background: 'linear-gradient(135deg, #607D8B, #90A4AE)',
          boxShadow: '0 4px 16px rgba(96, 125, 139, 0.4)',
        };
      default:
        return {
          background: theme.palette.primary.main,
          boxShadow: '0 4px 16px rgba(33, 150, 243, 0.4)',
        };
    }
  };

  return {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: '24px',
    padding: '8px 16px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    zIndex: 3,
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    maxWidth: '140px',
    ...getVariantStyles(),
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)' },
    },
    '@keyframes urgentPulse': {
      '0%': { transform: 'scale(1)', opacity: 1 },
      '50%': { transform: 'scale(1.05)', opacity: 0.9 },
      '100%': { transform: 'scale(1)', opacity: 1 },
    },
  };
});

const FavoriteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(12px)',
  width: 44,
  height: 44,
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  zIndex: 3,
  border: `1px solid rgba(255, 255, 255, 0.3)`,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    transform: 'scale(1.1)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
  },
}));

const CountdownContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(12px)',
  borderRadius: '16px',
  padding: '8px 12px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
}));

const CountdownItem = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  minWidth: '24px',
}));

const CountdownNumber = styled(Typography)(({ theme }) => ({
  fontSize: '0.8rem',
  fontWeight: 800,
  color: '#CE0E2D',
  lineHeight: 1,
  fontFamily: '"Roboto Mono", monospace',
}));

const CountdownLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.6rem',
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  fontWeight: 600,
  marginTop: '2px',
}));

const ContentContainer = styled(CardContent)<{ size?: 'default' | 'compact' }>(({ theme, size = 'default' }) => ({
  padding: size === 'compact' ? theme.spacing(1.5) : theme.spacing(2.5),
  paddingBottom: `${size === 'compact' ? theme.spacing(1.5) : theme.spacing(2.5)} !important`,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  flexGrow: 1,
  minHeight: size === 'compact' ? '120px' : '180px', // Adjusted for compact
  maxHeight: size === 'compact' ? '120px' : '180px', // Adjusted for compact
}));

const AgentSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 20px',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.02)' 
    : 'rgba(0, 0, 0, 0.02)',
  borderTop: `1px solid ${theme.palette.divider}`,
  minHeight: '68px', // Fixed height for agent section
}));

const PriceSection = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
  textAlign: 'center',
  background: `linear-gradient(135deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.08)' : 'rgba(206, 14, 45, 0.04)'}, 
    ${theme.palette.mode === 'dark' ? 'rgba(255, 68, 68, 0.08)' : 'rgba(255, 68, 68, 0.04)'})`,
  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.15)' : 'rgba(206, 14, 45, 0.1)'}`,
  minHeight: '72px', // Fixed height for price section
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}));

// ----------------------------------------------------------------------

export interface UnifiedAuctionCardProps {
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
  size?: 'default' | 'compact';
  onClick?: () => void;
  onFavorite?: () => void;
}

export const UnifiedAuctionCard: FC<UnifiedAuctionCardProps> = ({
  product,
  variant = 'featured',
  size = 'default',
  onClick,
  onFavorite,
}) => {
  const {
    id,
    title,
    category,
    images,
    estimatedValueMin,
    estimatedValueMax,
    currentBid,
    agent,
    viewCount = 0,
    favoriteCount = 0,
    auction,
    auctionStatus,
  } = product;
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const endTime = auction?.endTime;
  const startTime = auction?.startTime;
  
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

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  const getBadgeContent = () => {
    switch (variant) {
      case 'live':
        return { 
          icon: <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />, 
          text: 'Live' 
        };
      case 'ending':
        return { 
          icon: <TimeIcon sx={{ fontSize: 14 }} />, 
          text: 'Ending Soon' 
        };
      case 'featured':
        return { 
          icon: <StarIcon sx={{ fontSize: 14 }} />, 
          text: 'Featured' 
        };
      case 'trending':
        return { 
          icon: <TrendingIcon sx={{ fontSize: 14 }} />, 
          text: 'Trending' 
        };
      case 'upcoming':
        return { 
          icon: <TimeIcon sx={{ fontSize: 14 }} />, 
          text: 'Starting Soon' 
        };
      case 'recent':
        return { 
          icon: <StarIcon sx={{ fontSize: 14 }} />, 
          text: 'New' 
        };
      default:
        return { 
          icon: <StarIcon sx={{ fontSize: 14 }} />, 
          text: 'Auction' 
        };
    }
  };

  const badgeContent = getBadgeContent();
  const displayPrice = currentBid || estimatedValueMin;
  const priceLabel = currentBid ? 'Current Bid' : estimatedValueMin ? 'Starting Bid' : 'Estimate';

  const showCountdown = (variant === 'live' || variant === 'ending' || variant === 'upcoming') && 
                       (endTime || startTime) && 
                       (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0);

  const primaryImage = images && images.length > 0 ? images[0] : '/api/placeholder/400/300';

  return (
    <StyledCard size={size} onClick={onClick}>
      <ImageContainer size={size}>
        {imageLoading && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
          />
        )}
        {!imageError ? (
          <ProductImage
            className="product-image"
            src={primaryImage}
            alt={title}
            loading="lazy"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            style={{ display: imageLoading ? 'none' : 'block' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              color: 'text.secondary',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <ViewIcon sx={{ fontSize: 32, opacity: 0.5 }} />
            <Typography variant="body2" sx={{ opacity: 0.7 }}>No Image</Typography>
          </Box>
        )}
        
        <ImageOverlay>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <StatusBadge variant={variant}>
              {badgeContent.icon}
              {badgeContent.text}
            </StatusBadge>
            
            {onFavorite && (
              <FavoriteButton
                className="overlay-content"
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite();
                }}
                sx={{ 
                  color: isFavorited ? '#CE0E2D' : 'text.secondary',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                }}
              >
                {isFavorited ? <FavoriteIcon /> : <FavoriteOutlineIcon />}
              </FavoriteButton>
            )}
          </Box>
          
          {showCountdown && (
            <CountdownContainer className="overlay-content" sx={{ opacity: 0, transition: 'opacity 0.3s ease' }}>
              <CountdownItem>
                <CountdownNumber>{timeLeft.days}</CountdownNumber>
                <CountdownLabel>d</CountdownLabel>
              </CountdownItem>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>:</Typography>
              <CountdownItem>
                <CountdownNumber>{timeLeft.hours.toString().padStart(2, '0')}</CountdownNumber>
                <CountdownLabel>h</CountdownLabel>
              </CountdownItem>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>:</Typography>
              <CountdownItem>
                <CountdownNumber>{timeLeft.minutes.toString().padStart(2, '0')}</CountdownNumber>
                <CountdownLabel>m</CountdownLabel>
              </CountdownItem>
            </CountdownContainer>
          )}
        </ImageOverlay>
      </ImageContainer>

      <ContentContainer size={size}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              color: 'text.primary',
              mb: 1,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '2.6em',
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.8rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 2,
            }}
          >
            {category.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          {viewCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ViewIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {viewCount.toLocaleString()}
              </Typography>
            </Box>
          )}
          
          {favoriteCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FavoriteIcon sx={{ fontSize: 16, color: '#CE0E2D' }} />
              <Typography variant="caption" color="text.secondary">
                {favoriteCount.toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>
      </ContentContainer>

      {agent && (
        <AgentSection>
          <Avatar
            src={agent.logoUrl}
            alt={agent.businessName || agent.displayName}
            sx={{ width: 32, height: 32 }}
          >
            {(agent.businessName || agent.displayName).charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.8rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {agent.businessName || agent.displayName}
              </Typography>
              <VerifiedIcon sx={{ fontSize: 14, color: '#CE0E2D' }} />
            </Box>
            {agent.rating && (
              <Rating
                value={agent.rating}
                readOnly
                size="small"
                precision={0.1}
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </AgentSection>
      )}

      {displayPrice && (
        <PriceSection>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
            {priceLabel}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: '#CE0E2D',
              fontSize: '1.1rem',
            }}
          >
            {formatPrice(displayPrice)}
          </Typography>
        </PriceSection>
      )}
    </StyledCard>
  );
};