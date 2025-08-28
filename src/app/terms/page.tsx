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
  Gavel as GavelIcon,
  Support as SupportIcon,
  Security as SecurityIcon,
  AccountBalance as LegalIcon,
} from '@mui/icons-material';

const termsHighlights = [
  {
    icon: GavelIcon,
    title: 'Auction Rules',
    description: 'Clear and fair rules governing all auction activities and bidding processes.',
  },
  {
    icon: LegalIcon,
    title: 'User Responsibilities',
    description: 'Your obligations as a platform user, including account security and conduct.',
  },
  {
    icon: SecurityIcon,
    title: 'Platform Security',
    description: 'Our commitment to maintaining a secure and trustworthy auction environment.',
  },
  {
    icon: SupportIcon,
    title: 'Support & Resolution',
    description: 'How we handle disputes, support requests, and issue resolution.',
  },
];

export default function TermsPage() {
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
              Terms of Service
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
              Fair and transparent rules for everyone
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

      {/* Terms Highlights */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            Key Terms Overview
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Understanding your rights and responsibilities on our platform.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, mb: 8 }}>
          {termsHighlights.map((highlight, index) => (
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
                  <highlight.icon sx={{ fontSize: 24, color: 'white' }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                  >
                    {highlight.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {highlight.description}
                  </Typography>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Terms Content */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="md">
          <Stack spacing={6}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                1. Acceptance of Terms
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                By accessing and using Sassy ("the Platform"), you accept and agree to be bound by 
                these Terms of Service. If you do not agree to these terms, please do not use our 
                platform. These terms apply to all users, including browsers, vendors, customers, 
                merchants, and contributors of content.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                2. Account Registration and Security
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                To participate in auctions, you must create an account with accurate and complete information.
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Account Accuracy"
                    secondary="You must provide accurate, current, and complete information during registration"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Security Responsibility"
                    secondary="You are responsible for maintaining the confidentiality of your account credentials"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Age Requirement"
                    secondary="You must be at least 18 years old to create an account and participate in auctions"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Account Verification"
                    secondary="We may require identity verification for certain features or high-value transactions"
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                3. Auction Rules and Bidding
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                All auctions on our platform are governed by the following rules:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Binding Bids"
                    secondary="All bids placed are legally binding commitments to purchase at the bid amount"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Auction End Time"
                    secondary="Auctions end at the specified time, and the highest valid bid wins"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Reserve Prices"
                    secondary="Some auctions may have reserve prices that must be met for the item to be sold"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Bid Increments"
                    secondary="Bids must meet the minimum increment requirements set for each auction"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Payment Terms"
                    secondary="Winning bidders must complete payment within 48 hours of auction end"
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                4. User Conduct and Prohibited Activities
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                Users must conduct themselves professionally and ethically. The following activities are prohibited:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Fraudulent Activity"
                    secondary="Any form of fraud, misrepresentation, or deceptive practices"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Bid Manipulation"
                    secondary="Shill bidding, bid retraction without valid reason, or other bid manipulation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Harassment"
                    secondary="Harassment, abuse, or threatening behavior toward other users or staff"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="System Abuse"
                    secondary="Attempting to circumvent security measures or disrupt platform operations"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Illegal Items"
                    secondary="Listing or bidding on illegal, stolen, or prohibited items"
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                5. Fees and Payments
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                Our fee structure is transparent and clearly communicated:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Buyer's Premium"
                    secondary="A buyer's premium may be added to the final hammer price"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Seller's Commission"
                    secondary="Sellers pay a commission based on the final sale price"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Payment Processing"
                    secondary="Payment processing fees may apply depending on the payment method used"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Fee Changes"
                    secondary="We reserve the right to modify fees with 30 days' notice to users"
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                6. Intellectual Property
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                The Sassy platform, including its design, features, and content, is protected by intellectual 
                property laws. Users retain ownership of content they upload but grant us a license to use, 
                display, and distribute such content in connection with our services. Users may not copy, 
                modify, or distribute our platform or its content without explicit permission.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                7. Limitation of Liability
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Sassy provides the platform "as is" and makes no warranties regarding its availability, 
                accuracy, or fitness for a particular purpose. We are not liable for any indirect, 
                incidental, or consequential damages arising from your use of the platform. Our total 
                liability is limited to the fees paid by you in the 12 months preceding any claim.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                8. Dispute Resolution
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                We are committed to resolving disputes fairly and efficiently:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Direct Resolution"
                    secondary="We encourage users to resolve disputes directly through our messaging system"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Mediation Support"
                    secondary="Our support team can provide mediation assistance for complex disputes"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Binding Arbitration"
                    secondary="Unresolved disputes may be subject to binding arbitration"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Governing Law"
                    secondary="These terms are governed by the laws of the jurisdiction where we operate"
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                9. Changes to Terms
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                We reserve the right to modify these Terms of Service at any time. Changes will be 
                effective immediately upon posting, and we will notify users of significant changes 
                via email or platform notification. Continued use of the platform after changes 
                constitutes acceptance of the modified terms.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                10. Contact Information
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                For questions about these Terms of Service or any legal matters, please contact us:
              </Typography>
              <Card sx={{ p: 3, bgcolor: 'action.hover' }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Legal Department:</strong> legal@sassy.com
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Address:</strong> 123 Auction Street, Business City, BC 12345
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Phone:</strong> +1 (555) 123-4567
                </Typography>
                <Typography variant="body1">
                  <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM EST
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
              Questions About Our Terms?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 4,
                lineHeight: 1.5,
              }}
            >
              Our legal team is available to help clarify any questions about 
              these terms or your rights and responsibilities.
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
              Contact Legal Team
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}