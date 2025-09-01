'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  Stack,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as BalanceIcon,
  Gavel as GavelIcon,
  Favorite as FavoriteIcon,
  Receipt as ReceiptIcon,
  EmojiEvents as TrophyIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useLocale } from 'src/hooks/useLocale';
import { DashboardContent } from 'src/layouts/dashboard';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: 'BUYER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN';
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  emailVerified: boolean;
  balanceReal: number;
  balanceVirtual: number;
  anonymousDisplayName?: string;
  anonymousAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  bidCount: number;
  transactionCount: number;
  favoriteCount: number;
  wonProductCount: number;
  highestBidProductCount: number;
  bids: Array<{
    id: string;
    amount: number;
    createdAt: string;
    product: {
      id: string;
      title: string;
      mainImageUrl?: string;
    };
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    createdAt: string;
  }>;
  favorites: Array<{
    id: string;
    createdAt: string;
    product: {
      id: string;
      title: string;
      mainImageUrl?: string;
      currentBid: number;
      auctionStatus: string;
    };
  }>;
  wonProducts: Array<{
    id: string;
    title: string;
    mainImageUrl?: string;
    currentBid: number;
    auctionStatus: string;
  }>;
}

const getUserTypeColor = (userType: string) => {
  switch (userType) {
    case 'SUPER_ADMIN': return 'error';
    case 'ADMIN': return 'warning';
    case 'AGENT': return 'info';
    case 'BUYER': return 'success';
    default: return 'default';
  }
};

const getKycStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'error';
    case 'PENDING': return 'warning';
    default: return 'default';
  }
};

