'use client';

import type { FC } from 'react';

import { styled } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Avatar,
  Rating,
  CardMedia,
  Typography,
  IconButton,
  CardContent,
} from '@mui/material';
import {
  Star as StarIcon,
  Visibility as ViewIcon,
  Favorite as FavoriteIcon,
  Verified as VerifiedIcon,
  TrendingUp as TrendingIcon,
  FavoriteBorder as FavoriteOutlineIcon,
} from '@mui/icons-material';

import { Iconify } from 'src/components/iconify';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-4px)',
    '& .product-image': {
      transform: 'scale(1.1)',
    },
    '& .featured-overlay': {
      opacity: 1,
    },
  },
}));

const FeaturedBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  left: 16,
  background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
  borderRadius: '16px',
  padding: '6px 12px',
  color: 'white',
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  zIndex: 3,
  boxShadow: '0 4px 12px rgba(206, 14, 45, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}));

const FavoriteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  backgroundColor: theme.palette.background.paper,
  backdropFilter: 'blur(10px)',
  width: 44,
  height: 44,
  boxShadow: theme.shadows[4],
  zIndex: 3,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.background.paper,
    transform: 'scale(1.1)',
    boxShadow: theme.shadows[8],
  },
}));

const ImageOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(45deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2))',
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease',
}));

const AgentSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 20px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.02)' 
    : 'rgba(0, 0, 0, 0.01)',
}));

const StatsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 20px',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.02)' 
    : 'rgba(0, 0, 0, 0.01)',
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const StatItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  fontWeight: 500,
}));

const PriceContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: '16px 20px',
  background: `linear-gradient(135deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.05)' : 'rgba(206, 14, 45, 0.03)'}, 
    ${theme.palette.mode === 'dark' ? 'rgba(255, 68, 68, 0.05)' : 'rgba(255, 68, 68, 0.03)'})`,
  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.2)' : 'rgba(206, 14, 45, 0.15)'}`,
}));

export interface FeaturedCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  currentBid?: number;
  agent: {
    name: string;
    avatar?: string;
    rating: number;
    isVerified: boolean;
  };
  viewCount: number;
  favoriteCount: number;
  isFavorited?: boolean;
  isTrending?: boolean;
  currency?: string;
  onClick?: () => void;
  onFavorite?: () => void;
}

export const FeaturedCard: FC<FeaturedCardProps> = ({
  id,
  title,
  category,
  image,
  estimatedValueMin,
  estimatedValueMax,
  currentBid,
  agent,
  viewCount,
  favoriteCount,
  isFavorited = false,
  isTrending = false,
  currency = 'USD',
  onClick,
  onFavorite,
}) => {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const formatShortPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

  const displayPrice = currentBid || estimatedValueMin;
  const priceLabel = currentBid ? 'Current Bid' : 'Minimum Bid';

  return (
    <StyledCard onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
      <FeaturedBadge>
        <StarIcon sx={{ fontSize: 16 }} />
        {isTrending ? 'Trending' : 'Featured'}
      </FeaturedBadge>
      
      <FavoriteButton
        onClick={(e) => {
          e.stopPropagation();
          onFavorite?.();
        }}
        sx={{
          color: isFavorited ? '#CE0E2D' : 'text.secondary',
        }}
      >
        {isFavorited ? <FavoriteIcon /> : <FavoriteOutlineIcon />}
      </FavoriteButton>
      
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="240"
          image={image}
          alt={title}
          className="product-image"
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <ImageOverlay className="featured-overlay">
          <Chip
            icon={<Iconify icon="mdi:eye-outline" />}
            label="Quick View"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: 'text.primary',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
            }}
          />
        </ImageOverlay>
      </Box>

      <AgentSection>
        <Avatar
          src={agent.avatar}
          alt={agent.name}
          sx={{ width: 36, height: 36 }}
        >
          {agent.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, fontSize: '0.8rem' }}
            >
              {agent.name}
            </Typography>
            {agent.isVerified && (
              <VerifiedIcon
                sx={{ fontSize: 16, color: '#CE0E2D' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating
              value={agent.rating}
              readOnly
              size="small"
              precision={0.1}
              sx={{ fontSize: '0.9rem' }}
            />
            <Typography variant="caption" color="text.secondary">
              ({agent.rating.toFixed(1)})
            </Typography>
          </Box>
        </Box>
      </AgentSection>

      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
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
            mb: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {category}
        </Typography>
      </CardContent>

      <PriceContainer>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          {priceLabel}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: '#CE0E2D',
            fontSize: '1.3rem',
            mt: 0.5,
          }}
        >
          {formatPrice(displayPrice)}
        </Typography>
      </PriceContainer>

      <StatsRow>
        <StatItem>
          <ViewIcon sx={{ fontSize: 16 }} />
          {viewCount.toLocaleString()} views
        </StatItem>
        
        <StatItem>
          <FavoriteIcon sx={{ fontSize: 16, color: '#CE0E2D' }} />
          {favoriteCount} likes
        </StatItem>
        
        {isTrending && (
          <StatItem>
            <TrendingIcon sx={{ fontSize: 16, color: '#CE0E2D' }} />
            Trending
          </StatItem>
        )}
      </StatsRow>
    </StyledCard>
  );
};