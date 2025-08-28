'use client';

import { gsap } from 'gsap';
import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Grid,
  Paper,
  Button,
  Container,
  Typography,
} from '@mui/material';

import { ErrorBoundary } from 'src/components/ErrorBoundary';
import { FooterCTA } from 'src/components/sections/FooterCTA';
import { HeroBanner } from 'src/components/sections/HeroBanner';
import HomepageLayout from 'src/components/layout/HomepageLayout';
import { FeaturedSection } from 'src/components/sections/FeaturedSection';
import { TrendingSection } from 'src/components/sections/TrendingSection';
import { EndingSoonSection } from 'src/components/sections/EndingSoonSection';
import { ComingSoonSection } from 'src/components/sections/ComingSoonSection';
import { RecentAdditionsSection } from 'src/components/sections/RecentAdditionsSection';


export default function HomePage() {
  const router = useRouter();
  const featuresRef = useRef<HTMLDivElement>(null);

  // Simplified without API calls to prevent memory leaks
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Simple fade-in animation without complex triggers
    if (featuresRef.current) {
      gsap.fromTo(featuresRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 1, delay: 0.3 }
      );
    }
  }, []);



  return (
    <ErrorBoundary>
      <HomepageLayout>
        {/* Hero Banner */}
        <ErrorBoundary>
          <HeroBanner />
        </ErrorBoundary>

        {/* Ending Soon Section */}
        <ErrorBoundary>
          <EndingSoonSection limit={8} />
        </ErrorBoundary>

        {/* Coming Soon Section */}
        <ErrorBoundary>
          <ComingSoonSection limit={6} />
        </ErrorBoundary>

        {/* Featured Categories Section */}
        <ErrorBoundary>
          <FeaturedSection />
        </ErrorBoundary>

        {/* Trending Section */}
        <ErrorBoundary>
          <TrendingSection section="trending" limit={6} />
        </ErrorBoundary>

        {/* Featured Collection Section */}
        <ErrorBoundary>
          <TrendingSection section="featured" limit={6} />
        </ErrorBoundary>

        {/* Recent Additions Section */}
        <ErrorBoundary>
          <RecentAdditionsSection limit={8} />
        </ErrorBoundary>

        <Container maxWidth={false} sx={{ maxWidth: '1536px', px: 3 }}>
          {/* Call to Action */}
          <Box sx={{ 
            py: { xs: 6, md: 10 }, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.05), rgba(25, 118, 210, 0.05))',
            borderRadius: 4,
            my: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #CE0E2D, #1976D2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Ready to Start Bidding?
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}>
              Join thousands of collectors and discover unique items from verified sellers across the region
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => router.push('/products')}
                sx={{ 
                  px: 6, 
                  py: 2,
                  background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
                  fontWeight: 600,
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(206, 14, 45, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #b00c26, #e63939)',
                    boxShadow: '0 6px 20px rgba(206, 14, 45, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Browse All Products
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={() => router.push('/auctions')}
                sx={{ 
                  px: 6, 
                  py: 2,
                  borderColor: '#1976D2',
                  color: '#1976D2',
                  fontWeight: 600,
                  borderRadius: 3,
                  '&:hover': {
                    borderColor: '#1976D2',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                View Live Auctions
              </Button>
            </Box>
          </Box>

          {/* Features Section */}
          <Box ref={featuresRef} sx={{ 
            bgcolor: 'background.neutral', 
            py: 8, 
            px: 4,
            borderRadius: 3, 
            my: 4 
          }}>
            <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
              Why Choose LebAuction?
            </Typography>
            <Typography variant="h6" textAlign="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
              Join thousands of satisfied users who trust our platform
            </Typography>

            <Grid container spacing={4}>
              {[
                {
                  icon: '🛡️',
                  title: 'Secure Transactions',
                  description: 'Advanced encryption and secure payment processing protect every transaction on our platform.'
                },
                {
                  icon: '🎯',
                  title: 'Expert Authentication',
                  description: 'Professional authenticators verify high-value items to ensure authenticity and quality.'
                },
                {
                  icon: '🌍',
                  title: 'Global Marketplace',
                  description: 'Connect with buyers and sellers from around the world in our international auction house.'
                },
                {
                  icon: '📱',
                  title: 'Mobile Friendly',
                  description: 'Bid and sell on the go with our responsive design and mobile-optimized experience.'
                },
                {
                  icon: '💰',
                  title: 'Competitive Fees',
                  description: 'Transparent pricing with competitive seller fees and no hidden charges for buyers.'
                },
                {
                  icon: '🏆',
                  title: 'Award Winning',
                  description: 'Recognized as the leading online auction platform in the Middle East region.'
                },
              ].map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    height: '100%',
                    bgcolor: 'background.paper',
                    boxShadow: (theme) => theme.palette.mode === 'dark' 
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                      : '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: (theme) => theme.palette.mode === 'dark' 
                        ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                        : '0 8px 24px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease-in-out',
                    }
                  }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      {feature.icon}
                    </Typography>
                    <Typography variant="h5" gutterBottom color="text.primary">
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>

        {/* Footer CTA - Only on Homepage */}
        <ErrorBoundary>
          <FooterCTA />
        </ErrorBoundary>
      </HomepageLayout>
    </ErrorBoundary>
  );
}