'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Timer as TimerIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Menu,
  Stack,
  Table,
  Alert,
  Button,
  Avatar,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  TableContainer,
  LinearProgress,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Auction {
  id: string;
  title: string;
  description: string;
  images: string[];
  startingBid: number;
  currentBid: number;
  reservePrice?: number;
  bidIncrement: number;
  startTime: string;
  endTime: string;
  auctionStatus: string;
  status: string;
  bidCount: number;
  viewCount: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  agent?: {
    id: string;
    displayName: string;
    businessName: string;
    logoUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AuctionsPage() {
  const router = useRouter();
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuAuction, setActionMenuAuction] = useState<Auction | null>(null);

  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/products');

        if (data.success) {
          setAuctions(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to load auctions');
        }
      } catch (error) {
        console.error('Error loading auctions:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, []);

  const filteredAuctions = Array.isArray(auctions) ? auctions.filter(auction => {
    const matchesSearch = 
      auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auction.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || auction.auctionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  }) : [];

  const handleCreateAuction = () => {
    router.push('/dashboard/auctions/create');
  };

  const handleViewAuction = (auction: Auction) => {
    router.push(`/dashboard/auctions/${auction.id}`);
    setMenuAnchor(null);
  };

  const handleEditAuction = (auction: Auction) => {
    router.push(`/dashboard/auctions/${auction.id}/edit`);
    setMenuAnchor(null);
  };

  const handleDeleteAuction = async (auction: Auction) => {
    if (confirm(`Are you sure you want to delete "${auction.title}"?`)) {
      try {
        const data = await apiClient.delete(`/api/products/${auction.id}`);

        if (data.success) {
          setAuctions(prev => prev.filter(a => a.id !== auction.id));
        } else {
          setError(data.error?.message || 'Failed to delete auction');
        }
      } catch (error) {
        console.error('Error deleting auction:', error);
        setError('An unexpected error occurred');
      }
    }
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, auction: Auction) => {
    setMenuAnchor(event.currentTarget);
    setActionMenuAuction(auction);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActionMenuAuction(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'success';
      case 'SCHEDULED':
        return 'warning';
      case 'ENDED':
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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const formatTime = (dateString: string) => new Date(dateString).toLocaleString();

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

  const getAuctionProgress = (auction: Auction) => {
    const now = new Date().getTime();
    const start = new Date(auction.startTime).getTime();
    const end = new Date(auction.endTime).getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Auctions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage auctions and bidding
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateAuction}
          >
            Create Auction
          </Button>
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
              placeholder="Search auctions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ flex: 1 }}
            />
          </Stack>
        </Card>

        {/* Auctions Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Auction Item</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Current Bid</TableCell>
                  <TableCell>Time Remaining</TableCell>
                  <TableCell>Bids</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAuctions.map((auction) => (
                  <TableRow key={auction.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {auction.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Starting: {formatCurrency(auction.startingBid)}
                        </Typography>
                        {auction.reservePrice && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Reserve: {formatCurrency(auction.reservePrice)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={auction.images?.[0]}
                          variant="rounded"
                          sx={{ width: 40, height: 40 }}
                        />
                        <Typography variant="body2">
                          {auction.category?.name || 'Uncategorized'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="body2" fontWeight="medium" color="success.main">
                          {formatCurrency(auction.currentBid)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {getTimeRemaining(auction.endTime)}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={getAuctionProgress(auction)}
                          sx={{ width: 80, height: 4, borderRadius: 2 }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={auction.bidCount}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={auction.auctionStatus}
                        size="small"
                        color={getStatusColor(auction.auctionStatus) as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(auction.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, auction)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Loading auctions...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredAuctions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No auctions match your search' : 'No auctions found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => actionMenuAuction && handleViewAuction(actionMenuAuction)}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View
          </MenuItem>
          <MenuItem onClick={() => actionMenuAuction && handleEditAuction(actionMenuAuction)}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem 
            onClick={() => actionMenuAuction && handleDeleteAuction(actionMenuAuction)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </DashboardContent>
  );
}