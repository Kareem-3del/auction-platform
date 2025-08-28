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
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Gavel as AuctionIcon,
  People as PeopleIcon,
  Support as SupportIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

const features = [
  {
    icon: AuctionIcon,
    title: 'Live Auctions',
    description: 'Experience the thrill of real-time bidding with our advanced auction platform.',
  },
  {
    icon: SecurityIcon,
    title: 'Secure Transactions',
    description: 'Your transactions are protected with enterprise-level security and encryption.',
  },
  {
    icon: SpeedIcon,
    title: 'Fast & Reliable',
    description: 'Lightning-fast bidding system that never lets you miss an opportunity.',
  },
  {
    icon: SupportIcon,
    title: '24/7 Support',
    description: 'Our dedicated team is always here to help you with any questions or concerns.',
  },
  {
    icon: PeopleIcon,
    title: 'Community Driven',
    description: 'Join a vibrant community of collectors, dealers, and auction enthusiasts.',
  },
  {
    icon: TrendingUpIcon,
    title: 'Market Insights',
    description: 'Get valuable insights and analytics to make informed bidding decisions.',
  },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '10K+', label: 'Auctions Completed' },
  { value: '$5M+', label: 'Total Volume' },
  { value: '99.9%', label: 'Uptime' },
];

const team = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Founder',
    avatar: '/images/team/sarah.jpg',
    bio: '15+ years in auction industry',
  },
  {
    name: 'Mike Chen',
    role: 'CTO',
    avatar: '/images/team/mike.jpg',
    bio: 'Tech visionary & platform architect',
  },
  {
    name: 'Emily Davis',
    role: 'Head of Operations',
    avatar: '/images/team/emily.jpg',
    bio: 'Ensures smooth auction experiences',
  },
];

export default function AboutPage() {
  const theme = useTheme();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)'
            : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
          pt: 12,
          pb: 8,
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
          <Box textAlign="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                fontWeight: 800,
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)'
                  : 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              About Sassy.
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: theme.palette.mode === 'dark' ? 'common.white' : 'white',
                mb: 4,
                maxWidth: 800,
                mx: 'auto',
                lineHeight: 1.4,
              }}
            >
              We're revolutionizing the auction experience with cutting-edge technology,
              transparent processes, and a community-first approach.
            </Typography>
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
              Join Our Community
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box textAlign="center">
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: 'primary.main',
                    mb: 1,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  {stat.label}
                </Typography>
              </Box>
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
                Our Mission
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.6 }}
              >
                To democratize access to unique items and collectibles through 
                transparent, secure, and exciting auction experiences.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Founded in 2020, Sassy has grown from a small startup to a leading 
                auction platform trusted by thousands of users worldwide. We believe 
                that everyone deserves access to fair, transparent, and exciting 
                auction experiences, whether you're a seasoned collector or just 
                starting your journey.
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
                  Mission Image
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
            Why Choose Sassy?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            We've built our platform with the features that matter most to auction enthusiasts.
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
              Meet Our Team
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              The passionate individuals behind Sassy's success.
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
              Ready to Start Bidding?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 4,
                lineHeight: 1.5,
              }}
            >
              Join thousands of users who trust Sassy for their auction needs.
              Create your account today and start exploring amazing items.
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
                Get Started
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
                Learn More
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}