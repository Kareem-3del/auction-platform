'use client';

import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

import { Box, useTheme, Typography, Card, Chip, keyframes } from '@mui/material';

interface CountdownTimerProps {
  endTime?: Date;
  startTime?: Date;
  size?: 'small' | 'medium' | 'large';
  variant?: 'compact' | 'detailed' | 'modern';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Define keyframes for animations
const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px rgba(206, 14, 45, 0.3); }
  50% { box-shadow: 0 0 20px rgba(206, 14, 45, 0.6); }
  100% { box-shadow: 0 0 5px rgba(206, 14, 45, 0.3); }
`;

const slideIn = keyframes`
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

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
          color: '#3b82f6',
          bgColor: 'linear-gradient(135deg, #3b82f620 0%, #1e40af10 100%)',
          borderColor: '#3b82f6',
          icon: 'mdi:clock-outline',
          label: 'Starts in',
          chipColor: '#3b82f6',
        };
      case 'live':
        return {
          color: '#CE0E2D',
          bgColor: 'linear-gradient(135deg, #CE0E2D20 0%, #dc262610 100%)',
          borderColor: '#CE0E2D',
          icon: 'mdi:broadcast',
          label: 'Ends in',
          chipColor: '#CE0E2D',
        };
      default:
        return {
          color: theme.palette.grey[500],
          bgColor: `linear-gradient(135deg, ${theme.palette.grey[500]}20 0%, ${theme.palette.grey[500]}10 100%)`,
          borderColor: theme.palette.grey[500],
          icon: 'mdi:clock-end',
          label: 'Ended',
          chipColor: theme.palette.grey[500],
        };
    }
  };

  const config = getStatusConfig();

  // Modern variant with formal, professional design
  if (variant === 'modern') {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '2px solid',
          borderColor: config.borderColor,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Time Display Grid */}
        <Box
          display="grid"
          gridTemplateColumns={timeLeft.days > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'}
          sx={{
            borderBottom: '2px solid',
            borderColor: 'divider',
          }}
        >
          {/* Days */}
          {timeLeft.days > 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 2,
                px: 2.5,
                borderRight: '2px solid',
                borderColor: 'divider',
                bgcolor: 'grey.50',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  color: config.color,
                  fontWeight: 700,
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  mb: 0.5,
                  letterSpacing: '-0.02em',
                }}
              >
                {timeLeft.days}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Days
              </Typography>
            </Box>
          )}

          {/* Hours */}
          <Box
            sx={{
              textAlign: 'center',
              py: 2,
              px: 2.5,
              borderRight: '2px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: config.color,
                fontWeight: 700,
                fontSize: '2.5rem',
                lineHeight: 1,
                mb: 0.5,
                letterSpacing: '-0.02em',
              }}
            >
              {String(timeLeft.hours).padStart(2, '0')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Hours
            </Typography>
          </Box>

          {/* Minutes */}
          <Box
            sx={{
              textAlign: 'center',
              py: 2,
              px: 2.5,
              bgcolor: 'grey.50',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: config.color,
                fontWeight: 700,
                fontSize: '2.5rem',
                lineHeight: 1,
                mb: 0.5,
                letterSpacing: '-0.02em',
              }}
            >
              {String(timeLeft.minutes).padStart(2, '0')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Minutes
            </Typography>
          </Box>
        </Box>

        {/* Status Bar */}
        <Box
          sx={{
            py: 1,
            px: 2,
            bgcolor: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <Icon icon={config.icon} width={16} height={16} style={{ color: 'white' }} />
          <Typography
            variant="caption"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            {status === 'upcoming' ? 'Auction Starts In' : 'Auction Ends In'}
          </Typography>
        </Box>
      </Box>
    );
  }

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
          background: config.bgColor,
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

  // Enhanced detailed variant
  return (
    <Card
      sx={{
        background: config.bgColor,
        border: `2px solid ${config.borderColor}30`,
        borderRadius: 3,
        p: 3,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${config.color} 0%, ${config.color}80 100%)`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
        <Icon icon={config.icon} width={24} height={24} style={{ color: config.color }} />
        <Typography
          variant="h6"
          sx={{
            color: config.color,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          {config.label}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {timeLeft.days > 0 && (
          <>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  color: config.color,
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                {timeLeft.days}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: config.color,
                  fontSize: '0.75rem',
                  opacity: 0.8,
                  fontWeight: 600,
                }}
              >
                Days
              </Typography>
            </Box>
            <Typography
              sx={{
                color: config.color,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                opacity: 0.5,
              }}
            >
              :
            </Typography>
          </>
        )}
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              color: config.color,
              fontSize: '2rem',
              fontWeight: 'bold',
              lineHeight: 1,
              mb: 0.5,
            }}
          >
            {String(timeLeft.hours).padStart(2, '0')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: config.color,
              fontSize: '0.75rem',
              opacity: 0.8,
              fontWeight: 600,
            }}
          >
            Hours
          </Typography>
        </Box>

        <Typography
          sx={{
            color: config.color,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            opacity: 0.5,
          }}
        >
          :
        </Typography>

        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              color: config.color,
              fontSize: '2rem',
              fontWeight: 'bold',
              lineHeight: 1,
              mb: 0.5,
            }}
          >
            {String(timeLeft.minutes).padStart(2, '0')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: config.color,
              fontSize: '0.75rem',
              opacity: 0.8,
              fontWeight: 600,
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
                fontSize: '1.5rem',
                fontWeight: 'bold',
                opacity: 0.5,
              }}
            >
              :
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  color: config.color,
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  lineHeight: 1,
                  mb: 0.5,
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
                  fontSize: '0.75rem',
                  opacity: 0.8,
                  fontWeight: 600,
                }}
              >
                Seconds
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Card>
  );
}