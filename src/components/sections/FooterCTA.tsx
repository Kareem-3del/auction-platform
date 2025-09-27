'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Button,
  useTheme,
  Container,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';

import { useLocale } from 'src/hooks/useLocale';

export function FooterCTA() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white',
        py: { xs: 8, md: 10 },
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 25% 25%, rgba(206,15,46,0.15) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(206,15,46,0.1) 0%, transparent 50%)
          `,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3,
        },
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 900, mx: 'auto' }}>
          {/* Lebanon Auction Stats Section */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 4, md: 8 },
              flexWrap: 'wrap',
              mb: 6,
              opacity: 0.9,
            }}
          >
            {[
              { number: '1000+', label: t('homepage.stats.itemsSold'), icon: 'mdi:gavel' },
              { number: '500+', label: t('homepage.stats.happyBidders'), icon: 'mdi:account-group' },
              { number: '50+', label: t('homepage.stats.categories'), icon: 'mdi:view-grid' },
              { number: '24/7', label: t('homepage.stats.support'), icon: 'mdi:headset' },
            ].map((stat, index) => (
              <Box key={index} sx={{ textAlign: 'center' }}>
                <Icon 
                  icon={stat.icon} 
                  width={32} 
                  height={32}
                  style={{ 
                    color: theme.palette.primary.main,
                    marginBottom: 8,
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '1.8rem', sm: '2.2rem' },
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    mb: 0.5,
                  }}
                >
                  {stat.number}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.9rem',
                    opacity: 0.8,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Main Call to Action */}
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontWeight: 'bold',
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              mb: 3,
              textShadow: '0 4px 8px rgba(0,0,0,0.4)',
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, #ff4d6d 90%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
            }}
          >
            {t('homepage.startJourney.title')}
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h5"
            sx={{
              mb: 6,
              opacity: 0.9,
              fontWeight: 300,
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            {t('homepage.startJourney.description')}
          </Typography>

          {/* Enhanced Search Bar */}
          <Box
            sx={{
              maxWidth: 700,
              mx: 'auto',
              mb: 6,
              position: 'relative',
            }}
          >
            <TextField
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('homepage.hero.searchPlaceholder')}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon 
                      icon="mdi:magnify" 
                      width={24} 
                      height={24}
                      style={{ color: theme.palette.text.secondary }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        px: 4,
                        py: 1.2,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        '&:hover': {
                          bgcolor: theme.palette.primary.dark,
                          boxShadow: `0 4px 16px ${theme.palette.primary.main}40`,
                        },
                      }}
                    >
                      {t('common.search')}
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(15px)',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                },
                '& .MuiInputBase-input': {
                  py: 2.5,
                  fontSize: '1.1rem',
                },
              }}
            />
          </Box>

          {/* Premium Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              justifyContent: 'center',
              flexWrap: 'wrap',
              mb: 8,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/auctions')}
              startIcon={<Icon icon="mdi:gavel" width={22} />}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                px: 5,
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: `0 8px 25px ${theme.palette.primary.main}30`,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 35px ${theme.palette.primary.main}40`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('navigation.auctions')}
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push('/categories')}
              startIcon={<Icon icon="mdi:view-grid" width={22} />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.4)',
                px: 5,
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                borderWidth: '2px',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(255, 255, 255, 0.1)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('navigation.categories')}
            </Button>

            <Button
              variant="text"
              size="large"
              onClick={() => router.push('/register')}
              startIcon={<Icon icon="mdi:account-plus-outline" width={22} />}
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                px: 4,
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': {
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('auth.signUp')}
            </Button>
          </Box>

          {/* Enhanced Trust Badges */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 3, sm: 6 },
              flexWrap: 'wrap',
              opacity: 0.9,
            }}
          >
            {[
              { 
                icon: 'mdi:shield-check-outline', 
                text: t('homepage.trustBadges.licensedSecure'), 
                desc: t('homepage.trustBadges.governmentRegulated'),
                action: () => router.push('/help?section=security')
              },
              { 
                icon: 'mdi:clock-fast', 
                text: t('homepage.trustBadges.realTimeBidding'), 
                desc: t('homepage.trustBadges.instantUpdates'),
                action: () => router.push('/auctions')
              },
              { 
                icon: 'mdi:certificate-outline', 
                text: t('homepage.trustBadges.verifiedItems'), 
                desc: t('homepage.trustBadges.expertAuthentication'),
                action: () => router.push('/help?section=authentication')
              },
              { 
                icon: 'mdi:handshake-outline', 
                text: t('homepage.trustBadges.trustedBy'), 
                desc: t('homepage.trustBadges.happyCustomers'),
                action: () => router.push('/about')
              },
            ].map((badge, index) => (
              <Box
                key={index}
                component="button"
                onClick={badge.action}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  textAlign: 'center',
                  maxWidth: 140,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  }
                }}
              >
                <Icon 
                  icon={badge.icon} 
                  width={24} 
                  height={24}
                  style={{ 
                    color: theme.palette.primary.main,
                    opacity: 0.9,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'white',
                    mb: 0.5,
                  }}
                >
                  {badge.text}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {badge.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      {/* Enhanced Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${theme.palette.primary.main}15 0%, transparent 70%)`,
          borderRadius: '50%',
          display: { xs: 'none', lg: 'block' },
          animation: 'floatSlow 12s ease-in-out infinite',
          '@keyframes floatSlow': {
            '0%': { transform: 'translateY(0px) scale(1)' },
            '50%': { transform: 'translateY(-25px) scale(1.1)' },
            '100%': { transform: 'translateY(0px) scale(1)' },
          },
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '3%',
          width: 100,
          height: 100,
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          display: { xs: 'none', lg: 'block' },
          animation: 'floatSlow 10s ease-in-out infinite reverse',
        }}
      />

      {/* Geometric Accent */}
      <Box
        sx={{
          position: 'absolute',
          top: '25%',
          left: '10%',
          width: 40,
          height: 40,
          border: `2px solid ${theme.palette.primary.main}30`,
          borderRadius: 1,
          transform: 'rotate(45deg)',
          display: { xs: 'none', xl: 'block' },
          animation: 'rotate 20s linear infinite',
          '@keyframes rotate': {
            '0%': { transform: 'rotate(45deg)' },
            '100%': { transform: 'rotate(405deg)' },
          },
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: '30%',
          right: '8%',
          width: 30,
          height: 30,
          border: `2px solid rgba(255,255,255,0.2)`,
          borderRadius: '50%',
          display: { xs: 'none', xl: 'block' },
          animation: 'pulse 4s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': { opacity: 0.3, transform: 'scale(1)' },
            '50%': { opacity: 0.6, transform: 'scale(1.2)' },
            '100%': { opacity: 0.3, transform: 'scale(1)' },
          },
        }}
      />
    </Box>
  );
}