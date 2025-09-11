'use client';

import {
  Box,
  Card,
  Grid,
  Stack,
  Avatar,
  Button,
  useTheme,
  Container,
  Typography,
  Chip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Gavel as AuctionIcon,
  People as PeopleIcon,
  Support as SupportIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  EmojiEvents as AwardIcon,
  Verified as VerifiedIcon,
  Payment as PaymentIcon,
  Timeline as TimelineIcon,
  LocalShipping as ShippingIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';

import HomepageLayout from 'src/components/layout/HomepageLayout';
import { useRouter } from 'next/navigation';
import { useLocale } from 'src/hooks/useLocale';

const getFeatures = (t: any) => [
  {
    icon: AuctionIcon,
    title: t('about.features.liveAuctions.title'),
    description: t('about.features.liveAuctions.description'),
    color: '#CE0E2D',
  },
  {
    icon: VerifiedIcon,
    title: t('about.features.authentication.title'),
    description: t('about.features.authentication.description'),
    color: '#22C55E',
  },
  {
    icon: PaymentIcon,
    title: t('about.features.payment.title'),
    description: t('about.features.payment.description'),
    color: '#1976D2',
  },
  {
    icon: ShieldIcon,
    title: t('about.features.privacy.title'),
    description: t('about.features.privacy.description'),
    color: '#9C27B0',
  },
  {
    icon: SupportIcon,
    title: t('about.features.support.title'),
    description: t('about.features.support.description'),
    color: '#FF9800',
  },
  {
    icon: TrendingUpIcon,
    title: t('about.features.intelligence.title'),
    description: t('about.features.intelligence.description'),
    color: '#00BCD4',
  },
];

const getStats = (t: any) => [
  { value: '25K+', label: t('about.stats.users.label'), description: t('about.stats.users.description') },
  { value: '5,000+', label: t('about.stats.auctions.label'), description: t('about.stats.auctions.description') },
  { value: '$12M+', label: t('about.stats.volume.label'), description: t('about.stats.volume.description') },
  { value: '99.8%', label: t('about.stats.satisfaction.label'), description: t('about.stats.satisfaction.description') },
];

const milestones = [
  {
    year: '2020',
    title: 'Lebanon Auction Founded',
    description: 'Established as the first premium online auction platform in Lebanon',
    icon: BusinessIcon,
  },
  {
    year: '2021',
    title: 'Luxury Car Auctions Launch',
    description: 'Introduced specialized auctions for high-end vehicles and prestigious license plates',
    icon: AuctionIcon,
  },
  {
    year: '2022',
    title: 'Regional Expansion',
    description: 'Extended services to serve collectors across the Middle East and North Africa',
    icon: TrendingUpIcon,
  },
  {
    year: '2023',
    title: 'Technology Innovation',
    description: 'Launched anonymous bidding, crypto payments, and mobile-first platform',
    icon: SpeedIcon,
  },
  {
    year: '2024',
    title: 'Market Leadership',
    description: 'Became the leading luxury auction platform in the MENA region',
    icon: AwardIcon,
  },
];

const team = [
  {
    name: 'Ahmad Khalil',
    role: 'CEO & Founder',
    avatar: '/images/team/ahmad.jpg',
    bio: 'Luxury market expert with 20+ years in Lebanese auction industry',
    expertise: 'Market Strategy, Luxury Authentication',
  },
  {
    name: 'Nadia Saab',
    role: 'Chief Technology Officer',
    avatar: '/images/team/nadia.jpg',
    bio: 'Former tech lead at major fintech companies, specialized in secure platforms',
    expertise: 'Platform Development, Cybersecurity',
  },
  {
    name: 'Rami Boutros',
    role: 'Head of Authentication',
    avatar: '/images/team/rami.jpg',
    bio: 'Certified appraiser for luxury goods, jewelry, and collectibles',
    expertise: 'Item Authentication, Market Valuation',
  },
];

export default function AboutPage() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useLocale();
  
  const features = getFeatures(t);
  const stats = getStats(t);

  return (
    <HomepageLayout>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #CE0E2D 0%, #B00C24 50%, #8A0A1C 100%)',
          pt: { xs: 6, md: 8 },
          pb: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("/images/grid.svg") repeat',
            opacity: 0.05,
          },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs 
              sx={{ 
                mb: 4,
                '& .MuiBreadcrumbs-separator': { color: 'rgba(255,255,255,0.5)' }
              }}
            >
              <Link 
                color="rgba(255,255,255,0.7)" 
                href="/" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  textDecoration: 'none',
                  '&:hover': { color: 'white' }
                }}
              >
                <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                {t('navigation.home')}
              </Link>
              <Typography sx={{ color: 'white', fontWeight: 500 }}>{t('navigation.about')}</Typography>
            </Breadcrumbs>

            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography
                  variant="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 900,
                    color: 'white',
                    mb: 3,
                    fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                    lineHeight: 1.1,
                  }}
                >
                  {t('about.hero.title.line1')} <br />
                  <Box component="span" sx={{ fontStyle: 'italic', opacity: 0.9 }}>
                    {t('about.hero.title.line2')}
                  </Box> {t('about.hero.title.line3')}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    mb: 6,
                    lineHeight: 1.6,
                    fontSize: { xs: '1.3rem', md: '1.6rem' },
                  }}
                >
                  {t('about.hero.subtitle')}
                </Typography>
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => router.push('/auctions')}
                    sx={{
                      px: 6,
                      py: 2,
                      borderRadius: 3,
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#CE0E2D',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 1)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
{t('about.hero.exploreButton')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => router.push('/auth/register')}
                    sx={{
                      px: 6,
                      py: 2,
                      borderRadius: 3,
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      borderWidth: 2,
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        background: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-3px)',
                        borderWidth: 2,
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
{t('about.hero.joinButton')}
                  </Button>
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    height: { xs: 300, md: 400 },
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Stack spacing={3} alignItems="center">
                    <BusinessIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.9)' }} />
                    <Typography
                      variant="h4"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
{t('about.hero.trustedBy')}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'rgba(255,255,255,0.8)',
                        textAlign: 'center',
                        maxWidth: 300,
                      }}
                    >
{t('about.hero.globalReach')}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography
          variant="h3"
          textAlign="center"
          gutterBottom
          sx={{ fontWeight: 700, mb: 8, color: 'text.primary' }}
        >
{t('about.stats.title')}
        </Typography>
        
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  borderRadius: 4,
                  border: '2px solid transparent',
                  background: 'linear-gradient(135deg, rgba(206,14,45,0.05), rgba(206,14,45,0.02))',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#CE0E2D',
                    boxShadow: '0 20px 60px rgba(206,14,45,0.15)',
                  },
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 900,
                    color: '#CE0E2D',
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3rem' },
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="h5"
                  color="text.primary"
                  sx={{ fontWeight: 600, mb: 2 }}
                >
                  {stat.label}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {stat.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Mission Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h3"
                gutterBottom
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
{t('about.mission.title')}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.6 }}
              >
{t('about.mission.subtitle')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
{t('about.mission.description')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  height: 400,
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: 'white',
                    fontStyle: 'italic',
                    fontWeight: 800,
                  }}
                >
{t('about.mission.imageAlt')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
{t('about.features.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
{t('about.features.subtitle')}
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  p: 4,
                  height: '100%',
                  textAlign: 'center',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <feature.icon sx={{ fontSize: 32, color: 'white' }} />
                </Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Team Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 6 }}>
            <Typography
              variant="h3"
              gutterBottom
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
{t('about.team.title')}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
{t('about.team.subtitle')}
            </Typography>
          </Box>
          
          <Grid container spacing={4} justifyContent="center">
            {team.map((member, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <Avatar
                    src={member.avatar}
                    alt={member.name}
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: 'primary.main',
                    }}
                  >
                    {member.name.charAt(0)}
                  </Avatar>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                  >
                    {member.name}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 1, fontWeight: 500 }}
                  >
                    {member.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.bio}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          py: 8,
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'white',
                mb: 2,
              }}
            >
{t('about.cta.title')}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 4,
                lineHeight: 1.5,
              }}
            >
{t('about.cta.subtitle')}
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
{t('about.cta.getStarted')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
{t('about.cta.learnMore')}
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </HomepageLayout>
  );
}