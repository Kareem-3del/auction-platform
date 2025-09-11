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
          <RecentAdditionsSection limit={6} />
        </ErrorBoundary>

        {/* Enhanced Call to Action Section */}
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
          <Box sx={{ 
            py: { xs: 8, md: 12 }, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.03), rgba(25, 118, 210, 0.03))',
            borderRadius: { xs: 3, md: 6 },
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(206, 14, 45, 0.05) 0%, transparent 70%)',
              pointerEvents: 'none',
            },
          }}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h2" 
                component="h2" 
                gutterBottom
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #CE0E2D, #1976D2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: { xs: '2rem', md: '3rem' },
                  lineHeight: 1.2,
                }}
              >
                {t('homepage.hero.title')}
              </Typography>
              <Typography 
                variant="h5" 
                color="text.secondary" 
                paragraph 
                sx={{ 
                  mb: 6, 
                  maxWidth: 700, 
                  mx: 'auto',
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  lineHeight: 1.6,
                }}
              >
                {t('homepage.hero.subtitle')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={() => router.push('/auctions')}
                  sx={{ 
                    px: { xs: 4, md: 8 }, 
                    py: { xs: 1.5, md: 2 },
                    background: 'linear-gradient(135deg, #CE0E2D, #FF4444)',
                    fontWeight: 700,
                    borderRadius: 4,
                    boxShadow: '0 6px 24px rgba(206, 14, 45, 0.3)',
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    minWidth: { xs: 140, md: 160 },
                    '&:hover': {
                      background: 'linear-gradient(135deg, #b00c26, #e63939)',
                      boxShadow: '0 8px 32px rgba(206, 14, 45, 0.4)',
                      transform: 'translateY(-3px)',
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
                    px: { xs: 4, md: 8 }, 
                    py: { xs: 1.5, md: 2 },
                    borderColor: '#1976D2',
                    color: '#1976D2',
                    fontWeight: 700,
                    borderRadius: 4,
                    borderWidth: 2,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    minWidth: { xs: 140, md: 160 },
                    '&:hover': {
                      borderColor: '#1976D2',
                      borderWidth: 2,
                      backgroundColor: 'rgba(25, 118, 210, 0.06)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 24px rgba(25, 118, 210, 0.2)',
                    },
                  }}
                >
                  {t('navigation.auctions')}
                </Button>
              </Box>
            </Box>
          </Box>
        </Container>

        {/* Enhanced Features Section */}
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, py: { xs: 6, md: 8 } }}>
          <Box ref={featuresRef} sx={{ 
            bgcolor: 'background.neutral', 
            py: { xs: 6, md: 10 }, 
            px: { xs: 3, md: 6 },
            borderRadius: { xs: 3, md: 6 },
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(206, 14, 45, 0.02) 0%, rgba(25, 118, 210, 0.02) 100%)',
              pointerEvents: 'none',
            },
          }}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h2" 
                component="h2" 
                textAlign="center" 
                gutterBottom
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  mb: 2,
                }}
              >
                {t('homepage.whyChoose.title')}
              </Typography>
              <Typography 
                variant="h5" 
                textAlign="center" 
                color="text.secondary" 
                paragraph 
                sx={{ 
                  mb: 8, 
                  maxWidth: 600, 
                  mx: 'auto',
                  fontSize: { xs: '1rem', md: '1.25rem' },
                }}
              >
                {t('homepage.whyChoose.subtitle')}
              </Typography>

              <Grid container spacing={{ xs: 3, md: 4 }}>
                {[
                  {
                    icon: '🛡️',
                    title: t('homepage.whyChoose.features.secureTransactions.title'),
                    description: t('homepage.whyChoose.features.secureTransactions.description'),
                  },
                  {
                    icon: '🎯',
                    title: t('homepage.whyChoose.features.expertAuthentication.title'),
                    description: t('homepage.whyChoose.features.expertAuthentication.description'),
                  },
                  {
                    icon: '🌍',
                    title: t('homepage.whyChoose.features.globalMarketplace.title'),
                    description: t('homepage.whyChoose.features.globalMarketplace.description'),
                  },
                  {
                    icon: '📱',
                    title: t('homepage.whyChoose.features.mobileFriendly.title'),
                    description: t('homepage.whyChoose.features.mobileFriendly.description'),
                  },
                  {
                    icon: '💰',
                    title: t('homepage.whyChoose.features.competitiveFees.title'),
                    description: t('homepage.whyChoose.features.competitiveFees.description'),
                  },
                  {
                    icon: '🏆',
                    title: t('homepage.whyChoose.features.awardWinning.title'),
                    description: t('homepage.whyChoose.features.awardWinning.description'),
                  },
                ].map((feature, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={index}>
                    <Paper 
                      sx={{ 
                        p: { xs: 3, md: 4 }, 
                        textAlign: 'center', 
                        height: '100%',
                        bgcolor: 'background.paper',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        cursor: 'default',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                          transform: 'translateY(-8px)',
                          bgcolor: 'rgba(206, 14, 45, 0.02)',
                          borderColor: 'primary.main',
                          '&::before': {
                            opacity: 1,
                          },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.03), rgba(25, 118, 210, 0.03))',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          pointerEvents: 'none',
                        },
                      }}>
                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography 
                          variant="h1" 
                          sx={{ 
                            mb: 3,
                            fontSize: { xs: '3rem', md: '4rem' },
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                          }}
                        >
                          {feature.icon}
                        </Typography>
                        <Typography 
                          variant="h5" 
                          gutterBottom 
                          color="text.primary"
                          sx={{
                            fontWeight: 700,
                            mb: 2,
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography 
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            lineHeight: 1.6,
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
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