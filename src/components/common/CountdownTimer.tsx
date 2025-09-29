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

  // Modern variant with enhanced design
  if (variant === 'modern') {
    return (
      <Card
        sx={{
          background: config.bgColor,
          border: `2px solid ${config.borderColor}30`,
          borderRadius: 4,
          p: 4,
          position: 'relative',
          overflow: 'hidden',
          animation: status === 'live' ? `${glowAnimation} 2s infinite` : 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${config.color} 0%, ${config.color}80 100%)`,
          },
        }}
      >
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
          <Chip
            icon={<Icon icon={config.icon} width={18} height={18} />}
            label={status.toUpperCase() + ' AUCTION'}
            sx={{
              bgcolor: config.color,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9rem',
              px: 2,
              py: 1,
              height: 'auto',
              '& .MuiChip-icon': {
                color: 'white',
                ml: 1,
              },
            }}
          />
        </Box>

        {/* Status Label */}
        <Typography
          variant="h6"
          textAlign="center"
          mb={3}
          sx={{
            color: config.color,
            fontWeight: 600,
            fontSize: '1.1rem',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          {config.label}
        </Typography>

        {/* Time Display */}
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={3}
          sx={{
            animation: `${slideIn} 0.5s ease-out`,
          }}
        >
          {/* Days */}
          {timeLeft.days > 0 && (
            <>
              <Box textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}25 100%)`,
                    border: `3px solid ${config.color}40`,
                    mb: 1,
                    position: 'relative',
                    animation: status === 'live' ? `${pulseAnimation} 2s infinite` : 'none',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -3,
                      left: -3,
                      right: -3,
                      bottom: -3,
                      borderRadius: 3,
                      background: `linear-gradient(45deg, ${config.color}40, transparent, ${config.color}40)`,
                      animation: 'rotate 3s linear infinite',
                      zIndex: -1,
                      '@keyframes rotate': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    },
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      color: config.color,
                      fontWeight: 'bold',
                      fontSize: '2rem',
                      lineHeight: 1,
                    }}
                  >
                    {timeLeft.days}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: config.color,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Days
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: config.color,
                  fontSize: '2rem',
                  fontWeight: 300,
                  opacity: 0.6,
                }}
              >
                :
              </Typography>
            </>
          )}

          {/* Hours */}
          <Box textAlign="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}25 100%)`,
                border: `3px solid ${config.color}40`,
                mb: 1,
                animation: status === 'live' ? `${pulseAnimation} 2s infinite 0.2s` : 'none',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  color: config.color,
                  fontWeight: 'bold',
                  fontSize: '2rem',
                  lineHeight: 1,
                }}
              >
                {String(timeLeft.hours).padStart(2, '0')}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: config.color,
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Hours
            </Typography>
          </Box>

          <Typography
            sx={{
              color: config.color,
              fontSize: '2rem',
              fontWeight: 300,
              opacity: 0.6,
            }}
          >
            :
          </Typography>

          {/* Minutes */}
          <Box textAlign="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}25 100%)`,
                border: `3px solid ${config.color}40`,
                mb: 1,
                animation: status === 'live' ? `${pulseAnimation} 2s infinite 0.4s` : 'none',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  color: config.color,
                  fontWeight: 'bold',
                  fontSize: '2rem',
                  lineHeight: 1,
                }}
              >
                {String(timeLeft.minutes).padStart(2, '0')}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: config.color,
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Minutes
            </Typography>
          </Box>

          {/* Seconds - only show for live auctions */}
          {status === 'live' && (
            <>
              <Typography
                sx={{
                  color: config.color,
                  fontSize: '2rem',
                  fontWeight: 300,
                  opacity: 0.6,
                }}
              >
                :
              </Typography>
              <Box textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${config.color}25 0%, ${config.color}35 100%)`,
                    border: `3px solid ${config.color}60`,
                    mb: 1,
                    animation: `${pulseAnimation} 1s infinite`,
                    boxShadow: `0 0 20px ${config.color}40`,
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '2rem',
                      lineHeight: 1,
                      textShadow: `0 0 10px ${config.color}`,
                    }}
                  >
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: config.color,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Seconds
                </Typography>
              </Box>
            </>
          )}
        </Box>

        {/* Live indicator for ongoing auctions */}
        {status === 'live' && (
          <Box
            display="flex"
            justifyContent="center"
            mt={3}
          >
            <Chip
              label="LIVE NOW"
              sx={{
                bgcolor: '#ef4444',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.8rem',
                animation: `${pulseAnimation} 1.5s infinite`,
                '&::before': {
                  content: '"🔴"',
                  mr: 0.5,
                },
              }}
            />
          </Box>
        )}
      </Card>
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