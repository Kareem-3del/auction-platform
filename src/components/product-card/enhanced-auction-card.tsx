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

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  '&:hover': {
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-8px)',
    borderColor: theme.palette.primary.main,
    '& .product-image': {
      transform: 'scale(1.05)',
    },
    '& .card-overlay': {
      opacity: 1,
    },
  },
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 280,
  overflow: 'hidden',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ProductImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.background.neutral,
}));

const CardOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  display: 'flex',
  alignItems: 'flex-end',
  padding: theme.spacing(2),
  zIndex: 2,
}));

const StatusBadge = styled(Box)<{ variant: 'live' | 'ending' | 'featured' | 'trending' }>(({ theme, variant }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'live':
        return {
          background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
          animation: 'pulse 2s infinite',
        };
      case 'ending':
        return {
          background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
          animation: 'urgentPulse 1.5s infinite',
        };
      case 'featured':
        return {
          background: 'linear-gradient(135deg, #FF9800, #FFB74D)',
        };
      case 'trending':
        return {
          background: 'linear-gradient(135deg, #9C27B0, #BA68C8)',
        };
      default:
        return {
          background: theme.palette.primary.main,
        };
    }
  };

  return {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: '20px',
    padding: '8px 16px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    zIndex: 3,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    ...getVariantStyles(),
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)' },
    },
    '@keyframes urgentPulse': {
      '0%': { transform: 'scale(1)', boxShadow: '0 4px 16px rgba(206, 14, 45, 0.4)' },
      '50%': { transform: 'scale(1.05)', boxShadow: '0 6px 20px rgba(206, 14, 45, 0.6)' },
      '100%': { transform: 'scale(1)', boxShadow: '0 4px 16px rgba(206, 14, 45, 0.4)' },
    },
  };
});

const FavoriteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  width: 40,
  height: 40,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  zIndex: 3,
  border: `1px solid rgba(255, 255, 255, 0.2)`,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    transform: 'scale(1.1)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
  },
}));

const CountdownContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 16,
  left: 16,
  right: 16,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 3,
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
}));

const CountdownItem = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  minWidth: '32px',
}));

const CountdownNumber = styled(Typography)(({ theme }) => ({
  fontSize: '0.9rem',
  fontWeight: 800,
  color: '#CE0E2D',
  lineHeight: 1,
  fontFamily: '"Roboto Mono", monospace',
}));

const CountdownLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.65rem',
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  fontWeight: 600,
  marginTop: '2px',
}));

const AgentSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px 20px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.02)' 
    : 'rgba(0, 0, 0, 0.01)',
}));

const PriceSection = styled(Box)(({ theme }) => ({
  padding: '20px',
  textAlign: 'center',
  background: `linear-gradient(135deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.05)' : 'rgba(206, 14, 45, 0.02)'}, 
    ${theme.palette.mode === 'dark' ? 'rgba(255, 68, 68, 0.05)' : 'rgba(255, 68, 68, 0.02)'})`,
  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.1)' : 'rgba(206, 14, 45, 0.08)'}`,
}));

const StatsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.02)' 
    : 'rgba(0, 0, 0, 0.01)',
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const StatItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  fontWeight: 500,
}));

// ----------------------------------------------------------------------

export interface EnhancedAuctionCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  status: 'live' | 'ending' | 'featured' | 'trending' | 'upcoming';
  endTime?: string | Date;
  startTime?: string | Date;
  currentBid?: number;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  bidCount?: number;
  viewCount?: number;
  favoriteCount?: number;
  agent?: {
    name: string;
    avatar?: string;
    rating: number;
    isVerified: boolean;
  };
  isFavorited?: boolean;
  currency?: string;
  onClick?: () => void;
  onFavorite?: () => void;
}

