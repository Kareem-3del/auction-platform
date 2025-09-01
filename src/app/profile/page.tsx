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
  VolumeOff as VolumeOffIcon,
  PlayArrow as PlayArrowIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as WalletIcon,
  Notifications as NotificationsIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
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

// ChargeTab component for wallet charging functionality
function ChargeTab({ profile, onBalanceUpdate }: { profile: UserProfile; onBalanceUpdate: () => void }) {
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
      setError(t('wallet.invalidAmount'));
      return false;
    }

    if (amount < 1) {
      setError(t('wallet.minimumAmount') + ': $1');
      return false;
    }

    if (amount > 10000) {
      setError(t('wallet.maximumAmount') + ': $10,000');
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
        setError(t('auth.loginRequired'));
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
        setSuccess('💰 ' + t('wallet.rechargeSuccess') + ' via Binance');
        setChargeAmount('');
        setSelectedAmount(null);
        setSelectedPaymentMethod(null);
        // Add a small delay to ensure database consistency
        setTimeout(() => {
          onBalanceUpdate(); // Refresh profile data
        }, 500);
      } else {
        setError(data.error?.message || t('wallet.rechargeFailed'));
      }
    } catch (err) {
      setError(t('wallet.rechargeFailed'));
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
        setError(t('auth.loginRequired'));
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
        setSuccess('🚀 ' + t('wallet.rechargeSuccess') + ' via Whish.money');
        setChargeAmount('');
        setSelectedAmount(null);
        setSelectedPaymentMethod(null);
        // Add a small delay to ensure database consistency
        setTimeout(() => {
          onBalanceUpdate(); // Refresh profile data
        }, 500);
      } else {
        setError(data.error?.message || t('wallet.rechargeFailed'));
      }
    } catch (err) {
      setError(t('wallet.rechargeFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(168,85,247,0.05) 100%)',
          border: '1px solid rgba(99,102,241,0.1)',
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #6366f1 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <PaymentIcon sx={{ fontSize: 40, color: '#6366f1' }} />
          {t('wallet.recharge')} Your Wallet
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', mt: 2 }}>
          Choose your preferred payment method to add funds to your wallet instantly and securely.
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: '1.5rem' }
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: '1.5rem' }
          }} 
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Current Balance Card */}
        <Grid item xs={12} lg={4}>
          <Card 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(16,185,129,0.05) 100%)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 3,
              height: 'fit-content',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 8px 32px rgba(34,197,94,0.3)',
              }}
            >
              <WalletIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {t('wallet.currentBalance')}
            </Typography>
            <Typography variant="h3" color="success.main" sx={{ mb: 2, fontWeight: 700 }}>
              {formatCurrency(profile.balanceReal)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('wallet.realBalance')}
            </Typography>
            {profile.balanceVirtual > 0 && (
              <Typography variant="body2" color="secondary.main" sx={{ mt: 2 }}>
                {t('wallet.virtual')}: {formatCurrency(profile.balanceVirtual)}
              </Typography>
            )}
          </Card>
        </Grid>

        {/* Payment Methods and Amount Selection */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            {/* Payment Method Selection */}
            <Card sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                💳 Choose Payment Method
              </Typography>
              <Grid container spacing={3}>
                {/* Binance Option */}
                <Grid item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: selectedPaymentMethod === 'binance' ? '2px solid #F0B90B' : '1px solid rgba(0,0,0,0.1)',
                      background: selectedPaymentMethod === 'binance' 
                        ? 'linear-gradient(135deg, rgba(240,185,11,0.05) 0%, rgba(240,185,11,0.1) 100%)'
                        : 'transparent',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(240,185,11,0.2)',
                        borderColor: '#F0B90B',
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
                      <SecurityIcon sx={{ fontSize: 16, color: '#F0B90B' }} />
                      <Typography variant="caption" color="#F0B90B" fontWeight={600}>
                        Instant Processing • 0.1% Fee
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                {/* Whish.money Option */}
                <Grid item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: selectedPaymentMethod === 'whish' ? '2px solid #6366f1' : '1px solid rgba(0,0,0,0.1)',
                      background: selectedPaymentMethod === 'whish' 
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.05) 100%)'
                        : 'transparent',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(99,102,241,0.2)',
                        borderColor: '#6366f1',
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
                      <SecurityIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                      <Typography variant="caption" color="#6366f1" fontWeight={600}>
                        Instant Processing • 2.5% Fee
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Card>

            {/* Amount Selection */}
            {selectedPaymentMethod && (
              <Card sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  💰 Select Amount
                </Typography>
                
                {/* Predefined Amounts */}
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
                          background: selectedAmount === amount 
                            ? (selectedPaymentMethod === 'binance' 
                                ? 'linear-gradient(45deg, #F0B90B 0%, #F0B90B 100%)'
                                : 'linear-gradient(45deg, #6366f1 0%, #8b5cf6 100%)')
                            : 'transparent',
                          borderColor: selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1',
                          color: selectedAmount === amount ? 'white' : (selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1'),
                          '&:hover': {
                            background: selectedPaymentMethod === 'binance' 
                              ? 'rgba(240,185,11,0.1)'
                              : 'rgba(99,102,241,0.1)',
                          },
                        }}
                      >
                        ${amount}
                      </Button>
                    </Grid>
                  ))}
                </Grid>

                {/* Custom Amount */}
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Custom Amount
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Enter amount in USD"
                  value={chargeAmount}
                  onChange={handleCustomAmountChange}
                  sx={{ 
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1',
                    },
                  }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, fontWeight: 600 }}>$</Typography>,
                  }}
                />

                {/* Charge Button */}
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
                    background: selectedPaymentMethod === 'binance'
                      ? 'linear-gradient(45deg, #F0B90B 0%, #F0B90B 100%)'
                      : 'linear-gradient(45deg, #6366f1 0%, #8b5cf6 100%)',
                    '&:hover': {
                      background: selectedPaymentMethod === 'binance'
                        ? 'linear-gradient(45deg, #D19F0A 0%, #D19F0A 100%)'
                        : 'linear-gradient(45deg, #5856eb 0%, #7c3aed 100%)',
                    },
                    boxShadow: selectedPaymentMethod === 'binance'
                      ? '0 8px 32px rgba(240,185,11,0.3)'
                      : '0 8px 32px rgba(99,102,241,0.3)',
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

                {/* Info */}
                <Box 
                  sx={{ 
                    mt: 3, 
                    p: 3, 
                    borderRadius: 2, 
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SecurityIcon sx={{ fontSize: 16 }} />
                    All transactions are secured with enterprise-grade encryption
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Processing fee: {selectedPaymentMethod === 'binance' ? '0.1%' : '2.5%'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Minimum: $1 • Maximum: $10,000 per transaction
                  </Typography>
                </Box>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { preferences, updatePreferences } = useNotifications();
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
        setError(t('auth.loginRequired'));
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
        throw new Error(t('profile.fetchError'));
      }

      const data = await response.json();
      if (data.success) {
        // Ensure balance values are properly converted to numbers
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
        setError(data.error?.message || t('profile.loadError'));
      }
    } catch (err) {
      setError(t('profile.loadError'));
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
        setError(t('auth.loginRequired'));
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
        setSuccess(t('profile.updateSuccess'));
        setEditing(false);
      } else {
        setError(data.error?.message || t('profile.updateError'));
      }
    } catch (err) {
      setError(t('profile.updateError'));
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

  const handleUpdateNotificationPreference = async (key: keyof typeof preferences, value: boolean) => {
    try {
      setSavingNotifications(true);
      setError(null);
      await updatePreferences({ [key]: value });
      setSuccess(t('profile.notificationUpdateSuccess'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('profile.notificationUpdateError'));
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
        setError(t('profile.soundError'));
        setTimeout(() => setError(null), 3000);
      };
    } catch (err) {
      setPlayingSound(false);
      setError(t('profile.soundError'));
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

  const getKycStatusText = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return t('kyc.notStarted');
      case 'PENDING':
        return t('kyc.underReview');
      case 'APPROVED':
        return t('kyc.verified');
      case 'REJECTED':
        return t('kyc.rejected');
      default:
        return status;
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <Box p={3}>
          <Alert severity="error">{t('profile.loadError')}</Alert>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={3} maxWidth="1200px" mx="auto">
      <Typography variant="h4" gutterBottom>
        {t('navigation.profile')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            {editing ? (
              <Box sx={{ mb: 2 }}>
                <ImageUpload
                  currentImageUrl={profileImageUrl || undefined}
                  onImageChange={setProfileImageUrl}
                  uploadType="profile"
                  variant="avatar"
                  size="large"
                  allowRemove
                />
              </Box>
            ) : (
              <Avatar
                src={profile.isAnonymousDisplay ? profile.anonymousAvatarUrl : profile.avatarUrl}
                sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
              >
                <PersonIcon sx={{ fontSize: 50 }} />
              </Avatar>
            )}
            
            <Typography variant="h6" gutterBottom>
              {profile.isAnonymousDisplay 
                ? profile.anonymousDisplayName 
                : `${profile.firstName} ${profile.lastName}`}
            </Typography>
            
            <Chip 
              label={profile.userType} 
              color="primary" 
              size="small" 
              sx={{ mb: 1 }} 
            />
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('profile.memberSince')} {formatDate(profile.createdAt)}
            </Typography>

            <Stack spacing={1} mt={2}>
              <Chip 
                label={`${t('profile.kyc')}: ${getKycStatusText(profile.kycStatus)}`}
                color={getStatusColor(profile.kycStatus)}
                size="small"
              />
              <Chip 
                label={profile.emailVerified ? t('profile.emailVerified') : t('profile.emailNotVerified')}
                color={profile.emailVerified ? 'success' : 'warning'}
                size="small"
              />
              {profile.phone && (
                <Chip 
                  label={profile.phoneVerified ? t('profile.phoneVerified') : t('profile.phoneNotVerified')}
                  color={profile.phoneVerified ? 'success' : 'warning'}
                  size="small"
                />
              )}
            </Stack>

            {!editing && (
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
                sx={{ mt: 2 }}
                fullWidth
              >
                {t('profile.editProfile')}
              </Button>
            )}
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('wallet.balance')}
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <WalletIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">{t('wallet.realBalance')}</Typography>
                </Box>
                <Typography variant="h6" color="primary.main">
                  {formatCurrency(profile.balanceReal)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <TrendingUpIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="body2">{t('wallet.virtualBalance')}</Typography>
                </Box>
                <Typography variant="h6" color="secondary.main">
                  {formatCurrency(profile.balanceVirtual)}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {t('wallet.virtualMultiplier')}: {profile.virtualMultiplier}x
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('profile.statistics')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main">
                    {profile.stats.activeBids}
                  </Typography>
                  <Typography variant="caption">{t('profile.activeBids')}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {profile.stats.auctionsWon}
                  </Typography>
                  <Typography variant="caption">{t('profile.wonAuctions')}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {profile.stats.watchedAuctions}
                  </Typography>
                  <Typography variant="caption">{t('profile.watched')}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="text.primary">
                    {formatCurrency(profile.stats.totalSpent)}
                  </Typography>
                  <Typography variant="caption">{t('profile.totalSpent')}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {editing ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('profile.editProfile')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('auth.firstName')}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('auth.lastName')}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('auth.phoneNumber')}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                      label={t('profile.displayAnonymously')}
                    />
                  </Grid>
                </Grid>
                
                <Box mt={3} display="flex" gap={2}>
                  <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? t('common.saving') : t('common.saveChanges')}
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    {t('common.cancel')}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                  <Tab label={t('profile.profileDetails')} />
                  <Tab label={t('profile.recentTransactions')} />
                  <Tab label={t('profile.bidHistory')} />
                  <Tab label={t('profile.charge')} />
                  <Tab label={t('profile.notifications')} />
                  {profile.agent && <Tab label={t('profile.agentProfile')} />}
                </Tabs>

                {tabValue === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {t('profile.profileInformation')}
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><EmailIcon /></ListItemIcon>
                        <ListItemText primary={t('common.email')} secondary={profile.email} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText 
                          primary={t('profile.fullName')} 
                          secondary={`${profile.firstName} ${profile.lastName}`} 
                        />
                      </ListItem>
                      {profile.phone && (
                        <ListItem>
                          <ListItemIcon><PhoneIcon /></ListItemIcon>
                          <ListItemText primary={t('common.phone')} secondary={profile.phone} />
                        </ListItem>
                      )}
                      <ListItem>
                        <ListItemIcon><HistoryIcon /></ListItemIcon>
                        <ListItemText 
                          primary={t('profile.lastLogin')} 
                          secondary={profile.lastLoginAt ? formatDate(profile.lastLoginAt) : t('profile.never')} 
                        />
                      </ListItem>
                    </List>
                  </Box>
                )}

                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {t('profile.recentTransactions')}
                    </Typography>
                    {profile.transactions.length > 0 ? (
                      <List>
                        {profile.transactions.map((transaction) => (
                          <ListItem key={transaction.id} divider>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body1">
                                    {transaction.description || transaction.transactionType}
                                  </Typography>
                                  <Box textAlign="right">
                                    <Typography variant="body1" color="primary.main">
                                      {formatCurrency(transaction.amountReal)}
                                    </Typography>
                                    <Typography variant="body2" color="secondary.main">
                                      {t('wallet.virtual')}: {formatCurrency(transaction.amountVirtual)}
                                    </Typography>
                                  </Box>
                                </Box>
                              }
                              secondary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="caption">
                                    {formatDate(transaction.createdAt)}
                                  </Typography>
                                  <Chip
                                    label={transaction.status}
                                    color={getStatusColor(transaction.status)}
                                    size="small"
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography color="text.secondary">{t('profile.noTransactions')}</Typography>
                    )}
                  </Box>
                )}

                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {t('profile.recentBids')}
                    </Typography>
                    {profile.bids.length > 0 ? (
                      <List>
                        {profile.bids.map((bid) => (
                          <ListItem key={bid.id} divider>
                            <ListItemIcon><GavelIcon /></ListItemIcon>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body1">
                                    {bid.product.title}
                                  </Typography>
                                  <Typography variant="h6" color="primary.main">
                                    {formatCurrency(bid.amount)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="caption">
                                    {t('profile.bidPlaced')}: {formatDate(bid.createdAt)}
                                  </Typography>
                                  <Box display="flex" gap={1}>
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
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography color="text.secondary">{t('profile.noBids')}</Typography>
                    )}
                  </Box>
                )}

                {tabValue === 3 && (
                  <ChargeTab profile={profile} onBalanceUpdate={fetchProfile} />
                )}

                {tabValue === 4 && (
                  <Box>
                    <Box 
                      sx={{ 
                        p: 4,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(168,85,247,0.05) 100%)',
                        border: '1px solid rgba(99,102,241,0.1)',
                        mb: 4,
                      }}
                    >
                      <Typography 
                        variant="h5" 
                        gutterBottom
                        sx={{ 
                          fontWeight: 600,
                          background: 'linear-gradient(45deg, #6366f1 0%, #a855f7 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        🔔 Notification Preferences
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                        Customize how and when you receive notifications to stay informed without being overwhelmed
                      </Typography>
                    </Box>

                    <Stack spacing={4}>
                      {/* Sound Notifications */}
                      <Card 
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          border: '1px solid rgba(99,102,241,0.2)',
                          background: preferences.notificationSoundEnabled 
                            ? 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(16,185,129,0.05) 100%)'
                            : 'rgba(0,0,0,0.02)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                            borderColor: preferences.notificationSoundEnabled ? '#22c55e' : '#6366f1',
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 2,
                                  backgroundColor: preferences.notificationSoundEnabled 
                                    ? 'rgba(34,197,94,0.1)' 
                                    : 'rgba(107,114,128,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: 3,
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                {preferences.notificationSoundEnabled ? 
                                  <VolumeUpIcon sx={{ fontSize: 28, color: '#22c55e' }} /> : 
                                  <VolumeOffIcon sx={{ fontSize: 28, color: '#6b7280' }} />
                                }
                              </Box>
                              <Box>
                                <Typography variant="h6" fontWeight="600" gutterBottom>
                                  Sound Notifications
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                  Play a pleasant sound when you receive new notifications to get instant alerts
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                  {preferences.notificationSoundEnabled ? '🎵 Sounds are enabled' : '🔇 Sounds are disabled'}
                                </Typography>
                                
                                {/* Sound Preview Button */}
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={playingSound ? (
                                    <Box
                                      sx={{
                                        width: 16,
                                        height: 16,
                                        border: '2px solid #22c55e',
                                        borderTop: '2px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        '@keyframes spin': {
                                          '0%': { transform: 'rotate(0deg)' },
                                          '100%': { transform: 'rotate(360deg)' },
                                        },
                                      }}
                                    />
                                  ) : (
                                    <PlayArrowIcon sx={{ fontSize: 16 }} />
                                  )}
                                  onClick={handlePlayNotificationSound}
                                  disabled={playingSound}
                                  sx={{
                                    mt: 1,
                                    borderColor: '#22c55e',
                                    color: '#22c55e',
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    minWidth: 'auto',
                                    px: 1.5,
                                    py: 0.5,
                                    '&:hover': {
                                      borderColor: '#16a34a',
                                      backgroundColor: 'rgba(34,197,94,0.1)',
                                    }
                                  }}
                                >
                                  {playingSound ? 'Playing...' : 'Preview Sound'}
                                </Button>
                              </Box>
                            </Box>
                            <Switch
                              checked={preferences.notificationSoundEnabled}
                              onChange={(e) => handleUpdateNotificationPreference('notificationSoundEnabled', e.target.checked)}
                              disabled={savingNotifications}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#22c55e',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#22c55e',
                                },
                                '& .MuiSwitch-track': {
                                  borderRadius: 12,
                                },
                                '& .MuiSwitch-thumb': {
                                  borderRadius: 12,
                                },
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Email Notifications */}
                      <Card 
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          border: '1px solid rgba(99,102,241,0.2)',
                          background: preferences.emailNotificationsEnabled 
                            ? 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(147,197,253,0.05) 100%)'
                            : 'rgba(0,0,0,0.02)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                            borderColor: preferences.emailNotificationsEnabled ? '#3b82f6' : '#6366f1',
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 2,
                                  backgroundColor: preferences.emailNotificationsEnabled 
                                    ? 'rgba(59,130,246,0.1)' 
                                    : 'rgba(107,114,128,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: 3,
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <EmailIcon sx={{ 
                                  fontSize: 28, 
                                  color: preferences.emailNotificationsEnabled ? '#3b82f6' : '#6b7280' 
                                }} />
                              </Box>
                              <Box>
                                <Typography variant="h6" fontWeight="600" gutterBottom>
                                  Email Notifications
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                  Receive important notifications via email for auction updates, bids, and payments
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                  {preferences.emailNotificationsEnabled ? '📧 Email alerts enabled' : '📭 Email alerts disabled'}
                                </Typography>
                              </Box>
                            </Box>
                            <Switch
                              checked={preferences.emailNotificationsEnabled}
                              onChange={(e) => handleUpdateNotificationPreference('emailNotificationsEnabled', e.target.checked)}
                              disabled={savingNotifications}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#3b82f6',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#3b82f6',
                                },
                                '& .MuiSwitch-track': {
                                  borderRadius: 12,
                                },
                                '& .MuiSwitch-thumb': {
                                  borderRadius: 12,
                                },
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Push Notifications */}
                      <Card 
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          border: '1px solid rgba(99,102,241,0.2)',
                          background: preferences.pushNotificationsEnabled 
                            ? 'linear-gradient(135deg, rgba(168,85,247,0.05) 0%, rgba(217,70,239,0.05) 100%)'
                            : 'rgba(0,0,0,0.02)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                            borderColor: preferences.pushNotificationsEnabled ? '#a855f7' : '#6366f1',
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 2,
                                  backgroundColor: preferences.pushNotificationsEnabled 
                                    ? 'rgba(168,85,247,0.1)' 
                                    : 'rgba(107,114,128,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: 3,
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <NotificationsIcon sx={{ 
                                  fontSize: 28, 
                                  color: preferences.pushNotificationsEnabled ? '#a855f7' : '#6b7280' 
                                }} />
                              </Box>
                              <Box>
                                <Typography variant="h6" fontWeight="600" gutterBottom>
                                  Push Notifications
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                  Receive instant push notifications in your browser for real-time updates
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                  {preferences.pushNotificationsEnabled ? '🚀 Push alerts enabled' : '⏸️ Push alerts disabled'}
                                </Typography>
                              </Box>
                            </Box>
                            <Switch
                              checked={preferences.pushNotificationsEnabled}
                              onChange={(e) => handleUpdateNotificationPreference('pushNotificationsEnabled', e.target.checked)}
                              disabled={savingNotifications}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#a855f7',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#a855f7',
                                },
                                '& .MuiSwitch-track': {
                                  borderRadius: 12,
                                },
                                '& .MuiSwitch-thumb': {
                                  borderRadius: 12,
                                },
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Stack>

                    {/* Enhanced Loading State */}
                    {savingNotifications && (
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center" 
                        mt={4}
                        p={3}
                        sx={{
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)',
                          border: '1px solid rgba(99,102,241,0.2)',
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              border: '3px solid rgba(99,102,241,0.3)',
                              borderTop: '3px solid #6366f1',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' },
                              },
                            }}
                          />
                          <Typography variant="body1" color="#6366f1" fontWeight={600}>
                            Saving your preferences...
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Tips Section */}
                    <Box 
                      sx={{ 
                        mt: 4,
                        p: 3,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(251,191,36,0.05) 100%)',
                        border: '1px solid rgba(245,158,11,0.2)',
                      }}
                    >
                      <Typography variant="h6" gutterBottom sx={{ color: '#d97706', fontWeight: 600 }}>
                        💡 Pro Tips
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          • <strong>Sound notifications</strong> are perfect for staying alert during active bidding sessions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          • <strong>Email notifications</strong> ensure you never miss important auction updates even when offline
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          • <strong>Push notifications</strong> provide instant alerts right in your browser tab
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                )}

                {profile.agent && tabValue === 5 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {t('profile.agentProfile')}
                    </Typography>
                    <Card>
                      <CardContent>
                        <Typography variant="h5" gutterBottom>
                          {profile.agent.businessName}
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {profile.agent.bio || t('profile.noBio')}
                        </Typography>
                        <Grid container spacing={2} mt={2}>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h4" color="primary.main">
                                {profile.agent.rating?.toFixed(1) || 'N/A'}
                              </Typography>
                              <Typography variant="caption">{t('profile.rating')}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h4" color="success.main">
                                {profile.agent.reviewCount}
                              </Typography>
                              <Typography variant="caption">{t('auction.reviews')}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h4" color="info.main">
                                {profile.agent.totalAuctions}
                              </Typography>
                              <Typography variant="caption">{t('auction.totalAuctions')}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h4" color="warning.main">
                                {formatCurrency(profile.agent.totalSales)}
                              </Typography>
                              <Typography variant="caption">{t('auction.totalSales')}</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        <Box mt={2}>
                          <Chip
                            label={profile.agent.status}
                            color={getStatusColor(profile.agent.status)}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      </Box>
    </Layout>
  );
}