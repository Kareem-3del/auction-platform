'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  Avatar,
  Rating,
  Typography,
  IconButton,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteOutlineIcon,
  Visibility as ViewIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';

interface SimplePremiumCardProps {
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
  };
  variant?: 'live' | 'ending' | 'featured' | 'trending' | 'upcoming' | 'recent';
  onClick?: () => void;
  onFavorite?: () => void;
  onQuickView?: () => void;
}

const getBadgeColor = (variant: string) => {
  switch (variant) {
    case 'live': return '#10b981';
    case 'ending': return '#ef4444';
    case 'featured': return '#f59e0b';
    case 'trending': return '#8b5cf6';
    default: return '#3b82f6';
  }
};

const getBadgeText = (variant: string) => {
  switch (variant) {
    case 'live': return 'Live';
    case 'ending': return 'Ending Soon';
    case 'featured': return 'Featured';
    case 'trending': return 'Trending';
    case 'upcoming': return 'Coming Soon';
    case 'recent': return 'New';
    default: return 'Auction';
  }
};

export function SimplePremiumCard({
  product,
  variant = 'featured',
  onClick,
  onFavorite,
  onQuickView,
}: SimplePremiumCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1606220945770-b5b6c2c5bdc5?w=400&h=300&fit=crop&crop=center';
  const displayPrice = product.currentBid || product.estimatedValueMin;
  const priceLabel = product.currentBid ? 'Current Bid' : 'Starting Price';

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        maxHeight: 480,
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid #e5e7eb',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          border: '1px solid #CE0E2D',
          '& .card-image': {
            transform: 'scale(1.05)',
          },
          '& .quick-actions': {
            opacity: 1,
          },
        },
      }}
    >
      {/* Image Section */}
      <Box
        sx={{
          position: 'relative',
          height: 200,
          backgroundColor: '#f8fafc',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          className="card-image"
          src={imageError ? 'https://via.placeholder.com/400x200/f1f5f9/64748b?text=No+Image' : primaryImage}
          alt={product.title}
          onError={handleImageError}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
          }}
        />

        {/* Status Badge */}
        <Chip
          label={getBadgeText(variant)}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            height: 28,
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: getBadgeColor(variant),
            color: 'white',
            border: 'none',
            textTransform: 'capitalize',
            zIndex: 2,
          }}
        />

        {/* Quick Actions */}
        <Box
          className="quick-actions"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            gap: 1,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {onFavorite && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setIsFavorited(!isFavorited);
                onFavorite();
              }}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': { backgroundColor: 'white' },
              }}
            >
              {isFavorited ? (
                <FavoriteIcon sx={{ color: '#CE0E2D', fontSize: 18 }} />
              ) : (
                <FavoriteOutlineIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          )}
          
          {onQuickView && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView();
              }}
              sx={{
                backgroundColor: '#CE0E2D',
                color: 'white',
                '&:hover': { backgroundColor: '#a10e24' },
              }}
            >
              <LaunchIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Content Section */}
      <CardContent sx={{ p: 2.5 }}>
        {/* Category */}
        <Typography
          variant="overline"
          sx={{
            color: '#CE0E2D',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            lineHeight: 1,
            mb: 1,
          }}
        >
          {product.category.name}
        </Typography>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '1.1rem',
            color: '#1f2937',
            lineHeight: 1.3,
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '2.6rem',
          }}
        >
          {product.title}
        </Typography>

        {/* Agent Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar
            src={product.agent.logoUrl}
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#CE0E2D',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {(product.agent.businessName || product.agent.displayName).charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: '0.875rem',
                color: '#374151',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {product.agent.businessName || product.agent.displayName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating
                value={product.agent.rating}
                readOnly
                size="small"
                precision={0.1}
                sx={{ fontSize: '0.875rem' }}
              />
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                ({product.agent.rating.toFixed(1)})
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Price and Stats */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 500,
              }}
            >
              {priceLabel}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ViewIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                {product.viewCount?.toLocaleString() || 0}
              </Typography>
            </Box>
          </Box>
          
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#CE0E2D',
              fontSize: '1.25rem',
            }}
          >
            ${displayPrice?.toLocaleString() || 'N/A'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}