'use client';

import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  useTheme,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
  InputAdornment,
  Badge,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Gavel as AuctionIcon,
  AccountBalance as BidIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Person as AccountIcon,
  QuestionAnswer as FAQIcon,
  Support as SupportIcon,
  VideoLibrary as VideoIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

import HomepageLayout from 'src/components/layout/HomepageLayout';
import { useRouter } from 'next/navigation';
import { useLocale } from 'src/hooks/useLocale';

const helpCategories = [
  {
    icon: AuctionIcon,
    title: 'Getting Started',
    description: 'Complete guide to join Lebanon Auction and start bidding on luxury items',
    color: '#1976D2',
    articles: 8,
    topics: ['Account Registration', 'Email Verification', 'Profile Setup', 'KYC Process'],
  },
  {
    icon: BidIcon,
    title: 'Bidding & Auctions',
    description: 'Master the art of bidding on cars, real estate, jewelry, and collectibles',
    color: '#CE0E2D',
    articles: 12,
    topics: ['Live Bidding', 'Auto-Bidding', 'Auction Types', 'Winning Strategies'],
  },
  {
    icon: PaymentIcon,
    title: 'Payments & Wallet',
    description: 'Manage payments with Binance Pay, Whish Money, and traditional methods',
    color: '#22C55E',
    articles: 9,
    topics: ['Deposit Methods', 'Withdrawal Process', 'Payment Security', 'Transaction Fees'],
  },
  {
    icon: AccountIcon,
    title: 'Account Management',
    description: 'Personalize your experience and manage your auction activities',
    color: '#9C27B0',
    articles: 6,
    topics: ['Profile Settings', 'Notification Preferences', 'Privacy Controls', 'Data Export'],
  },
  {
    icon: SecurityIcon,
    title: 'Security & Privacy',
    description: 'Protect your account with our advanced security features',
    color: '#FF9800',
    articles: 10,
    topics: ['Two-Factor Auth', 'Anonymous Bidding', 'Secure Payments', 'Data Protection'],
  },
  {
    icon: SupportIcon,
    title: 'Technical Support',
    description: 'Resolve technical issues and optimize your auction experience',
    color: '#607D8B',
    articles: 5,
    topics: ['Browser Issues', 'Mobile App', 'Connection Problems', 'Performance Tips'],
  },
];

const faqData = [
  {
    question: 'How do I create an account on Lebanon Auction?',
    answer: 'Click "Create Account" in the top-right corner. Fill in your details, verify your email, and complete KYC verification for full access. Lebanese residents get priority access to premium auctions.',
    category: 'Getting Started',
  },
  {
    question: 'What types of items are available for auction?',
    answer: 'We specialize in luxury vehicles (cars, motorcycles), prestigious license plates, real estate properties, fine jewelry, watches, art, and collectibles. All items are authenticated by our experts.',
    category: 'Auctions',
  },
  {
    question: 'How does live bidding work?',
    answer: 'Join live auctions in real-time with automatic updates. Set your maximum bid for auto-bidding or bid manually. You\'ll see current highest bid, remaining time, and bid increments clearly displayed.',
    category: 'Bidding',
  },
  {
    question: 'What payment methods are supported?',
    answer: 'We accept Binance Pay, Whish Money, major credit cards, bank transfers, and local Lebanese banking methods. All transactions are secured with enterprise-level encryption.',
    category: 'Payments',
  },
  {
    question: 'How do I deposit funds into my account?',
    answer: 'Go to Wallet → Deposit, choose your preferred method (Binance Pay, Whish Money, or bank transfer), and follow the secure payment process. Deposits are typically processed within 15 minutes.',
    category: 'Payments',
  },
  {
    question: 'Can I bid anonymously?',
    answer: 'Yes! Enable anonymous bidding in your profile settings. Your identity will be hidden from other bidders with a generated alias like "Mystery Collector 123" while maintaining full security.',
    category: 'Privacy',
  },
  {
    question: 'What happens if I win an auction?',
    answer: 'You\'ll receive instant notification via email and dashboard alert. Payment is automatically processed from your account balance. Arrange pickup or delivery within 7 days of winning.',
    category: 'Winning',
  },
  {
    question: 'Are there any additional fees?',
    answer: 'Buyer\'s premium of 10% applies to winning bids. Payment processing fees: 2% for cards, 1% for crypto, free for bank transfers. Shipping costs vary by item size and destination.',
    category: 'Fees',
  },
  {
    question: 'How is item authenticity guaranteed?',
    answer: 'Every item undergoes rigorous authentication by certified experts. Luxury items include certificates of authenticity. We offer 100% money-back guarantee if authenticity is disputed.',
    category: 'Authentication',
  },
  {
    question: 'Can I cancel a bid once placed?',
    answer: 'Bids are legally binding contracts. Cancellation is only allowed within 2 minutes of placing the bid or in extraordinary circumstances approved by our support team.',
    category: 'Bidding Rules',
  },
  {
    question: 'How do I track my auction activity?',
    answer: 'Visit "My Profile" to view active bids, won items, transaction history, and account balance. Real-time notifications keep you updated on auction status changes.',
    category: 'Account',
  },
  {
    question: 'What if I have technical issues during bidding?',
    answer: 'Contact live support immediately via chat or phone (+961 1 234 567). For auction-critical issues, we may extend bidding time or allow post-auction resolution.',
    category: 'Technical Support',
  },
];

