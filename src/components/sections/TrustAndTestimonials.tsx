'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Avatar,
  Rating,
  Container,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
} from '@mui/material';
import {
  FormatQuote as QuoteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Stars as StarsIcon,
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  LocalShipping as ShippingIcon,
  AccountBalance as BankIcon,
  Support as SupportIcon,
} from '@mui/icons-material';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Victoria Chen',
    role: 'Art Collector',
    location: 'New York, USA',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    comment: "Exceptional experience! I've acquired three masterpieces through this platform. The authentication process is thorough, and the service is impeccable. Every transaction felt secure and professional.",
    purchaseValue: '$2.4M',
    itemsPurchased: 12,
  },
  {
    id: 2,
    name: 'James Morrison',
    role: 'Classic Car Enthusiast',
    location: 'London, UK',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    comment: "Sold my 1967 Ferrari through this platform and couldn't be happier. The reach is global, the buyers are serious, and the process was seamless from start to finish. Highly recommended!",
    purchaseValue: '$1.8M',
    itemsPurchased: 8,
  },
  {
    id: 3,
    name: 'Sophie Laurent',
    role: 'Watch Collector', 
    location: 'Geneva, Switzerland',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    comment: "The expertise and attention to detail is remarkable. I've been collecting vintage Patek Philippe watches for 15 years, and this is by far the best platform I've used. Trust and transparency at its finest.",
    purchaseValue: '$950K',
    itemsPurchased: 15,
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Antique Dealer',
    location: 'Melbourne, Australia',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    comment: "As a professional dealer, I appreciate the platform's commitment to authenticity and fair pricing. The bidding process is transparent, and the customer support is outstanding. This is the future of luxury auctions.",
    purchaseValue: '$680K',
    itemsPurchased: 23,
  },
];

const TRUST_INDICATORS = [
  {
    icon: SecurityIcon,
    title: 'Bank-Level Security',
    description: 'SSL encryption & fraud protection',
    value: '99.9%',
    label: 'Secure transactions',
  },
  {
    icon: VerifiedIcon,
    title: 'Expert Authentication',
    description: 'Certified specialists verify every item',
    value: '100%',
    label: 'Authenticated items',
  },
  {
    icon: PeopleIcon,
    title: 'Global Community',
    description: 'Trusted by collectors worldwide',
    value: '150K+',
    label: 'Active members',
  },
  {
    icon: ShippingIcon,
    title: 'White Glove Service',
    description: 'Insured worldwide shipping',
    value: '200+',
    label: 'Countries served',
  },
  {
    icon: BankIcon,
    title: 'Financial Protection',
    description: 'Escrow & payment protection',
    value: '$2.5B+',
    label: 'Protected volume',
  },
  {
    icon: SupportIcon,
    title: '24/7 Support',
    description: 'Expert assistance anytime',
    value: '< 2min',
    label: 'Response time',
  },
];

