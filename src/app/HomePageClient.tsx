'use client';

import { gsap } from 'gsap';
import { useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Box,
  Grid,
  Paper,
  Button,
  Container,
  Typography,
  Alert,
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
import { useLocale } from 'src/hooks/useLocale';

export default function HomePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const featuresRef = useRef<HTMLDivElement>(null);
  
  // Check for error messages in URL params
  const error = searchParams.get('error');

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

        {/* Error Message Display */}
        {error === 'dashboard_access_denied' && (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 2 }}>
            <Alert 
              severity="warning" 
              onClose={() => router.replace('/')} 
              sx={{
                '& .MuiAlert-message': {
                  fontSize: '1rem',
                },
              }}
            >
              <Typography variant="h6" component="div" gutterBottom>
                Dashboard Access Denied
              </Typography>
              <Typography variant="body1">
                You don't have permission to access the dashboard. Only administrators and approved agents can access the dashboard area. 
                If you believe this is an error, please contact support.
              </Typography>
            </Alert>
          </Container>
        )}

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
              {t('homepage.hero.title')}
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}>
              {t('homepage.hero.subtitle')}
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
                {t('navigation.products')}
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
                {t('navigation.auctions')}
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
              {t('homepage.whyChoose.title')}
            </Typography>
            <Typography variant="h6" textAlign="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
              {t('homepage.whyChoose.subtitle')}
            </Typography>

            <Grid container spacing={4}>
              {[
                {
                  icon: '🛡️',
                  title: t('homepage.whyChoose.features.secureTransactions.title'),
                  description: t('homepage.whyChoose.features.secureTransactions.description'),
                  action: () => router.push('/help?section=security')
                },
                {
                  icon: '🎯',
                  title: t('homepage.whyChoose.features.expertAuthentication.title'),
                  description: t('homepage.whyChoose.features.expertAuthentication.description'),
                  action: () => router.push('/help?section=authentication')
                },
                {
                  icon: '🌍',
                  title: t('homepage.whyChoose.features.globalMarketplace.title'),
                  description: t('homepage.whyChoose.features.globalMarketplace.description'),
                  action: () => router.push('/categories')
                },
                {
                  icon: '📱',
                  title: t('homepage.whyChoose.features.mobileFriendly.title'),
                  description: t('homepage.whyChoose.features.mobileFriendly.description'),
                  action: () => router.push('/help?section=mobile')
                },
                {
                  icon: '💰',
                  title: t('homepage.whyChoose.features.competitiveFees.title'),
                  description: t('homepage.whyChoose.features.competitiveFees.description'),
                  action: () => router.push('/help?section=fees')
                },
                {
                  icon: '🏆',
                  title: t('homepage.whyChoose.features.awardWinning.title'),
                  description: t('homepage.whyChoose.features.awardWinning.description'),
                  action: () => router.push('/about')
                },
              ].map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper 
                    component="button"
                    onClick={feature.action}
                    sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      height: '100%',
                      width: '100%',
                      bgcolor: 'background.paper',
                      boxShadow: (theme) => theme.palette.mode === 'dark' 
                        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                        : '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        boxShadow: (theme) => theme.palette.mode === 'dark' 
                          ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                          : '0 8px 24px rgba(0, 0, 0, 0.15)',
                        transform: 'translateY(-2px)',
                        bgcolor: 'rgba(206, 14, 45, 0.02)',
                        borderColor: 'primary.main',
                      },
                      '&:active': {
                        transform: 'translateY(0px)',
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