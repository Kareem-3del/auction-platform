'use client';

import {
  Box,
  Card,
  List,
  Stack,
  Button,
  ListItem,
  useTheme,
  Container,
  Typography,
  ListItemText,
} from '@mui/material';
import {
  Lock as LockIcon,
  Shield as ShieldIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const privacyPrinciples = [
  {
    icon: SecurityIcon,
    title: 'Data Security',
    description: 'We use industry-standard encryption and security measures to protect your personal information.',
  },
  {
    icon: ShieldIcon,
    title: 'Privacy Protection',
    description: 'Your personal data is never sold to third parties without your explicit consent.',
  },
  {
    icon: LockIcon,
    title: 'Secure Storage',
    description: 'All data is stored in secure, encrypted databases with regular security audits.',
  },
  {
    icon: VisibilityIcon,
    title: 'Transparency',
    description: 'We are transparent about what data we collect and how we use it.',
  },
];

export default function PrivacyPage() {
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
              Privacy Policy
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: theme.palette.mode === 'dark' ? 'common.white' : 'white',
                mb: 2,
                maxWidth: 800,
                mx: 'auto',
                lineHeight: 1.4,
              }}
            >
              Your privacy is our priority
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.mode === 'dark' ? 'grey.300' : 'rgba(255, 255, 255, 0.8)',
                maxWidth: 600,
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Last updated: {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Privacy Principles */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            Our Privacy Principles
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            We are committed to protecting your privacy and being transparent about our practices.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, mb: 8 }}>
          {privacyPrinciples.map((principle, index) => (
            <Card
              key={index}
              sx={{
                p: 4,
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
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <principle.icon sx={{ fontSize: 24, color: 'white' }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                  >
                    {principle.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {principle.description}
                  </Typography>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Privacy Policy Content */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="md">
          <Stack spacing={6}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Information We Collect
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                We collect information you provide directly to us, such as when you create an account, 
                participate in auctions, or contact us for support.
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Account Information"
                    secondary="Name, email address, phone number, and profile details"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Auction Activity"
                    secondary="Bidding history, watchlists, and purchase records"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Payment Information"
                    secondary="Billing address and payment method details (securely processed by third parties)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Communication Data"
                    secondary="Messages, support requests, and feedback you send to us"
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                How We Use Your Information
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                We use the information we collect to provide, maintain, and improve our services.
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Service Operation"
                    secondary="To provide auction services, process bids, and facilitate transactions"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Account Management"
                    secondary="To create and manage your account, verify your identity, and provide customer support"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Communications"
                    secondary="To send you auction updates, notifications, and important service announcements"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Improvements"
                    secondary="To analyze usage patterns and improve our platform and services"
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Information Sharing
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                We do not sell, trade, or rent your personal information to third parties. We may share 
                your information only in the following circumstances:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Service Providers"
                    secondary="With trusted third parties who help us operate our platform (payment processors, hosting services)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Legal Requirements"
                    secondary="When required by law, court order, or to protect our rights and safety"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Business Transfers"
                    secondary="In connection with any merger, sale of assets, or acquisition of our business"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="With Your Consent"
                    secondary="When you explicitly agree to share information for specific purposes"
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Your Rights and Choices
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                You have several rights regarding your personal information:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Access and Update"
                    secondary="You can access and update your account information at any time through your profile settings"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Data Deletion"
                    secondary="You can request deletion of your account and personal data by contacting our support team"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Marketing Communications"
                    secondary="You can opt out of marketing communications by following the unsubscribe links in our emails"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Data Portability"
                    secondary="You can request a copy of your personal data in a portable format"
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Data Security
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. This includes 
                encryption of data in transit and at rest, regular security audits, and access controls. 
                However, no method of transmission over the internet or electronic storage is 100% secure, 
                so we cannot guarantee absolute security.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Contact Us
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </Typography>
              <Card sx={{ p: 3, bgcolor: 'action.hover' }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Email:</strong> privacy@sassy.com
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Address:</strong> 123 Auction Street, Business City, BC 12345
                </Typography>
                <Typography variant="body1">
                  <strong>Phone:</strong> +1 (555) 123-4567
                </Typography>
              </Card>
            </Box>
          </Stack>
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
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'white',
                mb: 2,
              }}
            >
              Questions About Your Privacy?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 4,
                lineHeight: 1.5,
              }}
            >
              Our privacy team is here to help. Contact us anytime with questions 
              or concerns about your personal data.
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
              Contact Privacy Team
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}