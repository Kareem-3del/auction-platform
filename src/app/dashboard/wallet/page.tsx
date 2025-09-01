'use client';

import { useState, useEffect } from 'react';

import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  AccountBalanceWallet as WalletIcon,
  CreditCard as CreditCardIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Chip,
  List,
  Alert,
  Stack,
  Button,
  ListItem,
  Typography,
  CardContent,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { useAuth } from 'src/hooks/useAuth';

import BinanceLogo from 'src/components/icons/BinanceLogo';
import WhishLogo from 'src/components/icons/WhishLogo';

// Types
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  balanceReal: number;
  balanceVirtual: number;
  virtualMultiplier: number;
}

interface Transaction {
  id: string;
  transactionType: string;
  amountReal: number;
  amountVirtual: number;
  currency: string;
  status: string;
  description: string;
  paymentMethod?: string;
  createdAt: string;
}

// Main Component
export default function DashboardWalletPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'binance' | 'whish' | null>(null);
  const [chargeAmount, setChargeAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Predefined amounts
  const predefinedAmounts = [10, 25, 50, 100, 250, 500, 1000];

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Fetch profile data
      const profileResponse = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileResponse.json();
      if (profileData.success) {
        setProfile({
          ...profileData.data.profile,
          balanceReal: Number(profileData.data.profile.balanceReal || 0),
          balanceVirtual: Number(profileData.data.profile.balanceVirtual || 0),
          virtualMultiplier: Number(profileData.data.profile.virtualMultiplier || 3),
        });
        setTransactions(profileData.data.profile.transactions || []);
      } else {
        setError(profileData.error?.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (method: 'binance' | 'whish', amount: number) => {
    if (!profile) return;

    try {
      setRechargeLoading(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const endpoint = method === 'binance' ? '/api/binance/recharge' : '/api/whish/recharge';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          amount,
          currency: 'USD',
          paymentMethod: method === 'binance' ? 'BINANCE_PAY' : 'WHISH_MONEY'
        }),
      });

      const data = await response.json();

      if (data.success) {
        const methodName = method === 'binance' ? 'Binance Pay' : 'Whish.money';
        setSuccess(`✅ Successfully recharged $${amount} via ${methodName}! Virtual balance: $${(amount * profile.virtualMultiplier).toFixed(2)}`);
        
        // Clear selections
        setSelectedPaymentMethod(null);
        setChargeAmount(null);
        
        // Refresh wallet data
        setTimeout(() => {
          fetchWalletData();
        }, 1000);
      } else {
        setError(data.error?.message || 'Recharge failed');
      }
    } catch (err) {
      console.error('Recharge error:', err);
      setError('Network error during recharge');
    } finally {
      setRechargeLoading(false);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return <ArrowDownIcon color="success" />;
      case 'withdrawal':
        return <ArrowUpIcon color="error" />;
      case 'bid_placement':
        return <CreditCardIcon color="primary" />;
      default:
        return <WalletIcon />;
    }
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={48} />
        </Box>
      </DashboardContent>
    );
  }

  if (!profile) {
    return (
      <DashboardContent>
        <Alert severity="error">Failed to load wallet data</Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              💰 Wallet Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your balances and recharge your wallet
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchWalletData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Balance Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'success.lighter',
                      color: 'success.dark',
                    }}
                  >
                    <WalletIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6">Real Balance</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available for bidding & withdrawals
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {formatCurrency(profile.balanceReal)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'primary.lighter',
                      color: 'primary.dark',
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6">Virtual Balance</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Practice bidding • {profile.virtualMultiplier}x multiplier
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="h3" color="primary.main" fontWeight="bold">
                  {formatCurrency(profile.balanceVirtual)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recharge Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              💳 Recharge Wallet
            </Typography>

            {/* Payment Method Selection */}
            {!selectedPaymentMethod && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Choose Payment Method
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        minHeight: { xs: '120px', sm: 'auto' },
                        '&:hover': {
                          transform: { xs: 'scale(1.02)', sm: 'translateY(-4px)' },
                          boxShadow: '0 12px 40px rgba(240,185,11,0.2)',
                          borderColor: '#F0B90B',
                        },
                      }}
                      onClick={() => setSelectedPaymentMethod('binance')}
                    >
                      <CardContent sx={{ 
                        p: { xs: 2, sm: 3 }, 
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%'
                      }}>
                        <BinanceLogo sx={{ fontSize: 48, mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Binance Pay
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Fast crypto payments with low fees
                        </Typography>
                        <Chip
                          label="0.1% Fee • Instant"
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 600 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        minHeight: { xs: '120px', sm: 'auto' },
                        '&:hover': {
                          transform: { xs: 'scale(1.02)', sm: 'translateY(-4px)' },
                          boxShadow: '0 12px 40px rgba(99,102,241,0.2)',
                          borderColor: '#6366f1',
                        },
                      }}
                      onClick={() => setSelectedPaymentMethod('whish')}
                    >
                      <CardContent sx={{ 
                        p: { xs: 2, sm: 3 }, 
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%'
                      }}>
                        <WhishLogo sx={{ fontSize: 48, mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Whish.money
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Modern payment solution
                        </Typography>
                        <Chip
                          label="2.5% Fee • Instant"
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Amount Selection */}
            {selectedPaymentMethod && !chargeAmount && (
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                  <Typography variant="h6">
                    Select Amount - {selectedPaymentMethod === 'binance' ? 'Binance Pay' : 'Whish.money'}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectedPaymentMethod(null);
                      setChargeAmount(null);
                      setCustomAmount('');
                    }}
                  >
                    Change Method
                  </Button>
                </Stack>
                
                <Grid container spacing={2}>
                  {predefinedAmounts.map((amount) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={amount}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          setChargeAmount(amount);
                          setCustomAmount(''); // Clear custom amount when predefined is selected
                        }}
                        sx={{
                          py: { xs: 1.5, sm: 2 },
                          px: { xs: 1, sm: 2 },
                          fontSize: { xs: '0.9rem', sm: '1.1rem' },
                          fontWeight: 600,
                          borderRadius: 2,
                          borderColor: selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1',
                          color: selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1',
                          minHeight: { xs: '44px', sm: 'auto' }, // Ensure touch-friendly on mobile
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
                
                {/* Custom Amount Input */}
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    or enter custom amount
                  </Typography>
                </Divider>
                
                <Box sx={{ maxWidth: { xs: '100%', sm: 300 }, mx: 'auto' }}>
                  <TextField
                    fullWidth
                    label="Enter Amount"
                    value={customAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers and decimal point
                      if (/^\d*\.?\d*$/.test(value)) {
                        setCustomAmount(value);
                      }
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    placeholder="0.00"
                    inputProps={{
                      inputMode: 'decimal',
                      pattern: '[0-9]*\\.?[0-9]*',
                      min: '1',
                      max: '10000',
                    }}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1',
                        },
                        '&:hover fieldset': {
                          borderColor: selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1',
                      },
                    }}
                  />
                  
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={!customAmount || parseFloat(customAmount) < 1 || parseFloat(customAmount) > 10000}
                    onClick={() => {
                      const amount = parseFloat(customAmount);
                      if (amount >= 1 && amount <= 10000) {
                        setChargeAmount(amount);
                      }
                    }}
                    sx={{
                      py: 1.5,
                      backgroundColor: selectedPaymentMethod === 'binance' ? '#F0B90B' : '#6366f1',
                      '&:hover': {
                        backgroundColor: selectedPaymentMethod === 'binance' ? '#d9a00a' : '#5856eb',
                      },
                      '&:disabled': {
                        backgroundColor: 'rgba(0, 0, 0, 0.12)',
                      },
                    }}
                  >
                    Use ${customAmount || '0'} Amount
                  </Button>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    Min: $1 • Max: $10,000
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Confirmation */}
            {selectedPaymentMethod && chargeAmount && (
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                  <Typography variant="h6">
                    Confirm Recharge
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setChargeAmount(null);
                      setCustomAmount('');
                    }}
                  >
                    Change Amount
                  </Button>
                </Stack>
                
                <Card variant="outlined" sx={{ mb: 3, p: 3, backgroundColor: 'background.neutral' }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Payment Method:</Typography>
                      <Typography fontWeight={600}>
                        {selectedPaymentMethod === 'binance' ? 'Binance Pay' : 'Whish.money'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Amount:</Typography>
                      <Typography fontWeight={600} color="success.main">
                        {formatCurrency(chargeAmount)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Virtual Balance Added:</Typography>
                      <Typography fontWeight={600} color="primary.main">
                        {formatCurrency(chargeAmount * profile.virtualMultiplier)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Processing Fee:</Typography>
                      <Typography fontWeight={600}>
                        {formatCurrency(chargeAmount * (selectedPaymentMethod === 'binance' ? 0.001 : 0.025))}
                      </Typography>
                    </Stack>
                  </Stack>
                </Card>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => handleRecharge(selectedPaymentMethod, chargeAmount)}
                  disabled={rechargeLoading}
                  sx={{
                    py: 2,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    background: selectedPaymentMethod === 'binance'
                      ? 'linear-gradient(45deg, #F0B90B 0%, #F0B90B 100%)'
                      : 'linear-gradient(45deg, #6366f1 0%, #8b5cf6 100%)',
                  }}
                >
                  {rechargeLoading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 2 }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      {selectedPaymentMethod === 'binance' ? (
                        <BinanceLogo sx={{ fontSize: 24, mr: 2 }} />
                      ) : (
                        <WhishLogo sx={{ fontSize: 24, mr: 2 }} />
                      )}
                      Recharge {formatCurrency(chargeAmount)}
                    </>
                  )}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              📊 Recent Transactions
            </Typography>
            
            {transactions.length > 0 ? (
              <List>
                {transactions.slice(0, 10).map((transaction) => (
                  <ListItem key={transaction.id} divider>
                    <ListItemIcon>
                      {getTransactionIcon(transaction.transactionType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" fontWeight={500}>
                            {transaction.description}
                          </Typography>
                          <Box textAlign="right">
                            {transaction.amountReal !== 0 && (
                              <Typography 
                                variant="body1" 
                                color={transaction.amountReal > 0 ? 'success.main' : 'error.main'}
                                fontWeight={600}
                              >
                                {transaction.amountReal > 0 ? '+' : ''}
                                {formatCurrency(transaction.amountReal)}
                              </Typography>
                            )}
                            {transaction.amountVirtual !== 0 && (
                              <Typography 
                                variant="body2" 
                                color="primary.main"
                              >
                                {transaction.amountVirtual > 0 ? '+' : ''}
                                {formatCurrency(transaction.amountVirtual)} Virtual
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      }
                      secondary={
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(transaction.createdAt)}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={getStatusColor(transaction.status)}
                            />
                            {transaction.paymentMethod && (
                              <Chip
                                label={transaction.paymentMethod}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No transactions found. Start by making your first recharge!
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardContent>
  );
}