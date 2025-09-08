'use client';

import type { FC } from 'react';

import { useState, useEffect } from 'react';

import { styled } from '@mui/material/styles';
import { Search as SearchIcon } from '@mui/icons-material';
import { Box, Card, Chip, Typography, IconButton, CardContent } from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { useLocale } from 'src/hooks/useLocale';

// ----------------------------------------------------------------------

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 20,
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: theme.shadows[12],
    transform: 'translateY(-4px)',
    '& .product-image': {
      transform: 'scale(1.05)',
    },
    '& .search-button': {
      opacity: 1,
      transform: 'scale(1)',
    },
  },
  '&:active': {
    transform: 'translateY(-2px)',
  },
}));

const ProductImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 240,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    background: `linear-gradient(transparent, ${theme.palette.mode === 'dark' 
      ? 'rgba(0, 0, 0, 0.2)' 
      : 'rgba(255, 255, 255, 0.8)'})`,
    pointerEvents: 'none',
  },
}));

const ProductImage = styled('img')(({ theme }) => ({
  width: '80%',
  height: '80%',
  maxWidth: '200px',
  maxHeight: '180px',
  objectFit: 'contain',
  filter: theme.palette.mode === 'dark' 
    ? 'drop-shadow(0 4px 20px rgba(255, 255, 255, 0.1))' 
    : 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.08))',
  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 1,
}));

const SearchIconButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  left: 16,
  width: 44,
  height: 44,
  backgroundColor: theme.palette.background.paper,
  backdropFilter: 'blur(20px)',
  boxShadow: theme.shadows[3],
  color: theme.palette.text.primary,
  opacity: 0,
  transform: 'scale(0.8)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 2,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    boxShadow: theme.shadows[6],
    transform: 'scale(1.1)',
  },
}));

const FloatingChip = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontSize: '0.75rem',
  height: 28,
  borderRadius: 14,
  fontWeight: 600,
  boxShadow: theme.shadows[4],
  zIndex: 3,
  backdropFilter: 'blur(10px)',
  '& .MuiChip-icon': {
    color: theme.palette.primary.contrastText,
    fontSize: 14,
    marginLeft: '4px',
  },
  '& .MuiChip-label': {
    paddingLeft: '8px',
    paddingRight: '8px',
    fontSize: '0.7rem',
    fontWeight: 700,
  },
}));

const CountdownContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '20px',
  padding: '20px 16px',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.02)' 
    : 'rgba(0, 0, 0, 0.01)',
  borderTop: `1px solid ${theme.palette.divider}`,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const CountdownItem = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  minWidth: '48px',
  padding: '8px 4px',
  borderRadius: '8px',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.05)' 
    : 'rgba(0, 0, 0, 0.02)',
  border: `1px solid ${theme.palette.divider}`,
}));

const CountdownNumber = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 800,
  color: theme.palette.primary.main,
  lineHeight: 1,
  fontFamily: '"Roboto Mono", monospace',
}));

const CountdownLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  textTransform: 'capitalize',
  marginTop: '4px',
}));

// ----------------------------------------------------------------------

export interface ProductAuctionCardProps {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  auctionType: 'sealed' | 'live' | 'buy-now';
  endTime?: string | Date;
  currentBid?: number;
  buyNowPrice?: number;
  bidsCount?: number;
  onClick?: () => void;
}

export const ProductAuctionCard: FC<ProductAuctionCardProps> = ({
  id,
  title,
  subtitle,
  image,
  auctionType,
  endTime,
  currentBid,
  buyNowPrice,
  bidsCount,
  onClick,
}) => {
  const { t } = useLocale();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

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
  }, [endTime]);

  const getAuctionChipProps = () => {
    switch (auctionType) {
      case 'sealed':
        return { label: t('auction.types.sealed'), icon: <Iconify icon="mdi:gavel" /> };
      case 'live':
        return { label: t('auction.types.live'), icon: <Iconify icon="mdi:broadcast" /> };
      case 'buy-now':
        return { label: t('auction.types.buyNow'), icon: <Iconify icon="mdi:lightning-bolt" /> };
      default:
        return { label: t('auction.auction'), icon: <Iconify icon="mdi:gavel" /> };
    }
  };

  return (
    <StyledCard onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
      <FloatingChip {...getAuctionChipProps()} />
      
      <ProductImageContainer>
        <ProductImage 
          className="product-image"
          src={image} 
          alt={title}
          loading="lazy"
        />
        <SearchIconButton 
          className="search-button"
          size="small"
          aria-label="View product details"
        >
          <SearchIcon fontSize="small" />
        </SearchIconButton>
      </ProductImageContainer>

      {endTime && (
        <CountdownContainer>
          <CountdownItem>
            <CountdownNumber>{timeLeft.days.toString().padStart(2, '0')}</CountdownNumber>
            <CountdownLabel>{t('common.time.days')}</CountdownLabel>
          </CountdownItem>
          <Box sx={{ color: 'text.disabled', fontSize: '1.5rem', fontWeight: 300 }}>:</Box>
          <CountdownItem>
            <CountdownNumber>{timeLeft.hours.toString().padStart(2, '0')}</CountdownNumber>
            <CountdownLabel>{t('common.time.hours')}</CountdownLabel>
          </CountdownItem>
          <Box sx={{ color: 'text.disabled', fontSize: '1.5rem', fontWeight: 300 }}>:</Box>
          <CountdownItem>
            <CountdownNumber>{timeLeft.minutes.toString().padStart(2, '0')}</CountdownNumber>
            <CountdownLabel>{t('common.time.minutes')}</CountdownLabel>
          </CountdownItem>
          <Box sx={{ color: 'text.disabled', fontSize: '1.5rem', fontWeight: 300 }}>:</Box>
          <CountdownItem>
            <CountdownNumber>{timeLeft.seconds.toString().padStart(2, '0')}</CountdownNumber>
            <CountdownLabel>{t('common.time.seconds')}</CountdownLabel>
          </CountdownItem>
        </CountdownContainer>
      )}

      <CardContent 
        sx={{ 
          p: 3, 
          textAlign: 'center', 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: 120,
          '&:last-child': { pb: 3 } 
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            fontSize: '1.1rem',
            color: 'text.primary',
            mb: 1.5,
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
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: 0.8
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </StyledCard>
  );
};