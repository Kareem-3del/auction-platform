'use client';

import { useState, useEffect } from 'react';

import {
  Box,
  Tab,
  Card,
  Grid,
  Tabs,
  List,
  Chip,
  Paper,
  Alert,
  Stack,
  Button,
  Dialog,
  ListItem,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  ListItemText,
  ListItemIcon,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Info as InfoIcon,
  SwapHoriz as SwapIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  AccountBalance as BankIcon,
  ArrowUpward as ArrowUpIcon,
  TrendingUp as TrendingUpIcon,
  CreditCard as CreditCardIcon,
  ArrowDownward as ArrowDownIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';

import { useAuth, getAccessToken } from 'src/hooks/useAuth';

import { formatDate, formatCurrency } from 'src/lib/utils';

import Layout from 'src/components/layout/Layout';

interface BalanceData {
  balances: {
    real: number;
    virtual: number;
    totalEquivalent: number;
    virtualMultiplier: number;
    maxVirtualFromReal: number;
  };
  recentTransactions: Array<{
    id: string;
    transactionType: string;
    amountReal: number;
    amountVirtual: number;
    currency: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
  paymentMethods: Array<{
    id: string;
    methodType: string;
    provider: string;
    isDefault: boolean;
    isVerified: boolean;
  }>;
}

interface DepositFormData {
  amount: string;
  paymentMethodId: string;
  description: string;
}

interface TransferFormData {
  fromBalance: 'real' | 'virtual';
  toBalance: 'real' | 'virtual';
  amount: string;
  description: string;
}

export default function WalletPage() {
  const { user } = useAuth();
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [depositForm, setDepositForm] = useState<DepositFormData>({
    amount: '',
    paymentMethodId: '',
    description: '',
  });

  const [transferForm, setTransferForm] = useState<TransferFormData>({
    fromBalance: 'real',
    toBalance: 'virtual',
    amount: '',
    description: '',
  });

  useEffect(() => {
    if (user) {
      loadBalanceData();
    }
  }, [user]);

  const loadBalanceData = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to view wallet data');
        return;
      }

      const response = await fetch('/api/users/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance data');
      }

      const data = await response.json();
      if (data.success) {
        setBalanceData(data.data.balance);
      } else {
        setError(data.error?.message || 'Failed to load balance data');
      }
    } catch (err) {
      setError('Failed to load balance data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!validateDepositForm()) return;

    try {
      setProcessing(true);
      setError(null);

      const token = getAccessToken();
      if (!token) {
        setError('Please log in to make a deposit');
        return;
      }

      const response = await fetch('/api/users/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(depositForm.amount),
          paymentMethodId: depositForm.paymentMethodId || undefined,
          description: depositForm.description || undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Deposit of ${formatCurrency(parseFloat(depositForm.amount))} completed successfully!`);
        setDepositDialogOpen(false);
        setDepositForm({ amount: '', paymentMethodId: '', description: '' });
        await loadBalanceData();
      } else {
        setError(data.error?.message || 'Deposit failed');
      }
    } catch (err) {
      setError('Deposit failed due to network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransfer = async () => {
    if (!validateTransferForm()) return;

    try {
      setProcessing(true);
      setError(null);

      const token = getAccessToken();
      if (!token) {
        setError('Please log in to make a transfer');
        return;
      }

      const response = await fetch('/api/users/balance/transfer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromBalance: transferForm.fromBalance,
          toBalance: transferForm.toBalance,
          amount: parseFloat(transferForm.amount),
          description: transferForm.description || undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const transfer = data.data.transfer;
        setSuccess(
          `Successfully transferred ${formatCurrency(transfer.originalAmount)} from ${transfer.fromBalance} to ${transfer.toBalance} balance`
        );
        setTransferDialogOpen(false);
        setTransferForm({ fromBalance: 'real', toBalance: 'virtual', amount: '', description: '' });
        await loadBalanceData();
      } else {
        setError(data.error?.message || 'Transfer failed');
      }
    } catch (err) {
      setError('Transfer failed due to network error');
    } finally {
      setProcessing(false);
    }
  };

  const validateDepositForm = () => {
    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid deposit amount');
      return false;
    }
    if (amount > 100000) {
      setError('Maximum deposit amount is $100,000');
      return false;
    }
    return true;
  };

  const validateTransferForm = () => {
    const amount = parseFloat(transferForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid transfer amount');
      return false;
    }
    if (transferForm.fromBalance === transferForm.toBalance) {
      setError('Cannot transfer to the same balance type');
      return false;
    }
    
    if (balanceData) {
      const availableBalance = transferForm.fromBalance === 'real' 
        ? balanceData.balances.real 
        : balanceData.balances.virtual;
      
      if (amount > availableBalance) {
        setError(`Insufficient ${transferForm.fromBalance} balance. Available: ${formatCurrency(availableBalance)}`);
        return false;
      }
    }
    
    return true;
  };

  const getTransactionIcon = (type: string, amountReal: number, amountVirtual: number) => {
    if (type === 'DEPOSIT') return <ArrowDownIcon color="success" />;
    if (type === 'WITHDRAWAL') return <ArrowUpIcon color="error" />;
    if (type === 'TRANSFER') return <SwapIcon color="primary" />;
    return <HistoryIcon />;
  };

  const getTransactionColor = (type: string, status: string) => {
    if (status === 'PENDING') return 'warning';
    if (status === 'FAILED') return 'error';
    if (type === 'DEPOSIT') return 'success';
    if (type === 'WITHDRAWAL') return 'error';
    return 'primary';
  };

  if (loading) {
    return (
      <Layout>
        <Box p={3}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading wallet...
          </Typography>
        </Box>
      </Layout>
    );
  }

  if (!balanceData) {
    return (
      <Layout>
        <Box p={3}>
          <Alert severity="error">Failed to load wallet data</Alert>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={3} maxWidth="1200px" mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" gutterBottom>
          My Wallet
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDepositDialogOpen(true)}
          >
            Deposit
          </Button>
          <Button
            variant="outlined"
            startIcon={<SwapIcon />}
            onClick={() => setTransferDialogOpen(true)}
          >
            Transfer
          </Button>
          <IconButton onClick={loadBalanceData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

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
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WalletIcon sx={{ mr: 1, color: 'primary.main', fontSize: 30 }} />
                <Typography variant="h6">Real Balance</Typography>
              </Box>
              <Typography variant="h3" color="primary.main" gutterBottom>
                {formatCurrency(balanceData.balances.real)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available for bidding and withdrawals
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon sx={{ mr: 1, color: 'secondary.main', fontSize: 30 }} />
                <Typography variant="h6">Virtual Balance</Typography>
              </Box>
              <Typography variant="h3" color="secondary.main" gutterBottom>
                {formatCurrency(balanceData.balances.virtual)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Practice bidding • {balanceData.balances.virtualMultiplier}x multiplier
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <InfoIcon sx={{ mr: 1, color: 'info.main', fontSize: 30 }} />
                <Typography variant="h6">Total Equivalent</Typography>
              </Box>
              <Typography variant="h3" color="info.main" gutterBottom>
                {formatCurrency(balanceData.balances.totalEquivalent)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Combined value of all balances
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Virtual Balance Info */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          💡 About Virtual Balance
        </Typography>
        <Typography variant="body2" paragraph>
          Virtual balance allows you to practice bidding without using real money. 
          Convert real balance to virtual with a {balanceData.balances.virtualMultiplier}x multiplier, or convert virtual back to real.
        </Typography>
        <Box display="flex" gap={2}>
          <Typography variant="body2">
            <strong>Max Virtual from Real:</strong> {formatCurrency(balanceData.balances.maxVirtualFromReal)}
          </Typography>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Transaction History" />
          <Tab label="Payment Methods" />
        </Tabs>

        {/* Transaction History Tab */}
        {tabValue === 0 && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            {balanceData.recentTransactions.length > 0 ? (
              <List>
                {balanceData.recentTransactions.map((transaction) => (
                  <ListItem key={transaction.id} divider>
                    <ListItemIcon>
                      {getTransactionIcon(
                        transaction.transactionType,
                        transaction.amountReal,
                        transaction.amountVirtual
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1">
                            {transaction.description}
                          </Typography>
                          <Box textAlign="right">
                            {transaction.amountReal !== 0 && (
                              <Typography 
                                variant="body1" 
                                color={transaction.amountReal > 0 ? 'success.main' : 'error.main'}
                              >
                                {transaction.amountReal > 0 ? '+' : ''}
                                {formatCurrency(transaction.amountReal)} Real
                              </Typography>
                            )}
                            {transaction.amountVirtual !== 0 && (
                              <Typography 
                                variant="body2" 
                                color={transaction.amountVirtual > 0 ? 'secondary.main' : 'text.secondary'}
                              >
                                {transaction.amountVirtual > 0 ? '+' : ''}
                                {formatCurrency(transaction.amountVirtual)} Virtual
                              </Typography>
                            )}
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
                            size="small"
                            color={getTransactionColor(transaction.transactionType, transaction.status)}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No transactions found</Alert>
            )}
          </Box>
        )}

        {/* Payment Methods Tab */}
        {tabValue === 1 && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Payment Methods
            </Typography>
            {balanceData.paymentMethods.length > 0 ? (
              <List>
                {balanceData.paymentMethods.map((method) => (
                  <ListItem key={method.id} divider>
                    <ListItemIcon>
                      {method.methodType === 'CREDIT_CARD' ? <CreditCardIcon /> : <BankIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="body1">
                            {method.provider}
                          </Typography>
                          {method.isDefault && (
                            <Chip label="Default" size="small" color="primary" />
                          )}
                          {method.isVerified && (
                            <Chip label="Verified" size="small" color="success" />
                          )}
                        </Box>
                      }
                      secondary={`Type: ${method.methodType}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No payment methods configured. Add a payment method to make deposits.
              </Alert>
            )}
          </Box>
        )}
      </Paper>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onClose={() => setDepositDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deposit Funds</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            <TextField
              fullWidth
              label="Amount (USD)"
              type="number"
              value={depositForm.amount}
              onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
              inputProps={{ min: 1, max: 100000, step: 0.01 }}
            />
            
            <TextField
              select
              fullWidth
              label="Payment Method"
              value={depositForm.paymentMethodId}
              onChange={(e) => setDepositForm({ ...depositForm, paymentMethodId: e.target.value })}
              helperText="Leave empty for default method"
            >
              <MenuItem value="">Default Method</MenuItem>
              {balanceData.paymentMethods.map((method) => (
                <MenuItem key={method.id} value={method.id}>
                  {method.provider} ({method.methodType})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Description (Optional)"
              value={depositForm.description}
              onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })}
              multiline
              rows={2}
            />

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Demo Mode:</strong> This deposit will be processed immediately for demonstration purposes. 
                In production, this would integrate with Binance Pay or other payment processors.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeposit} variant="contained" disabled={processing}>
            {processing ? 'Processing...' : 'Deposit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Between Balances</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            <TextField
              select
              fullWidth
              label="From Balance"
              value={transferForm.fromBalance}
              onChange={(e) => setTransferForm({ 
                ...transferForm, 
                fromBalance: e.target.value as 'real' | 'virtual',
                toBalance: e.target.value === 'real' ? 'virtual' : 'real'
              })}
            >
              <MenuItem value="real">
                Real Balance ({formatCurrency(balanceData.balances.real)})
              </MenuItem>
              <MenuItem value="virtual">
                Virtual Balance ({formatCurrency(balanceData.balances.virtual)})
              </MenuItem>
            </TextField>

            <TextField
              select
              fullWidth
              label="To Balance"
              value={transferForm.toBalance}
              onChange={(e) => setTransferForm({ 
                ...transferForm, 
                toBalance: e.target.value as 'real' | 'virtual',
                fromBalance: e.target.value === 'real' ? 'virtual' : 'real'
              })}
            >
              <MenuItem value="real">Real Balance</MenuItem>
              <MenuItem value="virtual">Virtual Balance</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={transferForm.amount}
              onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
              inputProps={{ min: 0.01, step: 0.01 }}
              helperText={`Available: ${formatCurrency(
                transferForm.fromBalance === 'real' 
                  ? balanceData.balances.real 
                  : balanceData.balances.virtual
              )}`}
            />

            <TextField
              fullWidth
              label="Description (Optional)"
              value={transferForm.description}
              onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
              multiline
              rows={2}
            />

            {transferForm.amount && (
              <Alert severity="info">
                <Typography variant="body2">
                  {transferForm.fromBalance === 'real' && transferForm.toBalance === 'virtual' ? (
                    <>Converting {formatCurrency(parseFloat(transferForm.amount))} real to {formatCurrency(parseFloat(transferForm.amount) * balanceData.balances.virtualMultiplier)} virtual</>
                  ) : (
                    <>Converting {formatCurrency(parseFloat(transferForm.amount))} virtual to {formatCurrency(parseFloat(transferForm.amount) / balanceData.balances.virtualMultiplier)} real</>
                  )}
                </Typography>
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleTransfer} variant="contained" disabled={processing}>
            {processing ? 'Processing...' : 'Transfer'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Layout>
  );
}