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
  transactionType: string;
  amountReal: number;
  amountVirtual: number;
  currency: string;
  status: string;
  description: string;
  userId: string;
  userEmail?: string;
  auctionId?: string;
  auctionTitle?: string;
  paymentMethod?: string;
  externalReference?: string;
  createdAt: string;
  processedAt?: string;
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
    
    const matchesType = typeFilter === 'all' || transaction.transactionType.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || transaction.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  const getTransactionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'DEPOSIT':
        return <TrendingUpIcon />;
      case 'WITHDRAWAL':
        return <TrendingDownIcon />;
      case 'BID_PLACEMENT':
      case 'AUCTION_WIN':
        return <TrendingDownIcon />;
      case 'REFUND':
        return <TrendingUpIcon />;
      case 'COMMISSION':
      case 'FEE':
        return <TrendingDownIcon />;
      default:
        return <WalletIcon />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'DEPOSIT':
      case 'REFUND':
        return 'success';
      case 'WITHDRAWAL':
      case 'BID_PLACEMENT':
      case 'AUCTION_WIN':
      case 'COMMISSION':
      case 'FEE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
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
                <MenuItem value="DEPOSIT">Deposit</MenuItem>
                <MenuItem value="WITHDRAWAL">Withdrawal</MenuItem>
                <MenuItem value="BID_PLACEMENT">Bid Placement</MenuItem>
                <MenuItem value="AUCTION_WIN">Auction Win</MenuItem>
                <MenuItem value="REFUND">Refund</MenuItem>
                <MenuItem value="COMMISSION">Commission</MenuItem>
                <MenuItem value="FEE">Fee</MenuItem>
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
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
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
                  <TableCell>Real Amount</TableCell>
                  <TableCell>Virtual Amount</TableCell>
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
                            backgroundColor: `${getTransactionColor(transaction.transactionType)}.light`
                          }}
                        >
                          {getTransactionIcon(transaction.transactionType)}
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
                          {transaction.externalReference && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Ref: {transaction.externalReference}
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
                      {transaction.amountReal !== 0 ? (
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={getTransactionColor(transaction.transactionType) + '.main'}
                        >
                          {transaction.amountReal > 0 ? '+' : ''}
                          {formatCurrency(transaction.amountReal)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.amountVirtual !== 0 ? (
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color="primary.main"
                        >
                          {transaction.amountVirtual > 0 ? '+' : ''}
                          {formatCurrency(transaction.amountVirtual)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.transactionType.replace('_', ' ')}
                        size="small"
                        color={getTransactionColor(transaction.transactionType) as any}
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
                        {transaction.paymentMethod || '-'}
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
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Loading transactions...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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