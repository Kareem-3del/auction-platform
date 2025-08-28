'use client';

import type { FC } from 'react';

import { useState, useEffect } from 'react';

import { styled } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  CardMedia,
  Typography,
  CardContent,
} from '@mui/material';
import {
  LocalOffer as BidIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';


const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: theme.shadows[3],
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  position: 'relative',
  border: `2px solid transparent`,
  background: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box,
              linear-gradient(135deg, #CE0E2D, #FF6B6B) border-box`,
  '&:hover': {
    boxShadow: theme.shadows[20],
    transform: 'translateY(-8px) scale(1.02)',
    '& .product-image': {
      transform: 'scale(1.1)',
    },
    '& .urgent-pulse': {
      animationDuration: '0.8s',
    },
  },
}));

const UrgentBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 12,
  right: 12,
  background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
  borderRadius: '20px',
  padding: '6px 12px',
  color: 'white',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  zIndex: 3,
  boxShadow: '0 4px 12px rgba(206, 14, 45, 0.4)',
  animation: 'urgentPulse 1.5s infinite',
  '@keyframes urgentPulse': {
    '0%': { transform: 'scale(1)', boxShadow: '0 4px 12px rgba(206, 14, 45, 0.4)' },
    '50%': { transform: 'scale(1.05)', boxShadow: '0 6px 20px rgba(206, 14, 45, 0.6)' },
    '100%': { transform: 'scale(1)', boxShadow: '0 4px 12px rgba(206, 14, 45, 0.4)' },
  },
}));

const CountdownContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '12px',
  background: `linear-gradient(135deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.1)' : 'rgba(206, 14, 45, 0.05)'}, 
    ${theme.palette.mode === 'dark' ? 'rgba(255, 75, 75, 0.1)' : 'rgba(255, 75, 75, 0.05)'})`,
  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.3)' : 'rgba(206, 14, 45, 0.2)'}`,
}));

const CountdownItem = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  minWidth: '40px',
  padding: '8px 4px',
  borderRadius: '8px',
  background: `linear-gradient(135deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}, 
    ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'})`,
  border: `1px solid ${theme.palette.divider}`,
}));

const CountdownNumber = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  fontWeight: 800,
  color: '#CE0E2D',
  lineHeight: 1,
  fontFamily: '"Roboto Mono", monospace',
}));

const CountdownLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.65rem',
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  marginTop: '2px',
  fontWeight: 500,
}));

const StatsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 16px',
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

export interface EndingSoonCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  endTime: string | Date;
  currentBid: number;
  bidCount: number;
  viewCount: number;
  currency?: string;
  onClick?: () => void;
}

export const EndingSoonCard: FC<EndingSoonCardProps> = ({
  id,
  title,
  category,
  image,
  endTime,
  currentBid,
  bidCount,
  viewCount,
  currency = 'USD',
  onClick,
}) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
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
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 2;

  return (
    <StyledCard onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
      <UrgentBadge className={isUrgent ? 'urgent-pulse' : ''}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TimeIcon sx={{ fontSize: 14 }} />
          {isExpired ? 'Ended' : isUrgent ? 'Last Call!' : 'Ending Soon'}
        </Box>
      </UrgentBadge>
      
      <CardMedia
        component="img"
        height="200"
        image={image}
        alt={title}
        className="product-image"
        sx={{
          objectFit: 'cover',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {!isExpired && (
        <CountdownContainer>
          <CountdownItem>
            <CountdownNumber>{timeLeft.days}</CountdownNumber>
            <CountdownLabel>Days</CountdownLabel>
          </CountdownItem>
          <Box sx={{ color: '#CE0E2D', fontSize: '1.2rem', fontWeight: 600 }}>:</Box>
          <CountdownItem>
            <CountdownNumber>{timeLeft.hours.toString().padStart(2, '0')}</CountdownNumber>
            <CountdownLabel>Hours</CountdownLabel>
          </CountdownItem>
          <Box sx={{ color: '#CE0E2D', fontSize: '1.2rem', fontWeight: 600 }}>:</Box>
          <CountdownItem>
            <CountdownNumber>{timeLeft.minutes.toString().padStart(2, '0')}</CountdownNumber>
            <CountdownLabel>Min</CountdownLabel>
          </CountdownItem>
          <Box sx={{ color: '#CE0E2D', fontSize: '1.2rem', fontWeight: 600 }}>:</Box>
          <CountdownItem>
            <CountdownNumber>{timeLeft.seconds.toString().padStart(2, '0')}</CountdownNumber>
            <CountdownLabel>Sec</CountdownLabel>
          </CountdownItem>
        </CountdownContainer>
      )}

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
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
            mb: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {category}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Current Bid
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: '#CE0E2D',
                fontSize: '1.1rem',
              }}
            >
              {formatPrice(currentBid)}
            </Typography>
          </Box>
          
          <Chip
            icon={<BidIcon sx={{ fontSize: 16 }} />}
            label={`${bidCount} bid${bidCount !== 1 ? 's' : ''}`}
            size="small"
            sx={{
              bgcolor: 'rgba(206, 14, 45, 0.1)',
              color: '#CE0E2D',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        </Box>
      </CardContent>

      <StatsContainer>
        <StatItem>
          <ViewIcon sx={{ fontSize: 16 }} />
          {viewCount} views
        </StatItem>
      </StatsContainer>
    </StyledCard>
  );
};