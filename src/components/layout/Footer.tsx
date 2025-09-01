'use client';

import {
  Box,
  Grid,
  Stack,
  Container,
  Typography,
  IconButton,
  Link as MuiLink,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

import { Logo } from 'src/components/logo';
import { useLocale } from 'src/hooks/useLocale';


const socialLinks = [
  { icon: FacebookIcon, href: 'https://facebook.com', label: 'Facebook' },
  { icon: TwitterIcon, href: 'https://twitter.com', label: 'Twitter' },
  { icon: InstagramIcon, href: 'https://instagram.com', label: 'Instagram' },
  { icon: LinkedInIcon, href: 'https://linkedin.com', label: 'LinkedIn' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLocale();

  // Dynamic footer links based on translations
  const footerLinks = {
    [t('homepage.categories.auctions')]: [
      { label: t('homepage.categories.motors'), href: '/motors' },
      { label: t('homepage.categories.prestigiousNumbers'), href: '/prestigious-numbers' },
      { label: t('homepage.categories.properties'), href: '/properties' },
      { label: t('homepage.categories.surplus'), href: '/surplus' },
      { label: t('homepage.categories.forRent'), href: '/for-rent' },
    ],
    [t('footer.links.services')]: [
      { label: t('footer.links.register'), href: '/auth/register' },
      { label: t('footer.links.biddingGuide'), href: '/bidding-guide' },
      { label: t('footer.links.valuationServices'), href: '/valuation' },
      { label: t('footer.links.auctionCalendar'), href: '/auction-calendar' },
    ],
    [t('footer.links.support')]: [
      { label: t('footer.links.help'), href: '/help' },
      { label: t('footer.links.contactUs'), href: '/contact-us' },
      { label: t('footer.links.findUs'), href: '/find-us' },
    ],
    [t('footer.links.legal')]: [
      { label: t('footer.links.termsConditions'), href: '/terms' },
      { label: t('footer.links.privacyPolicy'), href: '/privacy' },
      { label: t('footer.links.biddingTerms'), href: '/bidding-terms' },
      { label: t('footer.links.cookiePolicy'), href: '/cookies' },
    ],
  };

  const legalLinks = [
    { label: t('footer.quickLinks.termsOfService'), href: '/terms' },
    { label: t('footer.quickLinks.privacyPolicy'), href: '/privacy' },
    { label: t('footer.quickLinks.cookiePolicy'), href: '/cookies' },
    { label: t('footer.quickLinks.auctionTerms'), href: '/auction-terms' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main Footer */}
      <Box
        sx={{
          bgcolor: '#0F1419', // Darker professional background like Emirates Auction
          color: 'white',
          position: 'relative',
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: '1900px', px: { xs: 3, lg: 4, xl: 6 } }}>
          {/* Main Footer Content */}
          <Box py={{ xs: 4, md: 6 }}>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {/* Brand Section */}
              <Grid item xs={12} lg={3}>
                <Box mb={{ xs: 3, lg: 0 }}>
                  {/* Logo */}
                  <Box sx={{ mb: 3 }}>
                    <Logo
                      sx={{ 
                        width: 160,
                        height: 56,
                      }}
                      isSingle={false}
                    />
                  </Box>
                  
                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      lineHeight: 1.6,
                      mb: 3,
                      fontSize: '0.875rem',
                    }}
                  >
                    {t('footer.company.description')}
                  </Typography>

                  {/* Contact Info */}
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center">
                      <EmailIcon sx={{ fontSize: 18, mr: 2, color: 'rgba(255, 255, 255, 0.5)' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {t('footer.company.contact.email')}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <PhoneIcon sx={{ fontSize: 18, mr: 2, color: 'rgba(255, 255, 255, 0.5)' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {t('footer.company.contact.phone')}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <LocationIcon sx={{ fontSize: 18, mr: 2, color: 'rgba(255, 255, 255, 0.5)' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {t('footer.company.contact.address')}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>

              {/* Footer Links */}
              {Object.entries(footerLinks).map(([category, links]) => (
                <Grid item xs={6} sm={3} lg={2} key={category}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'white',
                      fontWeight: 600,
                      mb: 2,
                      fontSize: '1rem',
                    }}
                  >
                    {category}
                  </Typography>
                  <Stack spacing={1}>
                    {links.map((link) => (
                      <MuiLink
                        key={link.label}
                        href={link.href}
                        underline="none"
                        sx={{
                          display: 'block',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.875rem',
                          py: 0.5,
                          transition: 'color 0.3s ease',
                          '&:hover': {
                            color: '#CE0E2D',
                          },
                        }}
                      >
                        {link.label}
                      </MuiLink>
                    ))}
                  </Stack>
                </Grid>
              ))}

              {/* Social & Newsletter */}
              <Grid item xs={12} lg={3}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    mb: 2,
                    fontSize: '1rem',
                  }}
                >
                  {t('footer.social.followUs')}
                </Typography>
                
                {/* Social Links */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  {socialLinks.map((social) => (
                    <IconButton
                      key={social.label}
                      component="a"
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          bgcolor: '#CE0E2D',
                          color: 'white',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <social.icon fontSize="small" />
                    </IconButton>
                  ))}
                </Stack>

                {/* Trust Indicators */}
                <Box 
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      display: 'block',
                      mb: 1,
                      fontWeight: 500,
                    }}
                  >
                    {t('footer.trust.trustedPlatform')}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.75rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {t('footer.trust.securePayments')} • {t('footer.trust.verifiedSellers')} • {t('footer.trust.buyerProtection')} • {t('footer.trust.worldwideShipping')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Bottom Footer */}
          <Box 
            sx={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              py: 3,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.875rem',
                  }}
                >
                  {t('footer.copyright')}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  justifyContent={{ md: 'flex-end' }}
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                >
                  {legalLinks.map((link) => (
                    <MuiLink
                      key={link.label}
                      href={link.href}
                      underline="none"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.75rem',
                        py: 0.5,
                        transition: 'color 0.3s ease',
                        '&:hover': {
                          color: '#CE0E2D',
                        },
                      }}
                    >
                      {link.label}
                    </MuiLink>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}