'use client';

import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

import { Box, useTheme, Typography } from '@mui/material';

interface CountdownTimerProps {
  endTime?: Date;
  startTime?: Date;
  size?: 'small' | 'medium' | 'large';
  variant?: 'compact' | 'detailed';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ 
  endTime, 
  startTime, 
  size = 'medium',
  variant = 'compact' 
}: CountdownTimerProps) {
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [status, setStatus] = useState<'upcoming' | 'live' | 'ended'>('ended');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = startTime?.getTime();
      const end = endTime?.getTime();

      if (start && now < start) {
        // Auction hasn't started yet
        const difference = start - now;
        setStatus('upcoming');
        setTimeLeft(formatTime(difference));
      } else if (end && now < end) {
        // Auction is live
        const difference = end - now;
        setStatus('live');
        setTimeLeft(formatTime(difference));
      } else {
        // Auction has ended
        setStatus('ended');
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    const formatTime = (difference: number): TimeLeft => ({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime]);

  const getStatusConfig = () => {
    switch (status) {
      case 'upcoming':
        return {
          color: theme.palette.info.main,
          bgColor: `${theme.palette.info.main}15`,
          icon: 'mdi:clock-outline',
          label: 'Starts in',
        };
      case 'live':
        return {
          color: theme.palette.primary.main,
          bgColor: `${theme.palette.primary.main}15`,
          icon: 'mdi:broadcast',
          label: 'Ends in',
        };
      default:
        return {
          color: theme.palette.grey[500],
          bgColor: `${theme.palette.grey[500]}15`,
          icon: 'mdi:clock-end',
          label: 'Ended',
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'ended' && variant === 'compact') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          bgcolor: config.bgColor,
          border: `1px solid ${config.color}30`,
        }}
      >
        <Icon icon={config.icon} width={14} height={14} style={{ color: config.color }} />
        <Typography
          variant="caption"
          sx={{
            color: config.color,
            fontSize: '0.7rem',
            fontWeight: 600,
          }}
        >
          {config.label}
        </Typography>
      </Box>
    );
  }

  const fontSize = {
    small: { number: '0.7rem', label: '0.6rem' },
    medium: { number: '0.8rem', label: '0.65rem' },
    large: { number: '1rem', label: '0.75rem' },
  }[size];

  const spacing = size === 'small' ? 0.5 : size === 'medium' ? 0.75 : 1;

  if (variant === 'compact') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          bgcolor: config.bgColor,
          border: `1px solid ${config.color}30`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Icon icon={config.icon} width={16} height={16} style={{ color: config.color }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: config.color,
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          >
            {config.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing }}>
            {timeLeft.days > 0 && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: config.color,
                    fontSize: fontSize.number,
                    fontWeight: 'bold',
                  }}
                >
                  {timeLeft.days}d
                </Typography>
              </Box>
            )}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="caption"
                sx={{
                  color: config.color,
                  fontSize: fontSize.number,
                  fontWeight: 'bold',
                }}
              >
                {String(timeLeft.hours).padStart(2, '0')}h
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="caption"
                sx={{
                  color: config.color,
                  fontSize: fontSize.number,
                  fontWeight: 'bold',
                }}
              >
                {String(timeLeft.minutes).padStart(2, '0')}m
              </Typography>
            </Box>
            {status === 'live' && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: config.color,
                    fontSize: fontSize.number,
                    fontWeight: 'bold',
                    animation: status === 'live' ? 'pulse 1s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.6 },
                      '100%': { opacity: 1 },
                    },
                  }}
                >
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  // Detailed variant
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: 2,
        borderRadius: 2,
        bgcolor: config.bgColor,
        border: `1px solid ${config.color}30`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Icon icon={config.icon} width={20} height={20} style={{ color: config.color }} />
        <Typography
          variant="subtitle2"
          sx={{
            color: config.color,
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {config.label}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {timeLeft.days > 0 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{
                color: config.color,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                lineHeight: 1,
              }}
            >
              {timeLeft.days}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: config.color,
                fontSize: '0.7rem',
                opacity: 0.8,
              }}
            >
              Days
            </Typography>
          </Box>
        )}
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              color: config.color,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              lineHeight: 1,
            }}
          >
            {String(timeLeft.hours).padStart(2, '0')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: config.color,
              fontSize: '0.7rem',
              opacity: 0.8,
            }}
          >
            Hours
          </Typography>
        </Box>

        <Typography
          sx={{
            color: config.color,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            opacity: 0.5,
          }}
        >
          :
        </Typography>

        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              color: config.color,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              lineHeight: 1,
            }}
          >
            {String(timeLeft.minutes).padStart(2, '0')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: config.color,
              fontSize: '0.7rem',
              opacity: 0.8,
            }}
          >
            Minutes
          </Typography>
        </Box>

        {status === 'live' && (
          <>
            <Typography
              sx={{
                color: config.color,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                opacity: 0.5,
              }}
            >
              :
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  color: config.color,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  lineHeight: 1,
                  animation: 'pulse 1s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.6 },
                    '100%': { opacity: 1 },
                  },
                }}
              >
                {String(timeLeft.seconds).padStart(2, '0')}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: config.color,
                  fontSize: '0.7rem',
                  opacity: 0.8,
                }}
              >
                Seconds
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}