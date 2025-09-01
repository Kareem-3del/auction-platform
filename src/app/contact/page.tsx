'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  useTheme,
  Container,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Breadcrumbs,
  Link,
  Chip,
  Badge,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  ContactSupport as SupportIcon,
  Send as SendIcon,
  Business as BusinessIcon,
  Help as HelpIcon,
  QuestionAnswer as ChatIcon,
  Home as HomeIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

import HomepageLayout from 'src/components/layout/HomepageLayout';
import { useRouter } from 'next/navigation';
import { useLocale } from 'src/hooks/useLocale';

const contactMethods = [
  {
    icon: PhoneIcon,
    title: 'Lebanese Support Hotline',
    description: 'Direct line to our Beirut office - Arabic & English support',
    contact: '+961 1 234 567',
    responseTime: 'Available 9AM-9PM Beirut Time',
    color: '#22C55E',
    badge: 'Local Team',
  },
  {
    icon: WhatsAppIcon,
    title: 'WhatsApp Business',
    description: 'Quick support via WhatsApp for urgent auction questions',
    contact: '+961 70 123 456',
    responseTime: 'Response within 15 minutes',
    color: '#25D366',
    badge: 'Instant',
  },
  {
    icon: ChatIcon,
    title: 'Live Chat Support',
    description: '24/7 live chat with auction experts and technical support',
    contact: 'Available on all pages',
    responseTime: 'Average 30 seconds',
    color: '#1976D2',
    badge: '24/7',
  },
  {
    icon: EmailIcon,
    title: 'Email Support',
    description: 'Comprehensive support for complex inquiries and documentation',
    contact: 'support@lebanonauction.com',
    responseTime: 'Within 6 hours',
    color: '#CE0E2D',
    badge: 'Detailed Help',
  },
  {
    icon: BusinessIcon,
    title: 'VIP & Business Services',
    description: 'Dedicated account management for high-value collectors and dealers',
    contact: 'vip@lebanonauction.com',
    responseTime: 'Priority response within 1 hour',
    color: '#9C27B0',
    badge: 'Premium',
  },
  {
    icon: ScheduleIcon,
    title: 'Schedule Consultation',
    description: 'Book a video call with our auction experts and appraisers',
    contact: 'Free 30-minute sessions',
    responseTime: 'Same day booking available',
    color: '#FF9800',
    badge: 'Expert Call',
  },
];

const officeInfo = {
  address: {
    street: 'Hamra Street, Sakakini Building, 4th Floor',
    city: 'Beirut',
    country: 'Lebanon',
    postal: '1103 2080',
  },
  hours: {
    weekdays: 'Monday - Friday: 9:00 AM - 9:00 PM',
    saturday: 'Saturday: 10:00 AM - 6:00 PM',
    sunday: 'Sunday: 12:00 PM - 6:00 PM',
  },
  phone: '+961 1 234 567',
  email: 'info@lebanonauction.com',
  whatsapp: '+961 70 123 456',
};

const inquiryTypes = [
  'General Inquiry',
  'Bidding Support',
  'Authentication Questions',
  'Payment & Wallet Issues',
  'Account Management',
  'Luxury Item Appraisal',
  'VIP Services',
  'Business Partnership',
  'Technical Support',
  'Complaint or Feedback',
];

