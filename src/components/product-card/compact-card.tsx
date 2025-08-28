'use client';

import type { FC } from 'react';

import { styled } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  CardMedia,
  Typography,
  IconButton,
  CardContent,
} from '@mui/material';
import {
  AccessTime as NewIcon,
  Visibility as ViewIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: theme.shadows[1],
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-4px)',
    '& .product-image': {
      transform: 'scale(1.05)',
    },
    '& .arrow-icon': {
      transform: 'translateX(4px)',
    },
  },
}));

const NewBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: '#4CAF50',
  color: 'white',
  fontSize: '0.7rem',
  height: 24,
  borderRadius: 12,
  fontWeight: 600,
  zIndex: 3,
  '& .MuiChip-icon': {
    color: 'white',
    fontSize: 12,
  },
}));

const PriceContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.02)' 
    : 'rgba(0, 0, 0, 0.01)',
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const ViewAction = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  padding: 6,
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

export interface CompactCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  estimatedValue: number;
  viewCount: number;
  isNew?: boolean;
  currency?: string;
  onClick?: () => void;
}

export const CompactCard: FC<CompactCardProps> = ({
  id,
  title,
  category,
  image,
  estimatedValue,
  viewCount,
  isNew = false,
  currency = 'USD',
  onClick,
}) => {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M ${currency}`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K ${currency}`;
    }
    return `${price} ${currency}`;
  };

  return (
    <StyledCard onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
      {isNew && (
        <NewBadge
          icon={<NewIcon />}
          label="New"
          size="small"
        />
      )}
      
      <CardMedia
        component="img"
        height="160"
        image={image}
        alt={title}
        className="product-image"
        sx={{
          objectFit: 'cover',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '0.95rem',
            color: 'text.primary',
            mb: 1,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '2.5em',
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {category}
        </Typography>
      </CardContent>

      <PriceContainer>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Est. Value
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: '0.9rem',
            }}
          >
            {formatPrice(estimatedValue)}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ViewIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {viewCount}
            </Typography>
          </Box>
          <ViewAction size="small">
            <ArrowIcon className="arrow-icon" sx={{ fontSize: 16 }} />
          </ViewAction>
        </Box>
      </PriceContainer>
    </StyledCard>
  );
};