'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import {
  Box,
  Grid,
  Card,
  Chip,
  Stack,
  Button,
  Select,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  Pagination,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';

import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Gavel as AuctionIcon,
} from '@mui/icons-material';

import { formatCurrency, formatTimeRemaining, formatDate } from 'src/lib/utils';

interface Auction {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  location: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  auctionStatus: 'SCHEDULED' | 'LIVE' | 'ENDED';
  startTime: string | null;
  endTime: string | null;
  currentBid: number;
  startingBid: number;
  bidCount: number;
  uniqueBidders: number;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  agent: {
    id: string;
    displayName: string;
    businessName: string;
    logoUrl?: string;
  } | null;
}

interface AuctionsResponse {
  auctions: Auction[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function AuctionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

  useEffect(() => {
    loadAuctions();
  }, [currentPage, statusFilter, sortBy, searchQuery]);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '12');
      
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      if (statusFilter !== 'all') {
        params.set('auctionStatus', statusFilter.toUpperCase());
      }
      params.set('sortBy', sortBy);

      const response = await fetch(`/api/auctions?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAuctions(data.data || []);
        if (data.meta?.pagination) {
          setPagination({
            page: data.meta.pagination.page,
            totalPages: data.meta.pagination.totalPages,
            totalCount: data.meta.pagination.totalCount,
          });
        }
      } else {
        setError(data.error?.message || 'Failed to load auctions');
      }
    } catch (err) {
      console.error('Error loading auctions:', err);
      setError('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURL();
    loadAuctions();
  };

  const handleFilterChange = (key: string, value: string) => {
    setCurrentPage(1);
    if (key === 'status') setStatusFilter(value);
    if (key === 'sortBy') setSortBy(value);
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sortBy !== 'newest') params.set('sortBy', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const queryString = params.toString();
    const newUrl = queryString ? `/auctions?${queryString}` : '/auctions';
    window.history.pushState(null, '', newUrl);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    updateURL();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'error';
      case 'SCHEDULED': return 'info';
      case 'ENDED': return 'default';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'success';
      case 'EXCELLENT': return 'info';
      case 'GOOD': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AuctionIcon sx={{ mr: 1 }} />
          Live Auctions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and bid on unique items from our trusted sellers
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSearchSubmit}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search auctions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="live">Live</MenuItem>
                  <MenuItem value="ended">Ended</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="ending_soon">Ending Soon</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SearchIcon />}
                  sx={{ flexGrow: 1 }}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setSortBy('newest');
                    setCurrentPage(1);
                    router.push('/auctions');
                  }}
                >
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Card>

      {/* Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : auctions.length === 0 ? (
        <Alert severity="info">
          No auctions found matching your criteria.
        </Alert>
      ) : (
        <>
          {/* Results Count */}
          <Box mb={3}>
            <Typography variant="body2" color="text.secondary">
              Showing {auctions.length} of {pagination.totalCount} auctions
            </Typography>
          </Box>

          {/* Auctions Grid */}
          <Grid container spacing={3}>
            {auctions.map((auction) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={auction.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => router.push(`/auctions/${auction.id}`)}
                >
                  {/* Image */}
                  {auction.images?.length > 0 && (
                    <Box
                      component="img"
                      src={auction.images?.[0]}
                      alt={auction.title}
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                      }}
                    />
                  )}

                  <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box mb={2}>
                      <Stack direction="row" spacing={1} mb={1}>
                        <Chip
                          label={auction.auctionStatus}
                          color={getStatusColor(auction.auctionStatus)}
                          size="small"
                        />
                        <Chip
                          label={auction.condition.replace('_', ' ')}
                          color={getConditionColor(auction.condition)}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      
                      <Typography variant="h6" gutterBottom noWrap>
                        {auction.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {auction.description}
                      </Typography>
                    </Box>

                    {/* Pricing */}
                    <Box mb={2} sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" color="primary.main" gutterBottom>
                        {formatCurrency(auction.currentBid)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Current Bid • {auction.bidCount} bid{auction.bidCount !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Estimate: {formatCurrency(auction.estimatedValueMin)} - {formatCurrency(auction.estimatedValueMax)}
                      </Typography>
                    </Box>

                    {/* Timing */}
                    {(auction.startTime || auction.endTime) && (
                      <Box mb={2}>
                        <Typography variant="caption" color="text.secondary">
                          {auction.auctionStatus === 'SCHEDULED' && auction.startTime
                            ? `Starts ${formatTimeRemaining(auction.startTime)}`
                            : auction.auctionStatus === 'LIVE' && auction.endTime
                            ? `Ends ${formatTimeRemaining(auction.endTime)}`
                            : auction.auctionStatus === 'ENDED' && auction.endTime
                            ? `Ended ${formatDate(auction.endTime)}`
                            : 'Time not available'
                          }
                        </Typography>
                      </Box>
                    )}

                    {/* Category & Seller */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      {auction.category && (
                        <Typography variant="caption" color="text.secondary">
                          {auction.category.name}
                        </Typography>
                      )}
                      {auction.agent ? (
                        <Typography variant="caption" color="text.secondary">
                          by {auction.agent.displayName}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          by Unknown Seller
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}