export default function UserViewPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLocale();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceDialog, setBalanceDialog] = useState<{
    open: boolean;
    type: 'real' | 'virtual';
    currentValue: number;
    newValue: string;
  }>({
    open: false,
    type: 'real',
    currentValue: 0,
    newValue: '',
  });

  const userId = params?.id as string;

  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to fetch user');
      }

      setUser(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!user || !balanceDialog.newValue) return;

    try {
      const updateData = {
        [balanceDialog.type === 'real' ? 'balanceReal' : 'balanceVirtual']: 
          parseFloat(balanceDialog.newValue),
      };

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || data.message || 'Failed to update balance');
      }

      await fetchUser();
      setBalanceDialog({ ...balanceDialog, open: false, newValue: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update balance');
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) {
    return (
      <DashboardContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </DashboardContent>
    );
  }

  if (!user) {
    return (
      <DashboardContent>
        <Alert severity="warning">
          {t('users.userNotFound')}
        </Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {`${user.firstName} ${user.lastName}`}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {t('navigation.dashboard')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              /
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('users.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              /
            </Typography>
            <Typography variant="body2" color="primary">
              {`${user.firstName} ${user.lastName}`}
            </Typography>
          </Stack>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/dashboard/users/${userId}/edit`)}
          sx={{ bgcolor: '#CE0E2D', '&:hover': { bgcolor: '#B0122A' } }}
        >
          {t('common.edit')}
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* User Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack alignItems="center" spacing={2}>
                <Avatar
                  src={user.anonymousAvatarUrl}
                  sx={{ width: 120, height: 120, fontSize: 48 }}
                >
                  {user.firstName[0]}{user.lastName[0]}
                </Avatar>
                
                <Typography variant="h5" textAlign="center">
                  {user.firstName} {user.lastName}
                </Typography>
                
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  <Chip 
                    label={t(`users.userType.${user.userType.toLowerCase()}`)}
                    color={getUserTypeColor(user.userType) as any}
                    size="small"
                  />
                  <Chip 
                    label={t(`users.kycStatus.${user.kycStatus.toLowerCase()}`)}
                    color={getKycStatusColor(user.kycStatus) as any}
                    size="small"
                  />
                  <Chip 
                    label={user.isActive ? t('common.active') : t('common.inactive')}
                    color={user.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </Stack>

                <Divider sx={{ width: '100%', my: 2 }} />

                {/* Contact Information */}
                <Stack spacing={2} sx={{ width: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmailIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                    {user.emailVerified && (
                      <Chip label={t('users.verified')} size="small" color="success" />
                    )}
                  </Stack>
                  
                  {user.phone && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PhoneIcon color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {user.phone}
                      </Typography>
                    </Stack>
                  )}
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t('users.joinedOn')}: {new Date(user.createdAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* User Statistics and Balance */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Balance Cards */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack>
                        <Typography variant="h6" color="text.secondary">
                          {t('users.realBalance')}
                        </Typography>
                        <Typography variant="h4" color="success.main">
                          ${user.balanceReal.toFixed(2)}
                        </Typography>
                      </Stack>
                      <Stack>
                        <BalanceIcon sx={{ fontSize: 40, color: 'success.main' }} />
                        <IconButton
                          size="small"
                          onClick={() => setBalanceDialog({
                            open: true,
                            type: 'real',
                            currentValue: user.balanceReal,
                            newValue: user.balanceReal.toString(),
                          })}
                        >
                          <EditIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack>
                        <Typography variant="h6" color="text.secondary">
                          {t('users.virtualBalance')}
                        </Typography>
                        <Typography variant="h4" color="info.main">
                          ${user.balanceVirtual.toFixed(2)}
                        </Typography>
                      </Stack>
                      <Stack>
                        <BalanceIcon sx={{ fontSize: 40, color: 'info.main' }} />
                        <IconButton
                          size="small"
                          onClick={() => setBalanceDialog({
                            open: true,
                            type: 'virtual',
                            currentValue: user.balanceVirtual,
                            newValue: user.balanceVirtual.toString(),
                          })}
                        >
                          <EditIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Activity Statistics */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('users.activityOverview')}
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Stack alignItems="center" spacing={1}>
                      <GavelIcon sx={{ fontSize: 32, color: '#CE0E2D' }} />
                      <Typography variant="h5">{user.bidCount}</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        {t('users.totalBids')}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Stack alignItems="center" spacing={1}>
                      <TrophyIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                      <Typography variant="h5">{user.wonProductCount}</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        {t('users.auctionsWon')}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Stack alignItems="center" spacing={1}>
                      <FavoriteIcon sx={{ fontSize: 32, color: 'error.main' }} />
                      <Typography variant="h5">{user.favoriteCount}</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        {t('users.favorites')}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Stack alignItems="center" spacing={1}>
                      <ReceiptIcon sx={{ fontSize: 32, color: 'info.main' }} />
                      <Typography variant="h5">{user.transactionCount}</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        {t('users.transactions')}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Recent Activity Tables */}
        {user.bids.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('users.recentBids')}
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('bids.product')}</TableCell>
                        <TableCell>{t('bids.amount')}</TableCell>
                        <TableCell>{t('common.date')}</TableCell>
                        <TableCell align="right">{t('common.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {user.bids.map((bid) => (
                        <TableRow key={bid.id}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar
                                src={bid.product.mainImageUrl}
                                sx={{ width: 40, height: 40 }}
                              />
                              <Typography variant="body2">
                                {bid.product.title}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              ${bid.amount.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {new Date(bid.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title={t('common.viewProduct')}>
                              <IconButton
                                size="small"
                                onClick={() => router.push(`/dashboard/products/${bid.product.id}`)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {user.favorites.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('users.favoriteProducts')}
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('products.product')}</TableCell>
                        <TableCell>{t('products.currentBid')}</TableCell>
                        <TableCell>{t('products.status')}</TableCell>
                        <TableCell>{t('common.dateAdded')}</TableCell>
                        <TableCell align="right">{t('common.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {user.favorites.map((favorite) => (
                        <TableRow key={favorite.id}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar
                                src={favorite.product.mainImageUrl}
                                sx={{ width: 40, height: 40 }}
                              />
                              <Typography variant="body2">
                                {favorite.product.title}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              ${favorite.product.currentBid.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t(`products.auctionStatus.${favorite.product.auctionStatus.toLowerCase()}`)}
                              size="small"
                              color={favorite.product.auctionStatus === 'LIVE' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(favorite.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title={t('common.viewProduct')}>
                              <IconButton
                                size="small"
                                onClick={() => router.push(`/dashboard/products/${favorite.product.id}`)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Balance Update Dialog */}
      <Dialog
        open={balanceDialog.open}
        onClose={() => setBalanceDialog({ ...balanceDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('users.updateBalance')} ({balanceDialog.type === 'real' ? t('users.realBalance') : t('users.virtualBalance')})
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('users.newBalance')}
            type="number"
            fullWidth
            variant="outlined"
            value={balanceDialog.newValue}
            onChange={(e) => setBalanceDialog({ ...balanceDialog, newValue: e.target.value })}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBalanceDialog({ ...balanceDialog, open: false })}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleBalanceUpdate}
            variant="contained"
            sx={{ bgcolor: '#CE0E2D', '&:hover': { bgcolor: '#B0122A' } }}
          >
            {t('common.update')}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}