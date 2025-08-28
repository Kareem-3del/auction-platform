'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Edit as EditIcon,
  Timer as TimerIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Alert,
  Table,
  Paper,
  Button,
  Avatar,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  LinearProgress,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Product {
  id: string;
  title: string;
  description: string;
  images?: string[];
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Bid {
  id: string;
  amount: number;
  bidTime: string;
  userId: string;
  user?: User;
}

interface Auction {
  id: string;
  title: string;
  description: string;
  startingBid: number;
  currentBid: number;
  reservePrice?: number;
  bidIncrement: number;
  startTime: string;
  endTime: string;
  status: string;
  bidCount: number;
  viewCount: number;
  productId: string;
  product?: Product;
  bids?: Bid[];
  createdAt: string;
  updatedAt: string;
}

export default function ViewAuctionPage() {
  const router = useRouter();
  const params = useParams();
  const auctionId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAuction = async () => {
      try {
        const data = await apiClient.get(`/api/auctions/${auctionId}?includeBids=true&includeProduct=true`);

        if (data.success) {
          setAuction(data.data);
        } else {
          setError(data.error?.message || 'Failed to load auction');
        }
      } catch (error) {
        console.error('Error loading auction:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadAuction();
  }, [auctionId]);

  const handleBack = () => {
    router.push('/dashboard/auctions');
  };

  const handleEdit = () => {
    router.push(`/dashboard/auctions/${auctionId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this auction?')) {
      return;
    }

    try {
      const data = await apiClient.delete(`/api/auctions/${auctionId}`);

      if (data.success) {
        router.push('/dashboard/auctions');
      } else {
        setError(data.error?.message || 'Failed to delete auction');
      }
    } catch (error) {
      console.error('Error deleting auction:', error);
      setError('An unexpected error occurred');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
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

    if (days > 0) return `${days} days, ${hours} hours`;
    if (hours > 0) return `${hours} hours, ${minutes} minutes`;
    return `${minutes} minutes`;
  };

  const getAuctionProgress = () => {
    if (!auction) return 0;
    
    const now = new Date().getTime();
    const start = new Date(auction.startTime).getTime();
    const end = new Date(auction.endTime).getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (error || !auction) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Auction not found'}
          </Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back to Auctions
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" gutterBottom>
                {auction.title}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={auction.status}
                  color={getStatusColor(auction.status) as any}
                  variant="filled"
                />
                <Typography variant="body2" color="text.secondary">
                  Auction ID: {auction.id}
                </Typography>
              </Stack>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* Left Column - Main Content */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Description */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">
                  {auction.description}
                </Typography>
              </Card>

              {/* Product Information */}
              {auction.product && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Product
                  </Typography>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Avatar
                      src={auction.product.images?.[0]}
                      variant="rounded"
                      sx={{ width: 80, height: 80 }}
                    />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {auction.product.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {auction.product.description}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => router.push(`/dashboard/products/${auction.productId}`)}
                        sx={{ mt: 1 }}
                      >
                        View Product Details
                      </Button>
                    </Box>
                  </Stack>
                </Card>
              )}

              {/* Bidding History */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Bidding History
                </Typography>
                {auction.bids && auction.bids.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Bidder</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {auction.bids
                          .sort((a, b) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime())
                          .map((bid, index) => (
                            <TableRow key={bid.id} sx={{ bgcolor: index === 0 ? 'success.light' : 'inherit' }}>
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <PersonIcon sx={{ fontSize: 16 }} />
                                  <Typography variant="body2">
                                    {bid.user ? `${bid.user.firstName} ${bid.user.lastName}` : (bid.user as any)?.email || 'Anonymous'}
                                  </Typography>
                                  {index === 0 && (
                                    <Chip label="Winning Bid" size="small" color="success" />
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={index === 0 ? 'bold' : 'normal'}>
                                  {formatCurrency(bid.amount)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(bid.bidTime)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No bids placed yet
                  </Typography>
                )}
              </Card>
            </Stack>
          </Grid>

          {/* Right Column - Auction Details */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Current Status */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Current Status
                </Typography>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Current Bid
                    </Typography>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {formatCurrency(auction.currentBid)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Starting Bid
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(auction.startingBid)}
                    </Typography>
                  </Box>

                  {auction.reservePrice && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Reserve Price
                      </Typography>
                      <Typography variant="body2" color={auction.currentBid >= auction.reservePrice ? 'success.main' : 'warning.main'}>
                        {formatCurrency(auction.reservePrice)}
                        {auction.currentBid >= auction.reservePrice && ' (Met)'}
                      </Typography>
                    </Box>
                  )}

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Bid Increment
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(auction.bidIncrement)}
                    </Typography>
                  </Box>
                </Stack>
              </Card>

              {/* Time Information */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Timing
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Time Remaining
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TimerIcon color="primary" />
                      <Typography variant="body1" fontWeight="medium">
                        {getTimeRemaining(auction.endTime)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={getAuctionProgress()}
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Divider />

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Start Time
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(auction.startTime)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      End Time
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(auction.endTime)}
                    </Typography>
                  </Box>
                </Stack>
              </Card>

              {/* Statistics */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Total Bids
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {auction.bidCount}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Views
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {auction.viewCount}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(auction.createdAt)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(auction.updatedAt)}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </DashboardContent>
  );
}