const quickActions = [
  {
    title: 'Live Chat Support',
    description: 'Get instant help 24/7 from our Lebanese support team',
    icon: SupportIcon,
    action: 'Start Chat',
    color: '#00BCD4',
    availability: 'Available Now',
  },
  {
    title: 'Video Tutorials',
    description: 'Watch detailed guides on bidding and platform features',
    icon: VideoIcon,
    action: 'Watch Tutorials',
    color: '#E91E63',
    availability: '15 Videos Available',
  },
  {
    title: 'Schedule Call',
    description: 'Book a personal consultation with our auction experts',
    icon: ScheduleIcon,
    action: 'Book Now',
    color: '#4CAF50',
    availability: 'Free 30min Session',
  },
];

const trendingTopics = [
  { title: 'How to bid on luxury cars', views: 2547, icon: TrendingIcon },
  { title: 'Anonymous bidding guide', views: 1823, icon: SecurityIcon },
  { title: 'Using Binance Pay for deposits', views: 1456, icon: PaymentIcon },
  { title: 'Understanding auction types', views: 1234, icon: AuctionIcon },
  { title: 'Setting up auto-bidding', views: 987, icon: BidIcon },
];

export default function HelpPage() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useLocale();

  const handleCategoryClick = (category: string) => {
    // In a real implementation, this would navigate to category-specific help
    console.log('Navigate to category:', category);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Start Chat':
        // Open live chat
        console.log('Open live chat');
        break;
      case 'Contact Us':
        window.location.href = '/contact';
        break;
      case 'Watch Now':
        // Open video tutorials
        console.log('Open video tutorials');
        break;
    }
  };

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
                Home
              </Link>
              <Typography sx={{ color: 'white', fontWeight: 500 }}>Help Center</Typography>
            </Breadcrumbs>

            <Box textAlign="center">
              <HelpIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'white', 
                  mb: 2,
                  opacity: 0.9,
                }} 
              />
              <Typography
                variant="h2"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  color: 'white',
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                }}
              >
                {t('help.title', 'Help Center')}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  mb: 6,
                  maxWidth: 800,
                  mx: 'auto',
                  lineHeight: 1.4,
                  fontSize: { xs: '1.2rem', md: '1.6rem' },
                }}
              >
                {t('help.subtitle', 'Get expert assistance for luxury auctions, bidding strategies, and platform features')}
              </Typography>
              
              {/* Enhanced Search Box */}
              <Box
                sx={{
                  maxWidth: 700,
                  mx: 'auto',
                  mb: 4,
                }}
              >
                <TextField
                  fullWidth
                  placeholder={t('help.searchPlaceholder', 'Search help articles, tutorials, FAQs...')}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#CE0E2D' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: 'white',
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #CE0E2D',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #CE0E2D',
                      },
                    },
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      height: 60,
                    },
                  }}
                />
              </Box>

              {/* Quick Stats */}
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <Chip
                    label="50+ Help Articles"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                    }}
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label="24/7 Support"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                    }}
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label="Expert Team"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Quick Actions */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          textAlign="center"
          gutterBottom
          sx={{ fontWeight: 700, mb: 6, color: 'text.primary' }}
        >
          {t('help.quickActions', 'Get Instant Support')}
        </Typography>
        
        <Grid container spacing={4}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    '& .action-icon': {
                      transform: 'scale(1.1)',
                    },
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: action.color,
                  },
                }}
                onClick={() => handleQuickAction(action.action)}
              >
                <Badge
                  badgeContent={action.availability}
                  color="success"
                  sx={{
                    mb: 3,
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      bgcolor: action.color,
                      color: 'white',
                    }
                  }}
                >
                  <Box
                    className="action-icon"
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${action.color}15, ${action.color}25)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <action.icon sx={{ fontSize: 40, color: action.color }} />
                  </Box>
                </Badge>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  {action.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                  {action.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    py: 1.5,
                    backgroundColor: action.color,
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: action.color,
                      filter: 'brightness(0.9)',
                      boxShadow: `0 4px 20px ${action.color}40`,
                    },
                  }}
                >
                  {action.action}
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Trending Topics */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            textAlign="center"
            gutterBottom
            sx={{ fontWeight: 700, mb: 6, color: 'text.primary' }}
          >
            {t('help.trendingTopics', 'Trending Help Topics')}
          </Typography>
          
          <Grid container spacing={3}>
            {trendingTopics.map((topic, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    cursor: 'pointer',
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      borderColor: '#CE0E2D',
                    },
                  }}
                  onClick={() => router.push('/help')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <topic.icon sx={{ color: '#CE0E2D', mr: 2, fontSize: 24 }} />
                    <Chip
                      label={`${topic.views.toLocaleString()} views`}
                      size="small"
                      sx={{
                        bgcolor: '#CE0E2D10',
                        color: '#CE0E2D',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        ml: 'auto',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      lineHeight: 1.4,
                      '&:hover': { color: '#CE0E2D' },
                    }}
                  >
                    {topic.title}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Help Categories */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '2rem', md: '2.5rem' } }}
          >
            Browse Help Topics
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', fontSize: '1.2rem' }}>
            Comprehensive guides covering every aspect of luxury auctions and platform features
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {helpCategories.map((category, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  p: 4,
                  height: '100%',
                  textAlign: 'center',
                  border: `2px solid transparent`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  position: 'relative',
                  background: `linear-gradient(135deg, ${category.color}08, ${category.color}04)`,
                  transition: 'all 0.4s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: `0 20px 60px ${category.color}25`,
                    borderColor: category.color,
                    '& .category-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  },
                }}
                onClick={() => handleCategoryClick(category.title)}
              >
                <Badge
                  badgeContent={`${category.articles} articles`}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: category.color,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      right: -10,
                      top: -5,
                    }
                  }}
                >
                  <Box
                    className="category-icon"
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '20px',
                      background: `linear-gradient(135deg, ${category.color}, ${category.color}CC)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: `0 8px 25px ${category.color}40`,
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <category.icon sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                </Badge>
                
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}
                >
                  {category.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                  {category.description}
                </Typography>
                
                {/* Topic Tags */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {category.topics.slice(0, 3).map((topic, topicIndex) => (
                    <Chip
                      key={topicIndex}
                      label={topic}
                      size="small"
                      sx={{
                        bgcolor: 'transparent',
                        border: `1px solid ${category.color}40`,
                        color: category.color,
                        fontSize: '0.75rem',
                        '&:hover': {
                          bgcolor: `${category.color}15`,
                        }
                      }}
                    />
                  ))}
                  {category.topics.length > 3 && (
                    <Chip
                      label={`+${category.topics.length - 3} more`}
                      size="small"
                      sx={{
                        bgcolor: category.color,
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FAQ Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 8 }}>
            <FAQIcon 
              sx={{ 
                fontSize: 64, 
                color: '#CE0E2D', 
                mb: 3,
              }} 
            />
            <Typography
              variant="h3"
              gutterBottom
              sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '2rem', md: '2.5rem' } }}
            >
              Frequently Asked Questions
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', fontSize: '1.2rem' }}>
              Find instant answers to the most common questions about luxury auctions and platform features
            </Typography>
          </Box>

          <Box sx={{ maxWidth: 900, mx: 'auto' }}>
            {faqData.map((faq, index) => (
              <Accordion
                key={index}
                sx={{
                  mb: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  '&:before': {
                    display: 'none',
                  },
                  '&.Mui-expanded': {
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                    borderColor: '#CE0E2D',
                    '& .MuiAccordionSummary-root': {
                      bgcolor: '#CE0E2D05',
                    },
                  },
                  '&:hover': {
                    borderColor: '#CE0E2D40',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#CE0E2D' }} />}
                  sx={{
                    px: 4,
                    py: 2,
                    '& .MuiAccordionSummary-content': {
                      margin: '16px 0',
                      alignItems: 'center',
                    },
                    '&:hover': {
                      bgcolor: '#CE0E2D08',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, pr: 2 }}>
                      {faq.question}
                    </Typography>
                    <Chip 
                      label={faq.category}
                      size="small"
                      sx={{
                        bgcolor: '#CE0E2D15',
                        color: '#CE0E2D',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 4, pb: 4, pt: 0 }}>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      lineHeight: 1.8,
                      fontSize: '1rem',
                    }}
                  >
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Contact Support CTA */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #CE0E2D 0%, #B00C24 50%, #8A0A1C 100%)',
          py: 10,
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
            <SupportIcon 
              sx={{ 
                fontSize: 72, 
                color: 'white', 
                mb: 3,
                opacity: 0.9,
              }} 
            />
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                fontWeight: 800,
                color: 'white',
                mb: 3,
                fontSize: { xs: '2.5rem', md: '3rem' },
              }}
            >
              Still Need Help?
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(255, 255, 255, 0.95)',
                mb: 6,
                lineHeight: 1.6,
                maxWidth: 800,
                mx: 'auto',
                fontSize: { xs: '1.2rem', md: '1.5rem' },
              }}
            >
              Our expert Lebanese support team is standing by 24/7 to assist with auctions, 
              bidding strategies, and technical questions. Get personalized help within minutes.
            </Typography>
            
            <Grid container spacing={3} justifyContent="center" sx={{ mb: 6 }}>
              <Grid item>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                    15 sec
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Average Response
                  </Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                    24/7
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Expert Support
                  </Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                    99.8%
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Satisfaction Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="center"
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<SupportIcon />}
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
                onClick={() => handleQuickAction('Start Chat')}
              >
                Start Live Chat
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<ReceiptIcon />}
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
                onClick={() => router.push('/contact')}
              >
                Contact Support
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </HomepageLayout>
  );
}