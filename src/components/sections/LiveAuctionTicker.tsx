'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  TrendingUp as TrendingIcon,
  AccessTime as TimeIcon,
  LocalOffer as BidIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

// Mock live auction data
const LIVE_AUCTIONS = [
  {
    id: 1,
    title: "1955 Mercedes-Benz 300SL Gullwing",
    category: "Classic Cars",
    currentBid: 1850000,
    lastBidder: "Collector_92",
    timeLeft: "2h 45m",
    participants: 23,
    image: "/api/placeholder/120/80",
    isHot: true,
  },
  {
    id: 2,
    title: "Vintage Patek Philippe Nautilus",
    category: "Luxury Watches",
    currentBid: 420000,
    lastBidder: "TimeKeeper",
    timeLeft: "1h 22m",
    participants: 45,
    image: "/api/placeholder/120/80",
    isHot: true,
  },
  {
    id: 3,
    title: "Monet Water Lilies Original",
    category: "Fine Art",
    currentBid: 3200000,
    lastBidder: "ArtLover_99",
    timeLeft: "4h 18m",
    participants: 67,
    image: "/api/placeholder/120/80",
    isHot: false,
  },
  {
    id: 4,
    title: "1960 Ferrari 250 GT SWB",
    category: "Classic Cars", 
    currentBid: 8750000,
    lastBidder: "SpeedDemon",
    timeLeft: "6h 12m",
    participants: 89,
    image: "/api/placeholder/120/80",
    isHot: true,
  },
  {
    id: 5,
    title: "Hermès Birkin Himalaya Crocodile",
    category: "Luxury Goods",
    currentBid: 185000,
    lastBidder: "LuxuryQueen",
    timeLeft: "3h 8m",
    participants: 34,
    image: "/api/placeholder/120/80",
    isHot: false,
  },
];

export function LiveAuctionTicker() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll effect
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % LIVE_AUCTIONS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleAuctionClick = (auctionId: number) => {
    router.push(`/auctions/${auctionId}`);
  };

  return (
    <Box
      sx={{
        py: 2,
        background: 'linear-gradient(135deg, #0F1419 0%, #1A1A1A 50%, #0F1419 100%)',
        borderTop: '1px solid rgba(206, 14, 45, 0.2)',
        borderBottom: '1px solid rgba(206, 14, 45, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-50%',
          width: '200%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #CE0E2D, transparent)',
          animation: 'shimmer 3s ease-in-out infinite',
        },
        '@keyframes shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Live Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.2), rgba(255, 68, 68, 0.2))',
                border: '1px solid rgba(206, 14, 45, 0.3)',
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#4CAF50',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Live Auctions
              </Typography>
            </Box>

            <IconButton
              size="small"
              onClick={() => setIsPaused(!isPaused)}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: 'white' },
              }}
            >
              {isPaused ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
          </Box>

          {/* Scrolling Content */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
              height: '60px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 4,
                animation: isPaused ? 'none' : 'scroll 60s linear infinite',
                '@keyframes scroll': {
                  '0%': { transform: 'translateX(100%)' },
                  '100%': { transform: 'translateX(-100%)' },
                },
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {[...LIVE_AUCTIONS, ...LIVE_AUCTIONS].map((auction, index) => (
                <Box
                  key={`${auction.id}-${index}`}
                  onClick={() => handleAuctionClick(auction.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    minWidth: '450px',
                    px: 4,
                    py: 2,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                    },
                  }}
                >
                  {/* Hot Badge */}
                  {auction.isHot && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: 12,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 12px rgba(206, 14, 45, 0.4)',
                      }}
                    >
                      HOT
                    </Box>
                  )}

                  {/* Auction Image */}
                  <Box
                    sx={{
                      width: 60,
                      height: 45,
                      borderRadius: '12px',
                      backgroundImage: `url(${auction.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />

                  {/* Auction Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        mb: 0.5,
                      }}
                    >
                      {auction.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Chip
                        size="small"
                        label={auction.category}
                        sx={{
                          height: '18px',
                          fontSize: '0.65rem',
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }} />
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}
                        >
                          {auction.participants}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Price & Time */}
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#FFD700',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        fontFamily: '"Roboto Mono", monospace',
                        mb: 0.5,
                      }}
                    >
                      ${auction.currentBid.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimeIcon sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }} />
                      <Typography
                        variant="caption"
                        sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}
                      >
                        {auction.timeLeft}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Trending Icon */}
                  <TrendingIcon
                    sx={{
                      fontSize: 20,
                      color: auction.isHot ? '#CE0E2D' : 'rgba(255, 255, 255, 0.4)',
                      flexShrink: 0,
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* View All Button */}
          <Box sx={{ flexShrink: 0 }}>
            <Typography
              variant="body2"
              onClick={() => router.push('/auctions?status=live')}
              sx={{
                color: '#CE0E2D',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#FF4444',
                  textDecorationColor: '#FF4444',
                },
              }}
            >
              View All
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}