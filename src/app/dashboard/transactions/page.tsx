'use client';

import { useState, useEffect } from 'react';

import {
  Search as SearchIcon,
  SwapHoriz as TransferIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Alert,
  Select,
  Avatar,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  TableContainer,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  userId: string;
  userEmail?: string;
  auctionId?: string;
  auctionTitle?: string;
  paymentMethod: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/transactions');

        if (data.success) {
          setTransactions(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to load transactions');
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
        setError('An unexpected error occurred');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const filteredTransactions = Array.isArray(transactions) ? transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.auctionTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'bid':
      case 'payment':
        return <TrendingDownIcon />;
      case 'refund':
      case 'payout':
        return <TrendingUpIcon />;
      case 'transfer':
        return <TransferIcon />;
      default:
        return <WalletIcon />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'bid':
      case 'payment':
        return 'error';
      case 'refund':
      case 'payout':
        return 'success';
      case 'transfer':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Transactions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage platform transactions
            </Typography>
          </Box>
        </Stack>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ flex: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="bid">Bid</MenuItem>
                <MenuItem value="payment">Payment</MenuItem>
                <MenuItem value="refund">Refund</MenuItem>
                <MenuItem value="payout">Payout</MenuItem>
                <MenuItem value="transfer">Transfer</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Transactions Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{ 
                            width: 40, 
                            height: 40,
                            backgroundColor: `${getTransactionColor(transaction.type)}.light`
                          }}
                        >
                          {getTransactionIcon(transaction.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {transaction.description}
                          </Typography>
                          {transaction.auctionTitle && (
                            <Typography variant="caption" color="text.secondary">
                              Auction: {transaction.auctionTitle}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.userEmail || 'Unknown User'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        color={getTransactionColor(transaction.type) + '.main'}
                      >
                        {transaction.type === 'refund' || transaction.type === 'payout' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type}
                        size="small"
                        color={getTransactionColor(transaction.type) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        size="small"
                        color={getStatusColor(transaction.status) as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {transaction.paymentMethod}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(transaction.createdAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Loading transactions...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No transactions match your search' : 'No transactions found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </DashboardContent>
  );
}