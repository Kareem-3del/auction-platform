'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Alert,
  Container,
  Typography,
} from '@mui/material';

import { ErrorBoundary } from 'src/components/ErrorBoundary';
import { ModernHeroSection } from 'src/components/sections/ModernHeroSection';
import { ModernPremiumAuctions } from 'src/components/sections/ModernPremiumAuctions';
import { SimpleCategoryShowcase } from 'src/components/sections/SimpleCategoryShowcase';
import { TrustAndTestimonials } from 'src/components/sections/TrustAndTestimonials';
import HomepageLayout from 'src/components/layout/HomepageLayout';

export default function NewHomePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for error messages in URL params
  const error = searchParams.get('error');

  return (
    <ErrorBoundary>
      <HomepageLayout>
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

        {/* Modern Hero Section */}
        <ErrorBoundary>
          <ModernHeroSection />
        </ErrorBoundary>


        {/* Premium Auction Collections - Individual Sections */}
        <ErrorBoundary>
          <ModernPremiumAuctions showTabs={false} limit={6} />
        </ErrorBoundary>

        {/* Simple Category Showcase */}
        <ErrorBoundary>
          <SimpleCategoryShowcase />
        </ErrorBoundary>

        {/* Trust & Testimonials */}
        <ErrorBoundary>
          <TrustAndTestimonials />
        </ErrorBoundary>

        {/* Premium Call to Action Section */}
        <ErrorBoundary>
          <Box
            sx={{
              py: { xs: 8, md: 12 },
              background: 'linear-gradient(135deg, #0F1419 0%, #2D3748 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(206, 14, 45, 0.1) 0%, transparent 70%)',
                animation: 'rotate 20s linear infinite',
                '@keyframes rotate': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              },
            }}
          >
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    mb: 3,
                    lineHeight: 1.2,
                    background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Ready to Start Your Collection?
                </Typography>
                
                <Typography
                  variant="h5"
                  sx={{
                    mb: 6,
                    color: 'rgba(255, 255, 255, 0.8)',
                    maxWidth: '600px',
                    mx: 'auto',
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  Join thousands of collectors worldwide and discover extraordinary items from verified sellers.
                </Typography>

                <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Box
                    component="button"
                    onClick={() => router.push('/auth/register')}
                    sx={{
                      px: { xs: 6, md: 10 },
                      py: { xs: 2, md: 3 },
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                      fontWeight: 700,
                      borderRadius: '50px',
                      background: 'linear-gradient(135deg, #CE0E2D 0%, #FF4444 100%)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 8px 32px rgba(206, 14, 45, 0.4)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      textTransform: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      '&:hover': {
                        transform: 'translateY(-6px) scale(1.05)',
                        boxShadow: '0 16px 48px rgba(206, 14, 45, 0.5)',
                        background: 'linear-gradient(135deg, #b00c26 0%, #e63939 100%)',
                      },
                      '&:active': {
                        transform: 'translateY(-2px) scale(1.02)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'white',
                        }}
                      />
                    </Box>
                    Start Collecting Today
                  </Box>

                  <Box
                    component="button"
                    onClick={() => router.push('/auctions')}
                    sx={{
                      px: { xs: 6, md: 10 },
                      py: { xs: 2, md: 3 },
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                      fontWeight: 600,
                      borderRadius: '50px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      backdropFilter: 'blur(20px)',
                      transition: 'all 0.3s ease',
                      textTransform: 'none',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 32px rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Explore Auctions
                  </Box>
                </Box>

                {/* Statistics */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 4,
                    mt: 10,
                    pt: 8,
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {[
                    { value: '150K+', label: 'Active Collectors' },
                    { value: '2.1M+', label: 'Items Sold' },
                    { value: '$3.2B+', label: 'Total Volume' },
                    { value: '99.8%', label: 'Satisfaction Rate' },
                  ].map((stat, index) => (
                    <Box key={index} sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: '2rem', md: '2.5rem' },
                          color: '#FFD700',
                          fontFamily: '"Roboto Mono", monospace',
                          mb: 1,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.9rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: 500,
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Container>
          </Box>
        </ErrorBoundary>
      </HomepageLayout>
    </ErrorBoundary>
  );
}