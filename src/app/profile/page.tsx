'use client';

import { useState, useEffect } from 'react';

import {
  Box,
  Tab,
  Grid,
  Card,
  Chip,
  Tabs,
  List,
  Paper,
  Stack,
  Alert,
  Avatar,
  Button,
  Switch,
  ListItem,
  TextField,
  Typography,
  CardContent,
  ListItemText,
  ListItemIcon,
  FormControlLabel,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Fade,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  VolumeUp as VolumeUpIcon,
  PlayArrow as PlayArrowIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as WalletIcon,
  Notifications as NotificationsIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  BusinessCenter as BusinessIcon,
  MonetizationOn as MoneyIcon,
  Analytics as AnalyticsIcon,
  School as CertificationIcon,
  Loyalty as LoyaltyIcon,
  WorkspacePremium as PremiumIcon,
} from '@mui/icons-material';

import { useAuth, getAccessToken } from 'src/hooks/useAuth';
import { useLocale } from 'src/hooks/useLocale';

import { formatDate, formatCurrency } from 'src/lib/utils';
import { useNotifications } from 'src/contexts/NotificationContext';

import Layout from 'src/components/layout/Layout';
import ImageUpload from 'src/components/common/ImageUpload';
import BinanceLogo from 'src/components/icons/BinanceLogo';
import WhishLogo from 'src/components/icons/WhishLogo';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isAnonymousDisplay: boolean;
  anonymousDisplayName: string;
  anonymousAvatarUrl?: string;
  userType: string;
  kycStatus: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  balanceReal: number;
  balanceVirtual: number;
  virtualMultiplier: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  agent?: {
    id: string;
    businessName: string;
    displayName: string;
    bio?: string;
    logoUrl?: string;
    status: string;
    rating?: number;
    reviewCount: number;
    totalSales: number;
    totalAuctions: number;
    successfulAuctions: number;
  };
  stats: {
    activeBids: number;
    auctionsWon: number;
    watchedAuctions: number;
    totalSpent: number;
  };
  transactions: Array<{
    id: string;
    transactionType: string;
    amountReal: number;
    amountVirtual: number;
    status: string;
    createdAt: string;
    description: string;
  }>;
  bids: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    product: {
      id: string;
      title: string;
      auctionStatus: string;
      endTime: string;
    };
  }>;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  isAnonymousDisplay: boolean;
  avatarUrl?: string;
}