export function TrustAndTestimonials() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay]);

  const handlePrevious = () => {
    setCurrentTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    setAutoPlay(false);
  };

  const handleNext = () => {
    setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    setAutoPlay(false);
  };

  const currentUser = TESTIMONIALS[currentTestimonial];

  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="xl">
        {/* Trust Indicators */}
        <Box sx={{ mb: { xs: 8, md: 12 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 8 } }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', md: '3rem' },
                background: 'linear-gradient(135deg, #0F1419, #2D3748)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 2,
                lineHeight: 1.2,
              }}
            >
              Trusted by Collectors Worldwide
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                maxWidth: '500px',
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Join thousands of satisfied collectors who trust us with their most valuable acquisitions
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(6, 1fr)',
              },
              gap: { xs: 2, md: 3 },
            }}
          >
            {TRUST_INDICATORS.map((indicator, index) => (
              <Fade key={indicator.title} in timeout={800 + index * 200}>
                <Card
                  sx={{
                    p: { xs: 2, md: 3 },
                    textAlign: 'center',
                    height: '100%',
                    borderRadius: '20px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
                      borderColor: '#CE0E2D',
                      '& .trust-icon': {
                        transform: 'scale(1.1)',
                        color: '#CE0E2D',
                      },
                    },
                  }}
                >
                  <Box
                    className="trust-icon"
                    sx={{
                      width: { xs: 48, md: 60 },
                      height: { xs: 48, md: 60 },
                      borderRadius: '16px',
                      bgcolor: 'rgba(206, 14, 45, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <indicator.icon sx={{ fontSize: { xs: 24, md: 30 }, color: '#CE0E2D' }} />
                  </Box>
                  
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.2rem', md: '1.5rem' },
                      color: '#CE0E2D',
                      mb: 0.5,
                      fontFamily: '"Roboto Mono", monospace',
                    }}
                  >
                    {indicator.value}
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', md: '0.8rem' },
                      color: 'text.primary',
                      mb: 1,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {indicator.label}
                  </Typography>
                  
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      color: 'text.primary',
                      mb: 1,
                      lineHeight: 1.3,
                    }}
                  >
                    {indicator.title}
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: '0.7rem', md: '0.8rem' },
                      lineHeight: 1.4,
                    }}
                  >
                    {indicator.description}
                  </Typography>
                </Card>
              </Fade>
            ))}
          </Box>
        </Box>

        {/* Testimonials Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0F1419 0%, #2D3748 100%)',
            borderRadius: '32px',
            p: { xs: 4, md: 8 },
            position: 'relative',
            overflow: 'hidden',
            color: 'white',
          }}
        >
          {/* Background Elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(206, 14, 45, 0.1) 0%, transparent 70%)',
              animation: 'float 8s ease-in-out infinite',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                '50%': { transform: 'translateY(-30px) rotate(5deg)' },
              },
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 8 } }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2rem', md: '3rem' },
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                What Our Collectors Say
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.8,
                  maxWidth: '500px',
                  mx: 'auto',
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                Real stories from our global community of passionate collectors
              </Typography>
            </Box>

            {/* Main Testimonial */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' },
                gap: { xs: 4, lg: 8 },
                alignItems: 'center',
                mb: 6,
              }}
            >
              {/* User Info */}
              <Slide direction="right" in timeout={800}>
                <Box sx={{ textAlign: { xs: 'center', lg: 'left' } }}>
                  <Avatar
                    src={currentUser.avatar}
                    sx={{
                      width: { xs: 120, md: 150 },
                      height: { xs: 120, md: 150 },
                      mx: { xs: 'auto', lg: 0 },
                      mb: 3,
                      border: '4px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {currentUser.name.charAt(0)}
                  </Avatar>
                  
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}
                  >
                    {currentUser.name}
                  </Typography>
                  
                  <Typography
                    variant="h6"
                    sx={{
                      opacity: 0.8,
                      mb: 1,
                      fontSize: { xs: '1rem', md: '1.2rem' },
                      fontWeight: 500,
                    }}
                  >
                    {currentUser.role}
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.6, mb: 3, fontSize: '0.9rem' }}
                  >
                    {currentUser.location}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: { xs: 'center', lg: 'flex-start' }, gap: 4, mb: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFD700' }}>
                        {currentUser.purchaseValue}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
                        Total Purchases
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#4CAF50' }}>
                        {currentUser.itemsPurchased}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
                        Items Acquired
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Rating
                    value={currentUser.rating}
                    readOnly
                    size="large"
                    sx={{
                      '& .MuiRating-iconFilled': { color: '#FFD700' },
                      mb: 2,
                    }}
                  />
                </Box>
              </Slide>

              {/* Testimonial Content */}
              <Slide direction="left" in timeout={800}>
                <Box sx={{ position: 'relative' }}>
                  <QuoteIcon
                    sx={{
                      fontSize: { xs: 60, md: 80 },
                      opacity: 0.1,
                      position: 'absolute',
                      top: -20,
                      left: -20,
                    }}
                  />
                  
                  <Typography
                    variant="h5"
                    sx={{
                      fontSize: { xs: '1.2rem', md: '1.8rem' },
                      lineHeight: 1.6,
                      fontStyle: 'italic',
                      fontWeight: 400,
                      position: 'relative',
                      pl: { xs: 2, md: 4 },
                    }}
                  >
                    "{currentUser.comment}"
                  </Typography>
                </Box>
              </Slide>
            </Box>

            {/* Navigation & Indicators */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 4,
                flexWrap: 'wrap',
              }}
            >
              <IconButton
                onClick={handlePrevious}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ChevronLeftIcon />
              </IconButton>

              {/* Indicators */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {TESTIMONIALS.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => {
                      setCurrentTestimonial(index);
                      setAutoPlay(false);
                    }}
                    sx={{
                      width: currentTestimonial === index ? 32 : 12,
                      height: 6,
                      borderRadius: '3px',
                      bgcolor: currentTestimonial === index 
                        ? 'white' 
                        : 'rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: currentTestimonial === index 
                          ? 'white' 
                          : 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  />
                ))}
              </Box>

              <IconButton
                onClick={handleNext}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}