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
} from '@mui/icons-material';

import { useAuth, getAccessToken } from 'src/hooks/useAuth';

import { formatDate, formatCurrency } from 'src/lib/utils';
import { useNotifications } from 'src/contexts/NotificationContext';

import Layout from 'src/components/layout/Layout';
import ImageUpload from 'src/components/common/ImageUpload';

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
    auction: {
      id: string;
      title: string;
      status: string;
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

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { preferences, updatePreferences } = useNotifications();
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
        setError('Please log in to view your profile');
        return;
      }
      
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.data.profile);
        setFormData({
          firstName: data.data.profile.firstName || '',
          lastName: data.data.profile.lastName || '',
          phone: data.data.profile.phone || '',
          isAnonymousDisplay: data.data.profile.isAnonymousDisplay || false,
          avatarUrl: data.data.profile.avatarUrl || '',
        });
        setProfileImageUrl(data.data.profile.avatarUrl || null);
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
        setError('Please log in to save your profile');
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

  const handleUpdateNotificationPreference = async (key: keyof typeof preferences, value: boolean) => {
    try {
      setSavingNotifications(true);
      setError(null);
      await updatePreferences({ [key]: value });
      setSuccess('Notification preferences updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update notification preferences');
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

  const getKycStatusText = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'PENDING':
        return 'Under Review';
      case 'APPROVED':
        return 'Verified';
      case 'REJECTED':
        return 'Rejected';
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
          <Alert severity="error">Failed to load profile</Alert>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={3} maxWidth="1200px" mx="auto">
      <Typography variant="h4" gutterBottom>
        Profile
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
              Member since {formatDate(profile.createdAt)}
            </Typography>

            <Stack spacing={1} mt={2}>
              <Chip 
                label={`KYC: ${getKycStatusText(profile.kycStatus)}`}
                color={getStatusColor(profile.kycStatus)}
                size="small"
              />
              <Chip 
                label={profile.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                color={profile.emailVerified ? 'success' : 'warning'}
                size="small"
              />
              {profile.phone && (
                <Chip 
                  label={profile.phoneVerified ? 'Phone Verified' : 'Phone Not Verified'}
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
                Edit Profile
              </Button>
            )}
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Balance
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <WalletIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">Real Balance</Typography>
                </Box>
                <Typography variant="h6" color="primary.main">
                  {formatCurrency(profile.balanceReal)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <TrendingUpIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="body2">Virtual Balance</Typography>
                </Box>
                <Typography variant="h6" color="secondary.main">
                  {formatCurrency(profile.balanceVirtual)}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Virtual multiplier: {profile.virtualMultiplier}x
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main">
                    {profile.stats.activeBids}
                  </Typography>
                  <Typography variant="caption">Active Bids</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {profile.stats.auctionsWon}
                  </Typography>
                  <Typography variant="caption">Won Auctions</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {profile.stats.watchedAuctions}
                  </Typography>
                  <Typography variant="caption">Watched</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="text.primary">
                    {formatCurrency(profile.stats.totalSpent)}
                  </Typography>
                  <Typography variant="caption">Total Spent</Typography>
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
                  Edit Profile
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
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
                      label="Display anonymously in auctions"
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
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                  <Tab label="Profile Details" />
                  <Tab label="Recent Transactions" />
                  <Tab label="Bid History" />
                  <Tab label="Notifications" />
                  {profile.agent && <Tab label="Agent Profile" />}
                </Tabs>

                {tabValue === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Profile Information
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><EmailIcon /></ListItemIcon>
                        <ListItemText primary="Email" secondary={profile.email} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Full Name" 
                          secondary={`${profile.firstName} ${profile.lastName}`} 
                        />
                      </ListItem>
                      {profile.phone && (
                        <ListItem>
                          <ListItemIcon><PhoneIcon /></ListItemIcon>
                          <ListItemText primary="Phone" secondary={profile.phone} />
                        </ListItem>
                      )}
                      <ListItem>
                        <ListItemIcon><HistoryIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Last Login" 
                          secondary={profile.lastLoginAt ? formatDate(profile.lastLoginAt) : 'Never'} 
                        />
                      </ListItem>
                    </List>
                  </Box>
                )}

                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Recent Transactions
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
                                      Virtual: {formatCurrency(transaction.amountVirtual)}
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
                      <Typography color="text.secondary">No transactions found</Typography>
                    )}
                  </Box>
                )}

                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Recent Bids
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
                                    {bid.auction.title}
                                  </Typography>
                                  <Typography variant="h6" color="primary.main">
                                    {formatCurrency(bid.amount)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="caption">
                                    Bid placed: {formatDate(bid.createdAt)}
                                  </Typography>
                                  <Box display="flex" gap={1}>
                                    <Chip
                                      label={bid.status}
                                      color={getStatusColor(bid.status)}
                                      size="small"
                                    />
                                    <Chip
                                      label={bid.auction.status}
                                      color={getStatusColor(bid.auction.status)}
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
                      <Typography color="text.secondary">No bids found</Typography>
                    )}
                  </Box>
                )}

                {tabValue === 3 && (
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

                {profile.agent && tabValue === 4 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Agent Profile
                    </Typography>
                    <Card>
                      <CardContent>
                        <Typography variant="h5" gutterBottom>
                          {profile.agent.businessName}
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {profile.agent.bio || 'No bio provided'}
                        </Typography>
                        <Grid container spacing={2} mt={2}>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h4" color="primary.main">
                                {profile.agent.rating?.toFixed(1) || 'N/A'}
                              </Typography>
                              <Typography variant="caption">Rating</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h4" color="success.main">
                                {profile.agent.reviewCount}
                              </Typography>
                              <Typography variant="caption">Reviews</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h4" color="info.main">
                                {profile.agent.totalAuctions}
                              </Typography>
                              <Typography variant="caption">Total Auctions</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h4" color="warning.main">
                                {formatCurrency(profile.agent.totalSales)}
                              </Typography>
                              <Typography variant="caption">Total Sales</Typography>
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