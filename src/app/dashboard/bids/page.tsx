'use client';

import { useState, useEffect } from 'react';

import {
  Gavel as BidIcon,
  Search as SearchIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  TrendingUp as WinningIcon,
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

interface Bid {
  id: string;
  amount: number;
  bidTime: string;
  status: string;
  isWinning: boolean;
  userId: string;
  userEmail: string;
  userName: string;
  auctionId: string;
  auctionTitle: string;
  auctionEndTime: string;
  auctionStatus: string;
  productTitle: string;
  productImages?: string[];
}

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [auctionStatusFilter, setAuctionStatusFilter] = useState('all');

  useEffect(() => {
    const loadBids = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/bids');

        if (data.success) {
          setBids(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to load bids');
          setBids([]);
        }
      } catch (error) {
        console.error('Error loading bids:', error);
        setError('An unexpected error occurred');
        setBids([]);
      } finally {
        setLoading(false);
      }
    };

    loadBids();
  }, []);

  const filteredBids = Array.isArray(bids) ? bids.filter(bid => {
    const matchesSearch = 
      bid.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.auctionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.productTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    const matchesAuctionStatus = auctionStatusFilter === 'all' || bid.auctionStatus === auctionStatusFilter;

    return matchesSearch && matchesStatus && matchesAuctionStatus;
  }) : [];

  const getBidIcon = (bid: Bid) => {
    if (bid.isWinning) return <WinningIcon color="success" />;
    if (bid.status === 'rejected') return <RejectedIcon color="error" />;
    if (bid.auctionStatus === 'active') return <PendingIcon color="warning" />;
    return <BidIcon color="primary" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'winning':
        return 'success';
      case 'outbid':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'accepted':
        return 'success';
      default:
        return 'default';
    }
  };

  const getAuctionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
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

  const getTimeRemaining = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Bids Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor and manage all bidding activity
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
              placeholder="Search bids..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ flex: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Bid Status</InputLabel>
              <Select
                value={statusFilter}
                label="Bid Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="winning">Winning</MenuItem>
                <MenuItem value="outbid">Outbid</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Auction Status</InputLabel>
              <Select
                value={auctionStatusFilter}
                label="Auction Status"
                onChange={(e) => setAuctionStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Auctions</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Bids Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bidder</TableCell>
                  <TableCell>Auction</TableCell>
                  <TableCell>Bid Amount</TableCell>
                  <TableCell>Bid Status</TableCell>
                  <TableCell>Auction Status</TableCell>
                  <TableCell>Time Remaining</TableCell>
                  <TableCell>Bid Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBids.map((bid) => (
                  <TableRow key={bid.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ width: 40, height: 40 }}>
                          {getBidIcon(bid)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {bid.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {bid.userEmail}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={bid.productImages?.[0]}
                          variant="rounded"
                          sx={{ width: 40, height: 40 }}
                        />
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {bid.auctionTitle}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Product: {bid.productTitle}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        color={bid.isWinning ? 'success.main' : 'text.primary'}
                      >
                        {formatCurrency(bid.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={bid.isWinning ? 'Winning' : bid.status}
                        size="small"
                        color={bid.isWinning ? 'success' : getStatusColor(bid.status) as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={bid.auctionStatus}
                        size="small"
                        color={getAuctionStatusColor(bid.auctionStatus) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getTimeRemaining(bid.auctionEndTime)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(bid.bidTime)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Loading bids...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredBids.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No bids match your search' : 'No bids found'}
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