export default function ContactPage() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    inquiryType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would send this to your API
      console.log('Form submitted:', formData);
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        inquiryType: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.subject && formData.message;

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
              <Typography sx={{ color: 'white', fontWeight: 500 }}>Contact Us</Typography>
            </Breadcrumbs>

            <Box textAlign="center">
              <SupportIcon 
                sx={{ 
                  fontSize: 72, 
                  color: 'white', 
                  mb: 3,
                  opacity: 0.9,
                }} 
              />
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
{t('contact.title', 'Get In Touch')}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  mb: 6,
                  maxWidth: 800,
                  mx: 'auto',
                  lineHeight: 1.6,
                  fontSize: { xs: '1.3rem', md: '1.6rem' },
                }}
              >
{t('contact.subtitle', 'Our Lebanese expert team is here to assist with luxury auctions, authentication questions, and personalized collector services.')}
              </Typography>

              {/* Quick Contact Stats */}
              <Grid container spacing={4} justifyContent="center" sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                      24/7
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Support Available
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                      15 sec
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Average Response
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                      6
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Contact Methods
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                      Arabic
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      & English Support
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Contact Methods */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography
          variant="h3"
          textAlign="center"
          gutterBottom
          sx={{ fontWeight: 700, mb: 8, color: 'text.primary' }}
        >
          Choose Your Preferred Contact Method
        </Typography>
        
        <Grid container spacing={4}>
          {contactMethods.map((method, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  border: `2px solid transparent`,
                  borderRadius: 4,
                  position: 'relative',
                  cursor: 'pointer',
                  background: `linear-gradient(135deg, ${method.color}08, ${method.color}04)`,
                  transition: 'all 0.4s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: `0 20px 60px ${method.color}25`,
                    borderColor: method.color,
                    '& .method-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  },
                }}
              >
                <Badge
                  badgeContent={method.badge}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: method.color,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      right: -10,
                      top: -5,
                    }
                  }}
                >
                  <Box
                    className="method-icon"
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '20px',
                      background: `linear-gradient(135deg, ${method.color}, ${method.color}CC)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: `0 8px 25px ${method.color}40`,
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <method.icon sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                </Badge>
                
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}
                >
                  {method.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                  {method.description}
                </Typography>
                
                <Chip
                  label={method.contact}
                  sx={{
                    bgcolor: method.color,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    mb: 2,
                    px: 1,
                  }}
                />
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontStyle: 'italic',
                  }}
                >
                  {method.responseTime}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Contact Form & Office Info */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            {/* Contact Form */}
            <Grid item xs={12} md={8}>
              <Card
                sx={{
                  p: 4,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                }}
              >
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h4"
                    gutterBottom
                    sx={{ fontWeight: 700, color: 'text.primary' }}
                  >
                    Send us a Message
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </Typography>
                </Box>

                {submitStatus === 'success' && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Thank you for your message! We'll get back to you within 24 hours.
                  </Alert>
                )}

                {submitStatus === 'error' && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    Something went wrong. Please try again or contact us directly.
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Your Name"
                        variant="outlined"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        disabled={isSubmitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        disabled={isSubmitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Subject"
                        variant="outlined"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        required
                        disabled={isSubmitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Inquiry Type</InputLabel>
                        <Select
                          value={formData.inquiryType}
                          label="Inquiry Type"
                          onChange={(e) => handleInputChange('inquiryType', e.target.value)}
                          disabled={isSubmitting}
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          {inquiryTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Message"
                        variant="outlined"
                        multiline
                        rows={5}
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        required
                        disabled={isSubmitting}
                        placeholder="Please describe your question or issue in detail..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={!isFormValid || isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                          fontWeight: 600,
                          backgroundColor: '#CE0E2D',
                          '&:hover': {
                            backgroundColor: '#B00C24',
                            transform: 'translateY(-1px)',
                          },
                          '&:disabled': {
                            backgroundColor: 'rgba(206, 14, 45, 0.5)',
                          },
                          transition: 'all 0.3s ease-in-out',
                        }}
                      >
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Grid>

            {/* Office Info */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Office Location */}
                <Card
                  sx={{
                    p: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationIcon sx={{ color: '#CE0E2D', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Our Office
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {officeInfo.address.street}<br />
                    {officeInfo.address.city}, {officeInfo.address.postal}<br />
                    {officeInfo.address.country}
                  </Typography>
                </Card>

                {/* Contact Info */}
                <Card
                  sx={{
                    p: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon sx={{ color: '#CE0E2D', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Contact Details
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Phone
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {officeInfo.phone}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Email
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {officeInfo.email}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                {/* Business Hours */}
                <Card
                  sx={{
                    p: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimeIcon sx={{ color: '#CE0E2D', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Business Hours
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      {officeInfo.hours.weekdays}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {officeInfo.hours.saturday}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {officeInfo.hours.sunday}
                    </Typography>
                  </Stack>
                </Card>

                {/* Quick Help */}
                <Card
                  sx={{
                    p: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(206, 14, 45, 0.05) 0%, rgba(176, 12, 36, 0.05) 100%)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <HelpIcon sx={{ color: '#CE0E2D', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Need Quick Help?
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Visit our help center for instant answers to common questions.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.location.href = '/help'}
                    sx={{
                      borderColor: '#CE0E2D',
                      color: '#CE0E2D',
                      '&:hover': {
                        backgroundColor: '#CE0E2D',
                        color: 'white',
                      },
                    }}
                  >
                    Visit Help Center
                  </Button>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FAQ Quick Links */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            Common Questions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Looking for quick answers? Check out these popular topics.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                p: 3,
                textAlign: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => window.location.href = '/help'}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                How to Bid
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Learn the auction process
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                p: 3,
                textAlign: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => window.location.href = '/help'}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Payment Methods
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accepted payment options
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                p: 3,
                textAlign: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => window.location.href = '/help'}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Account Issues
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Login & account help
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                p: 3,
                textAlign: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => window.location.href = '/help'}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Shipping Info
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Delivery & shipping details
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </HomepageLayout>
  );
}