// Enhanced Stats Card Component
function ModernStatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  sparkline
}: {
  title: string;
  value: string | number;
  icon: any;
  subtitle?: string;
  sparkline?: boolean;
}) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: theme.palette.action.hover,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${theme.palette.divider}`,
            }}
          >
            <Icon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
          </Box>
        </Box>
        <Typography variant="h3" fontWeight="bold" color="primary.main" mb={1}>
          {value}
        </Typography>
        <Typography variant="h6" fontWeight={600} color="text.primary" mb={0.5}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {sparkline && (
          <Box mt={2}>
            <LinearProgress
              variant="determinate"
              value={75}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: theme.palette.action.hover,
                '& .MuiLinearProgress-bar': {
                  bgcolor: theme.palette.primary.main,
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Modern Profile Header Component
function ModernProfileHeader({ profile, editing, onEdit }: {
  profile: UserProfile;
  editing: boolean;
  onEdit: () => void;
}) {
  const theme = useTheme();

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'SUPER_ADMIN': return <LoyaltyIcon />;
      case 'ADMIN': return <PremiumIcon />;
      case 'AGENT': return <BusinessIcon />;
      default: return <PersonIcon />;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'SUPER_ADMIN': return theme.palette.error.main;
      case 'ADMIN': return theme.palette.secondary.main;
      case 'AGENT': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        mb: 4,
      }}
    >
      <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
              <Box position="relative" mb={2}>
                <Avatar
                  src={profile.isAnonymousDisplay ? profile.anonymousAvatarUrl : profile.avatarUrl}
                  sx={{
                    width: 120,
                    height: 120,
                    border: '4px solid white',
                    boxShadow: theme.shadows[8],
                    mb: 2,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: getUserTypeColor(profile.userType),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid white',
                        boxShadow: theme.shadows[3],
                      }}
                    >
                      {getUserTypeIcon(profile.userType)}
                    </Box>
                  }
                />
              </Box>

              <Typography variant="h4" fontWeight="bold" mb={1}>
                {profile.isAnonymousDisplay
                  ? profile.anonymousDisplayName
                  : `${profile.firstName} ${profile.lastName}`}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip
                  label={profile.userType}
                  sx={{
                    bgcolor: getUserTypeColor(profile.userType),
                    color: 'white',
                    fontWeight: 600,
                    border: '2px solid rgba(255,255,255,0.3)',
                  }}
                />
                {profile.emailVerified && (
                  <Tooltip title="Verified Account">
                    <VerifiedIcon sx={{ color: theme.palette.success.main, fontSize: 24 }} />
                  </Tooltip>
                )}
              </Box>

              {!editing && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={onEdit}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight="bold" mb={1}>
                    {profile.stats.activeBids}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Bids
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight="bold" mb={1}>
                    {profile.stats.auctionsWon}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Auctions Won
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight="bold" mb={1}>
                    {profile.stats.watchedAuctions}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Watching
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight="bold" mb={1}>
                    {formatCurrency(profile.stats.totalSpent)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Spent
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.2)' }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <EmailIcon sx={{ opacity: 0.7 }} />
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>Email</Typography>
                    <Typography variant="body1" fontWeight={500}>{profile.email}</Typography>
                  </Box>
                </Box>
              </Grid>
              {profile.phone && (
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <PhoneIcon sx={{ opacity: 0.7 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>Phone</Typography>
                      <Typography variant="body1" fontWeight={500}>{profile.phone}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <CertificationIcon sx={{ opacity: 0.7 }} />
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>KYC Status</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {profile.kycStatus.replace('_', ' ')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <HistoryIcon sx={{ opacity: 0.7 }} />
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>Member Since</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(profile.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ChargeTab component for wallet charging functionality
function ChargeTab({ profile, onBalanceUpdate }: { profile: UserProfile; onBalanceUpdate: () => void }) {
  const theme = useTheme();
  const { t } = useLocale();
  const [chargeAmount, setChargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'binance' | 'whish' | null>(null);

  const predefinedAmounts = [10, 25, 50, 100, 250, 500];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setChargeAmount(amount.toString());
    setError(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setChargeAmount(value);
    setSelectedAmount(null);
    setError(null);
  };

  const validateAmount = (amount: number) => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (amount < 1) {
      setError('Minimum amount is $1');
      return false;
    }

    if (amount > 10000) {
      setError('Maximum amount is $10,000');
      return false;
    }

    return true;
  };

  const handleBinanceCharge = async () => {
    const amount = parseFloat(chargeAmount);
    if (!validateAmount(amount)) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = getAccessToken();
      if (!token) {
        setError('Please login to continue');
        return;
      }

      const response = await fetch('/api/binance/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Wallet recharged successfully via Binance');
        setChargeAmount('');
        setSelectedAmount(null);
        setSelectedPaymentMethod(null);
        setTimeout(() => {
          onBalanceUpdate();
        }, 500);
      } else {
        setError(data.error?.message || 'Recharge failed');
      }
    } catch (err) {
      setError('Recharge failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWhishCharge = async () => {
    const amount = parseFloat(chargeAmount);
    if (!validateAmount(amount)) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = getAccessToken();
      if (!token) {
        setError('Please login to continue');
        return;
      }

      const response = await fetch('/api/whish/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Wallet recharged successfully via Whish.money');
        setChargeAmount('');
        setSelectedAmount(null);
        setSelectedPaymentMethod(null);
        setTimeout(() => {
          onBalanceUpdate();
        }, 500);
      } else {
        setError(data.error?.message || 'Recharge failed');
      }
    } catch (err) {
      setError('Recharge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} lg={4}>
          <ModernStatsCard
            title="Current Balance"
            value={formatCurrency(profile.balanceReal)}
            icon={WalletIcon}
            subtitle={`Virtual: ${formatCurrency(profile.balanceReal * profile.virtualMultiplier)}`}
          />
        </Grid>

        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            <Card sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Choose Payment Method
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: selectedPaymentMethod === 'binance' ? `2px solid ${theme.palette.warning.main}` : `1px solid ${theme.palette.divider}`,
                      background: selectedPaymentMethod === 'binance'
                        ? theme.palette.action.selected
                        : 'transparent',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        borderColor: theme.palette.warning.main,
                      },
                    }}
                    onClick={() => setSelectedPaymentMethod('binance')}
                  >
                    <Box display="flex" alignItems="center" mb={2}>
                      <BinanceLogo sx={{ fontSize: 32, mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Binance Pay
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Fast and secure crypto payments with low fees
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color={theme.palette.warning.main} fontWeight={600}>
                        Instant Processing • 0.1% Fee
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: selectedPaymentMethod === 'whish' ? `2px solid ${theme.palette.secondary.main}` : `1px solid ${theme.palette.divider}`,
                      background: selectedPaymentMethod === 'whish'
                        ? theme.palette.action.selected
                        : 'transparent',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        borderColor: theme.palette.secondary.main,
                      },
                    }}
                    onClick={() => setSelectedPaymentMethod('whish')}
                  >
                    <Box display="flex" alignItems="center" mb={2}>
                      <WhishLogo sx={{ fontSize: 32, mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Whish.money
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Modern payment solution with instant transfers
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color={theme.palette.secondary.main} fontWeight={600}>
                        Instant Processing • 2.5% Fee
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Card>

            {selectedPaymentMethod && (
              <Card sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Select Amount
                </Typography>

                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Quick Select
                </Typography>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {predefinedAmounts.map((amount) => (
                    <Grid item xs={6} sm={4} md={2} key={amount}>
                      <Button
                        variant={selectedAmount === amount ? 'contained' : 'outlined'}
                        fullWidth
                        onClick={() => handleAmountSelect(amount)}
                        sx={{
                          py: 2,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      >
                        ${amount}
                      </Button>
                    </Grid>
                  ))}
                </Grid>

                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Custom Amount
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Enter amount in USD"
                  value={chargeAmount}
                  onChange={handleCustomAmountChange}
                  sx={{ mb: 4 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, fontWeight: 600 }}>$</Typography>,
                  }}
                />

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={selectedPaymentMethod === 'binance' ? handleBinanceCharge : handleWhishCharge}
                  disabled={loading || !chargeAmount || parseFloat(chargeAmount) <= 0}
                  sx={{
                    py: 2,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    borderRadius: 3,
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 2, color: 'white' }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      {selectedPaymentMethod === 'binance' ? (
                        <BinanceLogo sx={{ fontSize: 24, mr: 2 }} />
                      ) : (
                        <WhishLogo sx={{ fontSize: 24, mr: 2 }} />
                      )}
                      Charge ${chargeAmount || '0'} via {selectedPaymentMethod === 'binance' ? 'Binance' : 'Whish.money'}
                    </>
                  )}
                </Button>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function ProfilePage() {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const notificationContext = useNotifications();
  const { t } = useLocale();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [editing, setEditing] = useState(false);
  const [playingSound, setPlayingSound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    isAnonymousDisplay: true,
    avatarUrl: '',
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState(false);

  // Hash navigation
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const tabMap: { [key: string]: number } = {
      'overview': 0,
      'transactions': 1,
      'bids': 2,
      'wallet': 3,
      'notifications': 4,
      'agent': 5,
    };

    if (hash && tabMap[hash] !== undefined) {
      setTabValue(tabMap[hash]);
    }
  }, []);

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
    const tabNames = ['overview', 'transactions', 'bids', 'wallet', 'notifications', 'agent'];
    window.location.hash = tabNames[newValue];
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
    }
  }, [authLoading, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        setError('Please login to continue');
        return;
      }

      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data.success) {
        const profileData = {
          ...data.data.profile,
          balanceReal: Number(data.data.profile.balanceReal || 0),
          balanceVirtual: Number(data.data.profile.balanceVirtual || 0),
          virtualMultiplier: Number(data.data.profile.virtualMultiplier || 1),
        };
        setProfile(profileData);
        setFormData({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          phone: profileData.phone || '',
          isAnonymousDisplay: profileData.isAnonymousDisplay || false,
          avatarUrl: profileData.avatarUrl || '',
        });
        setProfileImageUrl(profileData.avatarUrl || null);
      } else {
        setError(data.error?.message || 'Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = getAccessToken();
      if (!token) {
        setError('Please login to continue');
        return;
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, avatarUrl: profileImageUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile({ ...profile!, ...data.data.profile });
        setSuccess('Profile updated successfully');
        setEditing(false);
      } else {
        setError(data.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        isAnonymousDisplay: profile.isAnonymousDisplay || false,
        avatarUrl: profile.avatarUrl || '',
      });
      setProfileImageUrl(profile.avatarUrl || null);
    }
    setEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateNotificationPreference = async (key: string, value: boolean) => {
    try {
      setSavingNotifications(true);
      setError(null);

      if (notificationContext && notificationContext.updatePreferences) {
        await notificationContext.updatePreferences({ [key]: value });
        setSuccess('Notification preferences updated');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Notification preferences not available');
      }
    } catch (err) {
      setError('Failed to update notification preferences');
      setNotificationError(true);
    } finally {
      setSavingNotifications(false);
    }
  };

  const handlePlayNotificationSound = async () => {
    if (playingSound) return;

    try {
      setPlayingSound(true);
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.7;

      await audio.play();
      audio.onended = () => setPlayingSound(false);
      audio.onerror = () => {
        setPlayingSound(false);
        setError('Could not play notification sound');
        setTimeout(() => setError(null), 3000);
      };
    } catch (err) {
      setPlayingSound(false);
      setError('Could not play notification sound');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4, mb: 4 }} />
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 3 }} />
                  <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 3 }} />
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error">Failed to load profile</Alert>
        </Container>
      </Layout>
    );
  }

  const calculatedVirtualBalance = profile.balanceReal * profile.virtualMultiplier;

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <ModernProfileHeader
          profile={profile}
          editing={editing}
          onEdit={() => setEditing(true)}
        />

        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Balance Cards */}
              <ModernStatsCard
                title="Real Balance"
                value={formatCurrency(profile.balanceReal)}
                icon={WalletIcon}
                sparkline
              />

              <ModernStatsCard
                title="Virtual Balance"
                value={formatCurrency(calculatedVirtualBalance)}
                icon={TrendingUpIcon}
                subtitle={`Real Balance $${profile.balanceReal.toFixed(2)} × Multiplier ${profile.virtualMultiplier}x`}
              />
            </Stack>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            {editing ? (
              <Card sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Edit Profile
                </Typography>

                <Box mb={4}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Profile Picture
                  </Typography>
                  <ImageUpload
                    currentImageUrl={profileImageUrl || undefined}
                    onImageChange={setProfileImageUrl}
                    uploadType="profile"
                    variant="avatar"
                    size="large"
                    allowRemove
                  />
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isAnonymousDisplay}
                          onChange={(e) => setFormData({ ...formData, isAnonymousDisplay: e.target.checked })}
                        />
                      }
                      label="Display name anonymously in auctions"
                    />
                  </Grid>
                </Grid>

                <Box mt={4} display="flex" gap={2}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                    sx={{ borderRadius: 2 }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                    disabled={saving}
                    sx={{ borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Card>
            ) : (
              <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Tabs
                  value={tabValue}
                  onChange={(_, newValue) => handleTabChange(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 2,
                    '& .MuiTab-root': {
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      minHeight: 64,
                    },
                  }}
                >
                  <Tab label="Overview" />
                  <Tab label="Transactions" />
                  <Tab label="Bid History" />
                  <Tab label="Charge Wallet" />
                  <Tab label="Notifications" />
                  {profile.agent && <Tab label="Agent Profile" />}
                </Tabs>

                <Box p={4}>
                  {/* Overview Tab */}
                  {tabValue === 0 && (
                    <Grid container spacing={4}>
                      <Grid item xs={12} md={6}>
                        <ModernStatsCard
                          title="Active Bids"
                          value={profile.stats.activeBids}
                          icon={GavelIcon}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <ModernStatsCard
                          title="Auctions Won"
                          value={profile.stats.auctionsWon}
                          icon={StarIcon}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" fontWeight={600} mb={2}>
                            Account Information
                          </Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Email Status
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body1">{profile.email}</Typography>
                                  {profile.emailVerified && (
                                    <VerifiedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                  )}
                                </Box>
                              </Box>
                            </Grid>
                            {profile.phone && (
                              <Grid item xs={12} sm={6}>
                                <Box>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Phone Status
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body1">{profile.phone}</Typography>
                                    {profile.phoneVerified && (
                                      <VerifiedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                    )}
                                  </Box>
                                </Box>
                              </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  KYC Status
                                </Typography>
                                <Chip
                                  label={profile.kycStatus.replace('_', ' ')}
                                  color={getStatusColor(profile.kycStatus)}
                                  size="small"
                                />
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Last Login
                                </Typography>
                                <Typography variant="body1">
                                  {profile.lastLoginAt ? formatDate(profile.lastLoginAt) : 'Never'}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Card>
                      </Grid>
                    </Grid>
                  )}

                  {/* Transactions Tab */}
                  {tabValue === 1 && (
                    <Box>
                      <Typography variant="h6" fontWeight={600} mb={3}>
                        Recent Transactions
                      </Typography>
                      {profile.transactions.length > 0 ? (
                        <Stack spacing={2}>
                          {profile.transactions.map((transaction) => (
                            <Card key={transaction.id} variant="outlined" sx={{ p: 3 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography variant="body1" fontWeight={600}>
                                    {transaction.description || transaction.transactionType}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDate(transaction.createdAt)}
                                  </Typography>
                                </Box>
                                <Box textAlign="right">
                                  <Typography variant="h6" color="primary.main">
                                    {formatCurrency(transaction.amountReal)}
                                  </Typography>
                                  <Chip
                                    label={transaction.status}
                                    color={getStatusColor(transaction.status)}
                                    size="small"
                                  />
                                </Box>
                              </Box>
                            </Card>
                          ))}
                        </Stack>
                      ) : (
                        <Box textAlign="center" py={6}>
                          <MoneyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            No transactions yet
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Bid History Tab */}
                  {tabValue === 2 && (
                    <Box>
                      <Typography variant="h6" fontWeight={600} mb={3}>
                        Bid History
                      </Typography>
                      {profile.bids.length > 0 ? (
                        <Stack spacing={2}>
                          {profile.bids.map((bid) => (
                            <Card key={bid.id} variant="outlined" sx={{ p: 3 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography variant="body1" fontWeight={600}>
                                    {bid.product.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Placed: {formatDate(bid.createdAt)}
                                  </Typography>
                                </Box>
                                <Box textAlign="right">
                                  <Typography variant="h6" color="primary.main">
                                    {formatCurrency(bid.amount)}
                                  </Typography>
                                  <Box display="flex" gap={1} justifyContent="flex-end">
                                    <Chip
                                      label={bid.status}
                                      color={getStatusColor(bid.status)}
                                      size="small"
                                    />
                                    <Chip
                                      label={bid.product.auctionStatus}
                                      color={getStatusColor(bid.product.auctionStatus)}
                                      size="small"
                                    />
                                  </Box>
                                </Box>
                              </Box>
                            </Card>
                          ))}
                        </Stack>
                      ) : (
                        <Box textAlign="center" py={6}>
                          <GavelIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            No bids yet
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Charge Tab */}
                  {tabValue === 3 && (
                    <ChargeTab profile={profile} onBalanceUpdate={fetchProfile} />
                  )}

                  {/* Notifications Tab */}
                  {tabValue === 4 && (
                    <Box>
                      <Typography variant="h6" fontWeight={600} mb={3}>
                        Notification Preferences
                      </Typography>
                      {notificationError ? (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                          Notification preferences are currently unavailable. Please try again later.
                        </Alert>
                      ) : notificationContext && notificationContext.preferences ? (
                        <Stack spacing={3}>
                          <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box display="flex" alignItems="center" gap={2}>
                                <VolumeUpIcon color="primary" />
                                <Box>
                                  <Typography variant="body1" fontWeight={600}>
                                    Sound Notifications
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Play sounds for new notifications
                                  </Typography>
                                </Box>
                              </Box>
                              <Switch
                                checked={notificationContext.preferences.notificationSoundEnabled}
                                onChange={(e) => handleUpdateNotificationPreference('notificationSoundEnabled', e.target.checked)}
                                disabled={savingNotifications}
                              />
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PlayArrowIcon />}
                              onClick={handlePlayNotificationSound}
                              disabled={playingSound}
                              sx={{ mt: 2 }}
                            >
                              {playingSound ? 'Playing...' : 'Test Sound'}
                            </Button>
                          </Card>

                          <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box display="flex" alignItems="center" gap={2}>
                                <EmailIcon color="primary" />
                                <Box>
                                  <Typography variant="body1" fontWeight={600}>
                                    Email Notifications
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Receive notifications via email
                                  </Typography>
                                </Box>
                              </Box>
                              <Switch
                                checked={notificationContext.preferences.emailNotificationsEnabled}
                                onChange={(e) => handleUpdateNotificationPreference('emailNotificationsEnabled', e.target.checked)}
                                disabled={savingNotifications}
                              />
                            </Box>
                          </Card>

                          <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box display="flex" alignItems="center" gap={2}>
                                <NotificationsIcon color="primary" />
                                <Box>
                                  <Typography variant="body1" fontWeight={600}>
                                    Push Notifications
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Receive browser push notifications
                                  </Typography>
                                </Box>
                              </Box>
                              <Switch
                                checked={notificationContext.preferences.pushNotificationsEnabled}
                                onChange={(e) => handleUpdateNotificationPreference('pushNotificationsEnabled', e.target.checked)}
                                disabled={savingNotifications}
                              />
                            </Box>
                          </Card>
                        </Stack>
                      ) : (
                        <Alert severity="info">
                          Loading notification preferences...
                        </Alert>
                      )}
                    </Box>
                  )}

                  {/* Agent Profile Tab */}
                  {profile.agent && tabValue === 5 && (
                    <Box>
                      <Typography variant="h6" fontWeight={600} mb={3}>
                        Agent Profile
                      </Typography>
                      <Card variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
                        <Typography variant="h5" fontWeight={600} mb={2}>
                          {profile.agent.businessName}
                        </Typography>
                        <Typography variant="body1" paragraph color="text.secondary">
                          {profile.agent.bio || 'No bio available'}
                        </Typography>
                        <Grid container spacing={4} mt={2}>
                          <Grid item xs={6} sm={3}>
                            <ModernStatsCard
                              title="Rating"
                              value={profile.agent.rating?.toFixed(1) || 'N/A'}
                              icon={StarIcon}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <ModernStatsCard
                              title="Reviews"
                              value={profile.agent.reviewCount}
                              icon={AnalyticsIcon}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <ModernStatsCard
                              title="Auctions"
                              value={profile.agent.totalAuctions}
                              icon={GavelIcon}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <ModernStatsCard
                              title="Total Sales"
                              value={formatCurrency(profile.agent.totalSales)}
                              icon={MoneyIcon}
                            />
                          </Grid>
                        </Grid>
                      </Card>
                    </Box>
                  )}
                </Box>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}
