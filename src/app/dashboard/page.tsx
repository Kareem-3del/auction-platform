'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Grid,
  Card,
  Chip,
  List,
  Paper,
  Stack,
  Alert,
  Button,
  Avatar,
  Divider,
  ListItem,
  Typography,
  IconButton,
  CardContent,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Favorite as FavoriteIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  AccountBalanceWallet as WalletIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

import { useAuth } from 'src/hooks/useAuth';
import { useLocale } from 'src/hooks/useLocale';

import { usersAPI, notificationsAPI } from 'src/lib/api-client';
import { DashboardContent } from 'src/layouts/dashboard';
import { formatDate, formatCurrency, formatTimeRemaining } from 'src/lib/utils';

interface DashboardStats {
  activeBids: number;
  auctionsWon: number;
  watchedAuctions: number;
  totalSpent: number;
}

interface RecentActivity {
  id: string;
  type: 'bid' | 'win' | 'watch' | 'transaction';
  title: string;
  description: string;
  amount?: number;
  createdAt: string;
  status?: string;
}

interface UpcomingAuction {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  currentBid: number;
  imageUrl?: string;
  category: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const [stats, setStats] = useState<DashboardStats>({
    activeBids: 0,
    auctionsWon: 0,
    watchedAuctions: 0,
    totalSpent: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState<UpcomingAuction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      loadDashboardData();
    }
  }, [user, loading]);

  const loadDashboardData = async () => {
    try {
      setLoadingData(true);
      
      // Set default stats in case API calls fail
      let userStats = {
        activeBids: 0,
        auctionsWon: 0,
        watchedAuctions: 0,
        totalSpent: 0,
      };

      let upcomingAuctions: UpcomingAuction[] = [];

      try {
        // Load user's auction and bidding statistics with authentication
        const statsData = await usersAPI.getUserStats();

        // Load stats if available
        if (statsData.success) {
          userStats = {
            activeBids: statsData.data.data?.activeBids || 0,
            auctionsWon: statsData.data.data?.auctionsWon || 0,
            watchedAuctions: statsData.data.data?.watchedAuctions || 0,
            totalSpent: statsData.data.data?.totalSpent || 0,
          };
        }

        // For now, set empty upcoming auctions array
        // TODO: Implement proper auctions/products API for upcoming auctions
        upcomingAuctions = [];
      } catch (apiError) {
        console.error('API calls failed:', apiError);
        // Keep default values
      }

      setStats(userStats);
      setUpcomingAuctions(upcomingAuctions);
      // Load recent activity (simplified for now)
      setRecentActivity([]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set default empty state
      setStats({
        activeBids: 0,
        auctionsWon: 0,
        watchedAuctions: 0,
        totalSpent: 0,
      });
      setRecentActivity([]);
      setUpcomingAuctions([]);
    } finally {
      setLoadingData(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bid':
        return <GavelIcon color="primary" />;
      case 'win':
        return <TrendingUpIcon color="success" />;
      case 'watch':
        return <FavoriteIcon color="secondary" />;
      case 'transaction':
        return <WalletIcon color="info" />;
      default:
        return <HistoryIcon />;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    if (type === 'win') return 'success';
    if (type === 'bid' && status === 'active') return 'primary';
    if (type === 'watch') return 'secondary';
    return 'default';
  };

  if (loading || !user) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('dashboard.welcomeBack', { name: user.firstName || t('common.user') })}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('dashboard.auctionSummary')}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={() => router.push('/profile')}>
            <PersonIcon />
          </IconButton>
          <IconButton>
            <NotificationsIcon />
          </IconButton>
          <IconButton>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar 
                  src={user.avatarUrl || undefined}
                  sx={{ width: 60, height: 60, mr: 2 }}
                >
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {user.isAnonymousDisplay 
                      ? (user.anonymousDisplayName || 'Anonymous User')
                      : `${user.firstName} ${user.lastName}`}
                  </Typography>
                  <Chip 
                    label={user.userType} 
                    size="small" 
                    color="primary" 
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center">
                    <WalletIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">{t('wallet.realBalance')}</Typography>
                  </Box>
                  <Typography variant="h6" color="primary.main">
                    {formatCurrency(user.balanceReal)}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center">
                    <TrendingUpIcon sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="body2">{t('wallet.virtualBalance')}</Typography>
                  </Box>
                  <Typography variant="h6" color="secondary.main">
                    {formatCurrency(user.balanceVirtual)}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {t('profile.kyc')} {t('common.status')}
                  </Typography>
                  <Chip 
                    label={user.kycStatus} 
                    size="small"
                    color={user.kycStatus === 'APPROVED' ? 'success' : 'warning'}
                  />
                </Box>
              </Stack>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => router.push('/profile')}
                sx={{ mt: 2 }}
              >
                {t('profile.viewProfile')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <GavelIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary.main">
                  {loadingData ? '-' : stats.activeBids}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.activeBids')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {loadingData ? '-' : stats.auctionsWon}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.wonAuctions')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <FavoriteIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h4" color="secondary.main">
                  {loadingData ? '-' : stats.watchedAuctions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.watched')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <WalletIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {loadingData ? '-' : formatCurrency(stats.totalSpent).replace('$', '')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.totalSpent')}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.quickActions')}
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
              <Button
                variant="contained"
                startIcon={<GavelIcon />}
                onClick={() => router.push('/auctions')}
              >
                {t('dashboard.browseAuctions')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => router.push('/products/create')}
                disabled={user.userType !== 'AGENT'}
              >
                {t('navigation.createAuction')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<WalletIcon />}
                onClick={() => router.push('/wallet')}
              >
                {t('dashboard.manageWallet')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<FavoriteIcon />}
                onClick={() => router.push('/watchlist')}
              >
                {t('dashboard.watchlist')}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.recentActivity')}
              </Typography>
              
              {loadingData ? (
                <LinearProgress />
              ) : recentActivity.length > 0 ? (
                <List dense>
                  {recentActivity.map((activity) => (
                    <ListItem key={activity.id} divider>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">
                              {activity.title}
                            </Typography>
                            {activity.amount && (
                              <Chip
                                label={formatCurrency(activity.amount)}
                                size="small"
                                color={getActivityColor(activity.type, activity.status)}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(activity.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">{t('dashboard.noRecentActivity')}</Alert>
              )}
              
              <Button
                fullWidth
                variant="text"
                onClick={() => router.push('/activity')}
                sx={{ mt: 2 }}
              >
                {t('dashboard.viewAllActivity')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Auctions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.upcomingAuctions')}
              </Typography>
              
              {loadingData ? (
                <LinearProgress />
              ) : upcomingAuctions.length > 0 ? (
                <Stack spacing={2}>
                  {upcomingAuctions.map((auction) => (
                    <Paper key={auction.id} sx={{ p: 2 }} variant="outlined">
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle2">
                          {auction.title}
                        </Typography>
                        <Chip label={auction.category} size="small" />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {auction.description}
                      </Typography>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="caption" display="block">
                            {t('auction.currentBid')}: {formatCurrency(auction.currentBid)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('dashboard.startsIn')}: {formatTimeRemaining(auction.startTime)}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => router.push(`/products/${auction.id}`)}
                        >
                          {t('common.view')}
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Alert severity="info">{t('dashboard.noUpcomingAuctions')}</Alert>
              )}
              
              <Button
                fullWidth
                variant="text"
                onClick={() => router.push('/auctions')}
                sx={{ mt: 2 }}
              >
                {t('dashboard.browseAllAuctions')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </DashboardContent>
  );
}