export const EnhancedAuctionCard: FC<EnhancedAuctionCardProps> = ({
  id,
  title,
  category,
  image,
  status,
  endTime,
  startTime,
  currentBid,
  estimatedValueMin,
  estimatedValueMax,
  bidCount = 0,
  viewCount = 0,
  favoriteCount = 0,
  agent,
  isFavorited = false,
  currency = 'USD',
  onClick,
  onFavorite,
}) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!endTime && !startTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetTime = status === 'upcoming' ? startTime : endTime;
      const target = new Date(targetTime!).getTime();
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
  }, [endTime, startTime, status]);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  const getBadgeContent = () => {
    switch (status) {
      case 'live':
        return { icon: <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'white' }} />, text: 'Live' };
      case 'ending':
        return { icon: <TimeIcon sx={{ fontSize: 14 }} />, text: 'Ending Soon' };
      case 'featured':
        return { icon: <StarIcon sx={{ fontSize: 14 }} />, text: 'Featured' };
      case 'trending':
        return { icon: <TrendingIcon sx={{ fontSize: 14 }} />, text: 'Trending' };
      case 'upcoming':
        return { icon: <TimeIcon sx={{ fontSize: 14 }} />, text: 'Starting Soon' };
      default:
        return { icon: <StarIcon sx={{ fontSize: 14 }} />, text: 'Auction' };
    }
  };

  const badgeContent = getBadgeContent();
  const displayPrice = currentBid || estimatedValueMin;
  const priceLabel = currentBid ? 'Current Bid' : estimatedValueMin ? 'Starting Bid' : 'Estimate';

  const showCountdown = (status === 'live' || status === 'ending' || status === 'upcoming') && 
                       (endTime || startTime) && 
                       (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0);

  return (
    <StyledCard onClick={onClick}>
      <StatusBadge variant={status === 'upcoming' ? 'featured' : status}>
        {badgeContent.icon}
        {badgeContent.text}
      </StatusBadge>
      
      {onFavorite && (
        <FavoriteButton
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
          sx={{ color: isFavorited ? '#CE0E2D' : 'text.secondary' }}
        >
          {isFavorited ? <FavoriteIcon /> : <FavoriteOutlineIcon />}
        </FavoriteButton>
      )}
      
      <ImageContainer>
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
            src={image}
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
            }}
          >
            <Typography variant="body2">No Image</Typography>
          </Box>
        )}
        
        <CardOverlay className="card-overlay">
          {showCountdown && (
            <CountdownContainer>
              <CountdownItem>
                <CountdownNumber>{timeLeft.days}</CountdownNumber>
                <CountdownLabel>Days</CountdownLabel>
              </CountdownItem>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.8rem' }}>:</Typography>
              <CountdownItem>
                <CountdownNumber>{timeLeft.hours.toString().padStart(2, '0')}</CountdownNumber>
                <CountdownLabel>Hrs</CountdownLabel>
              </CountdownItem>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.8rem' }}>:</Typography>
              <CountdownItem>
                <CountdownNumber>{timeLeft.minutes.toString().padStart(2, '0')}</CountdownNumber>
                <CountdownLabel>Min</CountdownLabel>
              </CountdownItem>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.8rem' }}>:</Typography>
              <CountdownItem>
                <CountdownNumber>{timeLeft.seconds.toString().padStart(2, '0')}</CountdownNumber>
                <CountdownLabel>Sec</CountdownLabel>
              </CountdownItem>
            </CountdownContainer>
          )}
        </CardOverlay>
      </ImageContainer>

      {agent && (
        <AgentSection>
          <Avatar
            src={agent.avatar}
            alt={agent.name}
            sx={{ width: 36, height: 36 }}
          >
            {agent.name.charAt(0).toUpperCase()}
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
                {agent.name}
              </Typography>
              {agent.isVerified && (
                <VerifiedIcon sx={{ fontSize: 16, color: '#CE0E2D' }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating
                value={agent.rating}
                readOnly
                size="small"
                precision={0.1}
                sx={{ fontSize: '0.8rem' }}
              />
              <Typography variant="caption" color="text.secondary">
                ({agent.rating.toFixed(1)})
              </Typography>
            </Box>
          </Box>
        </AgentSection>
      )}

      <CardContent sx={{ flexGrow: 1, p: 3, pb: 2 }}>
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
          }}
        >
          {category}
        </Typography>
      </CardContent>

      {displayPrice && (
        <PriceSection>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {priceLabel}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#CE0E2D',
              fontSize: '1.25rem',
              mt: 0.5,
            }}
          >
            {formatPrice(displayPrice)}
          </Typography>
          {estimatedValueMax && estimatedValueMax !== estimatedValueMin && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Est. {formatPrice(estimatedValueMax)}
            </Typography>
          )}
        </PriceSection>
      )}

      <StatsRow>
        {bidCount > 0 && (
          <StatItem>
            <BidIcon sx={{ fontSize: 16, color: '#CE0E2D' }} />
            {bidCount} bid{bidCount !== 1 ? 's' : ''}
          </StatItem>
        )}
        
        {viewCount > 0 && (
          <StatItem>
            <ViewIcon sx={{ fontSize: 16 }} />
            {viewCount.toLocaleString()} views
          </StatItem>
        )}
        
        {favoriteCount > 0 && (
          <StatItem>
            <FavoriteIcon sx={{ fontSize: 16, color: '#CE0E2D' }} />
            {favoriteCount}
          </StatItem>
        )}
      </StatsRow>
    </StyledCard>
  );
};