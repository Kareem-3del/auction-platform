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

const footerLinks = {
  'Auctions': [
    { label: 'Motors', href: '/motors' },
    { label: 'Prestigious Numbers', href: '/prestigious-numbers' },
    { label: 'Properties', href: '/properties' },
    { label: 'Surplus', href: '/surplus' },
    { label: 'For Rent', href: '/for-rent' },
  ],
  'Services': [
    { label: 'Register', href: '/auth/register' },
    { label: 'Bidding Guide', href: '/bidding-guide' },
    { label: 'Valuation Services', href: '/valuation' },
    { label: 'Auction Calendar', href: '/auction-calendar' },
  ],
  'Support': [
    { label: 'About EA', href: '/about' },
    { label: 'Help', href: '/help' },
    { label: 'Contact Us', href: '/contact-us' },
    { label: 'Find Us', href: '/find-us' },
  ],
  'Legal': [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Bidding Terms', href: '/bidding-terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

const legalLinks = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Auction Terms', href: '/auction-terms' },
];

const socialLinks = [
  { icon: FacebookIcon, href: 'https://facebook.com', label: 'Facebook' },
  { icon: TwitterIcon, href: 'https://twitter.com', label: 'Twitter' },
  { icon: InstagramIcon, href: 'https://instagram.com', label: 'Instagram' },
  { icon: LinkedInIcon, href: 'https://linkedin.com', label: 'LinkedIn' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
                    Lebanon&apos;s premier online auction platform. Discover authentic collectibles, 
                    rare items, and unique pieces from verified sellers across the region.
                  </Typography>

                  {/* Contact Info */}
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center">
                      <EmailIcon sx={{ fontSize: 18, mr: 2, color: 'rgba(255, 255, 255, 0.5)' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        info@lebauction.com
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <PhoneIcon sx={{ fontSize: 18, mr: 2, color: 'rgba(255, 255, 255, 0.5)' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        +961 1 123-456
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <LocationIcon sx={{ fontSize: 18, mr: 2, color: 'rgba(255, 255, 255, 0.5)' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Beirut, Lebanon
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
                  Follow Us
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
                    Trusted Platform
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.75rem',
                      lineHeight: 1.4,
                    }}
                  >
                    Secure payments • Verified sellers • Buyer protection • Worldwide shipping
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
                  © {currentYear} LebAuction. All rights reserved.
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