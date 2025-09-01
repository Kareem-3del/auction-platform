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

export function HeroBanner() {
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
        minHeight: { xs: '70vh', md: '80vh' },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(206,15,46,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)
          `,
        },
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: 900,
            mx: 'auto',
            py: { xs: 4, md: 6 },
          }}
        >
          {/* Main Heading */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 'bold',
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5rem' },
              mb: 3,
              lineHeight: 1.1,
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            {t('footer.company.name')}
            <br />
            <Box component="span" sx={{ color: 'primary.main' }}>{t('homepage.hero.auctionHouse')}</Box>
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h5"
            sx={{
              mb: 5,
              opacity: 0.9,
              fontWeight: 400,
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
              lineHeight: 1.6,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            {t('homepage.hero.description')}
          </Typography>

          {/* Search Bar */}
          <Box
            sx={{
              maxWidth: 700,
              mx: 'auto',
              mb: 5,
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
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 4,
                        py: 1.2,
                        borderRadius: 1,
                        fontWeight: 'bold',
                        '&:hover': {
                          bgcolor: 'primary.dark',
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

          {/* Category Quick Links */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
              mb: 6,
            }}
          >
            {[
              { label: t('homepage.categories.motors'), icon: 'mdi:car', path: '/categories/cars' },
              { label: t('homepage.categories.properties'), icon: 'mdi:home-city', path: '/categories/properties' },
              { label: 'Jewelry', icon: 'mdi:diamond-stone', path: '/categories/jewelry' },
              { label: 'Plates', icon: 'mdi:card-text', path: '/categories/plates' },
            ].map((category) => (
              <Button
                key={category.label}
                variant="outlined"
                size="large"
                onClick={() => router.push(category.path)}
                startIcon={<Icon icon={category.icon} width={20} />}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(10px)',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(206, 15, 46, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(206, 15, 46, 0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {category.label}
              </Button>
            ))}
          </Box>

          {/* Main Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              justifyContent: 'center',
              flexWrap: 'wrap',
              mb: 6,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/auctions')}
              startIcon={<Icon icon="mdi:gavel" width={22} />}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                px: 5,
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: `0 8px 25px rgba(206, 15, 46, 0.3)`,
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 35px rgba(206, 15, 46, 0.4)`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('navigation.auctions')}
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push('/register')}
              startIcon={<Icon icon="mdi:account-plus" width={22} />}
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
              {t('auth.signUp')}
            </Button>
          </Box>

          {/* Premium Trust & Recognition */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 4, sm: 8 },
              flexWrap: 'wrap',
              opacity: 0.95,
              pt: 4,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {[
              { label: t('homepage.trustBadges.licensedSecure'), icon: 'mdi:certificate-outline', desc: t('homepage.trustBadges.governmentRegulated') },
              { label: t('homepage.trustBadges.trustedSince'), icon: 'mdi:shield-check-outline', desc: t('homepage.trustBadges.provenTrackRecord') },
              { label: t('homepage.trustBadges.eliteCommunity'), icon: 'mdi:crown-outline', desc: `5000+ ${t('homepage.trustBadges.collectors')}` },
              { label: t('homepage.trustBadges.expertAuthentication'), icon: 'mdi:diamond-outline', desc: t('homepage.trustBadges.verifiedAuthenticity') },
            ].map((badge, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  textAlign: 'center',
                  maxWidth: 150,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    '& .badge-icon': {
                      color: theme.palette.primary.main,
                      transform: 'scale(1.1)',
                    },
                  },
                }}
              >
                <Icon 
                  className="badge-icon"
                  icon={badge.icon} 
                  width={28} 
                  height={28}
                  style={{ 
                    opacity: 0.8, 
                    color: 'white',
                    transition: 'all 0.3s ease',
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'white',
                    mb: 0.5,
                  }}
                >
                  {badge.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.8rem',
                    opacity: 0.7,
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 300,
                  }}
                >
                  {badge.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      {/* Sophisticated Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '8%',
          right: '3%',
          width: 300,
          height: 300,
          background: `
            radial-gradient(circle at 30% 30%, rgba(206,15,46,0.08) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(255,255,255,0.03) 0%, transparent 50%)
          `,
          borderRadius: '50%',
          display: { xs: 'none', xl: 'block' },
          animation: 'sophisticatedFloat 15s ease-in-out infinite',
          '@keyframes sophisticatedFloat': {
            '0%': { transform: 'translateY(0px) rotate(0deg) scale(1)' },
            '33%': { transform: 'translateY(-30px) rotate(120deg) scale(1.1)' },
            '66%': { transform: 'translateY(-15px) rotate(240deg) scale(0.9)' },
            '100%': { transform: 'translateY(0px) rotate(360deg) scale(1)' },
          },
          zIndex: 0,
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: '12%',
          left: '5%',
          width: 250,
          height: 250,
          background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)',
          borderRadius: '50%',
          display: { xs: 'none', xl: 'block' },
          animation: 'sophisticatedFloat 12s ease-in-out infinite reverse',
          zIndex: 0,
        }}
      />

      {/* Premium Geometric Accents */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '8%',
          width: 80,
          height: 80,
          border: `1px solid rgba(206,15,46,0.15)`,
          borderRadius: 2,
          transform: 'rotate(45deg)',
          display: { xs: 'none', lg: 'block' },
          animation: 'geometricRotate 25s linear infinite',
          '@keyframes geometricRotate': {
            '0%': { transform: 'rotate(45deg)' },
            '100%': { transform: 'rotate(405deg)' },
          },
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: '25%',
          right: '10%',
          width: 60,
          height: 60,
          border: `1px solid rgba(255,255,255,0.1)`,
          borderRadius: '50%',
          display: { xs: 'none', lg: 'block' },
          animation: 'premiumPulse 6s ease-in-out infinite',
          '@keyframes premiumPulse': {
            '0%': { opacity: 0.3, transform: 'scale(1)' },
            '50%': { opacity: 0.6, transform: 'scale(1.3)' },
            '100%': { opacity: 0.3, transform: 'scale(1)' },
          },
          zIndex: 0,
        }}
      />

      {/* Luxury Grid Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          right: '15%',
          width: 40,
          height: 40,
          background: `
            linear-gradient(90deg, rgba(206,15,46,0.1) 50%, transparent 50%),
            linear-gradient(rgba(206,15,46,0.1) 50%, transparent 50%)
          `,
          backgroundSize: '8px 8px',
          display: { xs: 'none', lg: 'block' },
          animation: 'gridShift 8s ease-in-out infinite',
          '@keyframes gridShift': {
            '0%': { opacity: 0.3 },
            '50%': { opacity: 0.7 },
            '100%': { opacity: 0.3 },
          },
          zIndex: 0,
        }}
      />
    </Box>
  );
}