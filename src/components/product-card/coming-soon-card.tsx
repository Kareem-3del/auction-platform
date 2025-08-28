'use client';

import type { FC } from 'react';

import { useState, useEffect } from 'react';

import { styled } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Button,
  CardMedia,
  Typography,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Star as StarIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  NotificationsActive as NotifyIcon,
} from '@mui/icons-material';


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
  border: `2px solid transparent`,
  background: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box,
              linear-gradient(135deg, #CE0E2D, #FF4444) border-box`,
  '&:hover': {
    boxShadow: theme.shadows[16],
    transform: 'translateY(-6px)',
    '& .product-image': {
      transform: 'scale(1.08)',
    },
    '& .coming-soon-badge': {
      transform: 'scale(1.05)',
    },
  },
}));

const ComingSoonBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  left: 16,
  background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
  borderRadius: '25px',
  padding: '8px 16px',
  color: 'white',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  zIndex: 3,
  boxShadow: '0 4px 12px rgba(206, 14, 45, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'transform 0.3s ease',
}));

const ImageOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(45deg, rgba(206, 14, 45, 0.1), rgba(255, 68, 68, 0.1))',
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  '&:hover': {
    opacity: 1,
  },
}));

const CountdownContainer = styled(Box)(({ theme }) => ({
  padding: '16px',
  background: `linear-gradient(135deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.08)' : 'rgba(206, 14, 45, 0.04)'}, 
    ${theme.palette.mode === 'dark' ? 'rgba(255, 68, 68, 0.08)' : 'rgba(255, 68, 68, 0.04)'})`,
  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.2)' : 'rgba(206, 14, 45, 0.15)'}`,
}));

const TimeContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px',
  mb: 2,
}));

const TimeUnit = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: '12px 8px',
  borderRadius: '12px',
  background: `linear-gradient(135deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}, 
    ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'})`,
  border: `1px solid ${theme.palette.divider}`,
  minWidth: '45px',
}));

const TimeNumber = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 800,
  color: '#CE0E2D',
  lineHeight: 1,
  fontFamily: '"Roboto Mono", monospace',
}));

const TimeLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.65rem',
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  marginTop: '4px',
  fontWeight: 500,
}));

const EstimatedValueBar = styled(Box)(({ theme }) => ({
  marginTop: '12px',
}));

const NotifyButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#CE0E2D',
  color: 'white',
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.8rem',
  padding: '8px 20px',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: '#B00C24',
    boxShadow: 'none',
  },
}));

export interface ComingSoonCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  startTime: string | Date;
  estimatedValueMin: number;
  estimatedValueMax: number;
  interestCount?: number;
  currency?: string;
  onClick?: () => void;
  onNotify?: () => void;
}

export const ComingSoonCard: FC<ComingSoonCardProps> = ({
  id,
  title,
  category,
  image,
  startTime,
  estimatedValueMin,
  estimatedValueMax,
  interestCount = 0,
  currency = 'USD',
  onClick,
  onNotify,
}) => {
  const [timeToStart, setTimeToStart] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const calculateTimeToStart = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const difference = start - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeToStart({ days, hours, minutes, seconds });
        setIsStarted(false);
      } else {
        setTimeToStart({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsStarted(true);
      }
    };

    calculateTimeToStart();
    const timer = setInterval(calculateTimeToStart, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const getInterestLevel = () => {
    if (interestCount > 50) return { level: 'High', color: '#4CAF50', value: 85 };
    if (interestCount > 20) return { level: 'Medium', color: '#FF9800', value: 60 };
    return { level: 'Growing', color: '#1976D2', value: 35 };
  };

  const interest = getInterestLevel();

  return (
    <StyledCard onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
      <ComingSoonBadge className="coming-soon-badge">
        <ScheduleIcon sx={{ fontSize: 16 }} />
        {isStarted ? 'Live Now!' : 'Coming Soon'}
      </ComingSoonBadge>
      
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="220"
          image={image}
          alt={title}
          className="product-image"
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <ImageOverlay>
          <Chip
            icon={<StarIcon sx={{ fontSize: 16 }} />}
            label="Preview Available"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: '#CE0E2D',
              fontWeight: 600,
            }}
          />
        </ImageOverlay>
      </Box>

      {!isStarted && (
        <CountdownContainer>
          <Typography
            variant="subtitle2"
            sx={{ textAlign: 'center', mb: 2, color: '#CE0E2D', fontWeight: 600 }}
          >
            Starts in:
          </Typography>
          <TimeContainer>
            <TimeUnit>
              <TimeNumber>{timeToStart.days}</TimeNumber>
              <TimeLabel>Days</TimeLabel>
            </TimeUnit>
            <Box sx={{ color: '#CE0E2D', fontSize: '1.2rem', fontWeight: 600 }}>:</Box>
            <TimeUnit>
              <TimeNumber>{timeToStart.hours.toString().padStart(2, '0')}</TimeNumber>
              <TimeLabel>Hours</TimeLabel>
            </TimeUnit>
            <Box sx={{ color: '#CE0E2D', fontSize: '1.2rem', fontWeight: 600 }}>:</Box>
            <TimeUnit>
              <TimeNumber>{timeToStart.minutes.toString().padStart(2, '0')}</TimeNumber>
              <TimeLabel>Min</TimeLabel>
            </TimeUnit>
          </TimeContainer>
        </CountdownContainer>
      )}

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

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
            Start Price
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#CE0E2D',
              fontSize: '1rem',
              mb: 1,
            }}
          >
            {formatPrice(estimatedValueMin)}
          </Typography>
          
          <EstimatedValueBar>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Interest Level: {interest.level}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingIcon sx={{ fontSize: 14, color: interest.color }} />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: interest.color }}>
                  {interestCount} interested
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={interest.value}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(206, 14, 45, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: interest.color,
                  borderRadius: 3,
                },
              }}
            />
          </EstimatedValueBar>
        </Box>

        {!isStarted && (
          <NotifyButton
            fullWidth
            startIcon={<NotifyIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onNotify?.();
            }}
          >
            Notify Me When Live
          </NotifyButton>
        )}
      </CardContent>
    </StyledCard>
  );
};