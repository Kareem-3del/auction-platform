'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Star as StarIcon,
  Search as SearchIcon,
  Gavel as AuctionIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  Box,
  Grid,
  Card,
  Chip,
  Stack,
  Paper,
  Alert,
  Badge,
  Button,
  Select,
  Avatar,
  Divider,
  MenuItem,
  Skeleton,
  Collapse,
  CardMedia,
  TextField,
  Typography,
  Pagination,
  IconButton,
  InputLabel,
  CardContent,
  Breadcrumbs,
  FormControl,
  InputAdornment,
  Link as MuiLink,
} from '@mui/material';

import { formatCurrency, getTimeRemaining, formatTimeRemaining } from 'src/lib/utils';

interface Auction {
  id: string;
  title: string;
  description: string;
  auctionType: string;
  status: string;
  startingBid: number;
  currentBid: number;
  reservePrice?: number;
  bidIncrement: number;
  bidCount: number;
  startTime: string;
  endTime: string;
  timeToStart?: number;
  timeToEnd?: number;
  product: {
    id: string;
    title: string;
    images: string[];
    condition: string;
    location: string;
    estimatedValueMin: number;
    estimatedValueMax: number;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
  agent: {
    id: string;
    displayName: string;
    businessName: string;
    logoUrl?: string;
    rating?: number;
    reviewCount: number;
  };
  winner?: {
    id: string;
    displayName: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children?: Category[];
}

interface SearchFilters {
  search: string;
  status: string;
  auctionType: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  agentId: string;
  sortBy: string;
  timeframe: string;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Auctions' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'LIVE', label: 'Live Now' },
  { value: 'ENDING_SOON', label: 'Ending Soon' },
  { value: 'ENDED', label: 'Ended' },
];

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Types' },
  { value: 'LIVE', label: 'Live Auctions' },
  { value: 'TIMED', label: 'Timed Auctions' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'startingSoon', label: 'Starting Soon' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
  { value: 'mostBids', label: 'Most Bids' },
];

const TIMEFRAME_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
];

export default function AuctionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Helper function to map filter parameter to status
  const getStatusFromFilter = (filter: string | null) => {
    if (!filter) return 'ALL';
    switch (filter) {
      case 'ending-soon': return 'ENDING_SOON';
      case 'live': return 'LIVE';
      case 'scheduled': return 'SCHEDULED';
      case 'ended': return 'ENDED';
      default: return 'ALL';
    }
  };

  // Filters
  const [filters, setFilters] = useState<SearchFilters>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || getStatusFromFilter(searchParams.get('filter')),
    auctionType: searchParams.get('type') || 'ALL',
    categoryId: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    agentId: searchParams.get('agent') || '',
    sortBy: searchParams.get('sort') || 'newest',
    timeframe: searchParams.get('timeframe') || 'all',
  });

  // Real-time updates
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    loadCategories();
    loadAuctions();
    
    // Set up real-time updates for countdown timers
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [searchParams]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    setCurrentPage(page);
    
    // Update filters when URL parameters change
    setFilters({
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || getStatusFromFilter(searchParams.get('filter')),
      auctionType: searchParams.get('type') || 'ALL',
      categoryId: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      agentId: searchParams.get('agent') || '',
      sortBy: searchParams.get('sort') || 'newest',
      timeframe: searchParams.get('timeframe') || 'all',
    });
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to load categories');
      
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadAuctions = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      
      // Convert filter parameter to status if needed
      if (searchParams.get('filter')) {
        const filterValue = searchParams.get('filter');
        const statusValue = getStatusFromFilter(filterValue);
        queryParams.set('auctionStatus', statusValue);
      }
      
      // Add other search params but transform them appropriately
      searchParams.forEach((value, key) => {
        if (key === 'filter') {
          // Skip filter as we already handled it above
          return;
        } else if (key === 'status') {
          queryParams.set('auctionStatus', value);
        } else if (key === 'type') {
          queryParams.set('auctionType', value);
        } else {
          queryParams.set(key, value);
        }
      });

      // Ensure page is set
      if (!queryParams.get('page')) {
        queryParams.set('page', '1');
      }

      // Filter for products with auction status and add auction-specific params
      queryParams.set('auctionOnly', 'true');
      const response = await fetch(`/api/products?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to load auctions');
      
      const data = await response.json();
      if (data.success) {
        // The products API returns data.data (array) and data.pagination
        setAuctions(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      } else {
        setError(data.error?.message || 'Failed to load auctions');
      }
    } catch (err) {
      setError('Failed to load auctions');
      console.error('Error loading auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const queryParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue && filterValue !== 'ALL' && filterValue !== 'all') {
        const paramKey = filterKey === 'sortBy' ? 'sort' : 
                         filterKey === 'categoryId' ? 'category' : 
                         filterKey === 'auctionType' ? 'type' : filterKey;
        queryParams.set(paramKey, filterValue);
      }
    });
    
    queryParams.set('page', '1');
    router.push(`/auctions?${queryParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const queryParams = new URLSearchParams(searchParams.toString());
    queryParams.set('page', page.toString());
    router.push(`/auctions?${queryParams.toString()}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'error';
      case 'ENDING_SOON': return 'warning';
      case 'SCHEDULED': return 'info';
      case 'ENDED': return 'default';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'success';
      case 'LIKE_NEW': return 'info';
      case 'VERY_GOOD': return 'primary';
      case 'GOOD': return 'secondary';
      case 'FAIR': return 'warning';
      case 'POOR': return 'error';
      default: return 'default';
    }
  };

  const renderCountdown = (auction: Auction) => {
    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);
    
    if (auction.status === 'SCHEDULED') {
      const timeRemaining = getTimeRemaining(startTime);
      if (timeRemaining.expired) {
        return <Typography variant="caption" color="success.main">Starting now...</Typography>;
      }
      return (
        <Typography variant="caption" color="info.main">
          Starts in: {formatTimeRemaining(startTime)}
        </Typography>
      );
    } else if (['LIVE', 'ENDING_SOON'].includes(auction.status)) {
      const timeRemaining = getTimeRemaining(endTime);
      if (timeRemaining.expired) {
        return <Typography variant="caption" color="text.secondary">Ended</Typography>;
      }
      return (
        <Typography 
          variant="caption" 
          color={auction.status === 'ENDING_SOON' ? 'error.main' : 'warning.main'}
          fontWeight="medium"
        >
          Ends in: {formatTimeRemaining(endTime)}
        </Typography>
      );
    }
    
    return null;
  };

  const renderAuctionCard = (product: any) => {
    // Parse images from JSON string
    const images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
    const mainImage = images[0] || '/placeholder-auction.jpg';

    return (
      <Card 
        key={product.id} 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          '&:hover': { boxShadow: 4 },
        }}
        onClick={() => router.push(`/products/${product.id}`)}
      >
        <Box position="relative">
          <CardMedia
            component="img"
            height="240"
            image={mainImage}
            alt={product.title}
            sx={{ objectFit: 'cover' }}
          />
          
          {/* Status Badge */}
          <Chip
            label={product.auctionStatus ? product.auctionStatus.replace('_', ' ') : 'Available'}
            color={getStatusColor(product.auctionStatus || 'LIVE')}
            size="small"
            sx={{ position: 'absolute', top: 8, left: 8 }}
          />

          {/* Auction Type Badge */}
          <Chip
            label={product.auctionType || 'TIMED'}
            variant="outlined"
            size="small"
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              bgcolor: 'rgba(255,255,255,0.9)',
            }}
          />

          {/* Bid Count Badge */}
          {product.bidCount && product.bidCount > 0 && (
            <Badge
              badgeContent={product.bidCount}
              color="primary"
              sx={{ 
                position: 'absolute', 
                bottom: 8, 
                right: 8,
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  minWidth: '20px',
                  height: '20px',
                },
              }}
            >
              <AuctionIcon sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.7)', borderRadius: '50%', p: 0.5 }} />
            </Badge>
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" component="h3" gutterBottom noWrap>
            {product.title}
          </Typography>

          {/* Current Bid */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Current Bid
              </Typography>
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                {formatCurrency(product.currentBid || product.startingBid || 0)}
              </Typography>
            </Box>
            
            {product.reservePrice && (
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">
                  Reserve
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(product.reservePrice)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Product Info */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {product.description}
          </Typography>

          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Chip 
              label={product.condition ? product.condition.replace('_', ' ') : 'Good'} 
              size="small" 
              color={getConditionColor(product.condition || 'GOOD')}
            />
            
            <Box display="flex" alignItems="center" color="text.secondary">
              <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="caption">
                {product.location || 'Location TBD'}
              </Typography>
            </Box>
          </Box>

          {/* Countdown Timer */}
          <Box mb={2}>
            {product.auctionEndTime && (
              <Typography 
                variant="caption" 
                color={product.auctionStatus === 'ENDING_SOON' ? 'error.main' : 'warning.main'}
                fontWeight="medium"
              >
                Ends in: {formatTimeRemaining(new Date(product.auctionEndTime))}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Agent Info */}
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar 
              src={product.agent?.logoUrl} 
              alt={product.agent?.displayName || 'Agent'}
              sx={{ width: 24, height: 24, mr: 1 }}
            >
              <PersonIcon sx={{ fontSize: 14 }} />
            </Avatar>
            <Typography variant="body2" color="text.secondary" noWrap>
              {product.agent?.displayName || 'Auction House'}
            </Typography>
            {product.agent?.rating && (
              <Box display="flex" alignItems="center" ml={1}>
                <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                <Typography variant="caption" color="warning.main">
                  {Number(product.agent.rating).toFixed(1)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Action Button */}
          <Button
            fullWidth
            variant={['LIVE', 'ENDING_SOON'].includes(product.auctionStatus || 'LIVE') ? 'contained' : 'outlined'}
            size="large"
            startIcon={product.auctionStatus === 'SCHEDULED' ? <ViewIcon /> : <AuctionIcon />}
            color={product.auctionStatus === 'ENDING_SOON' ? 'warning' : 'primary'}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/products/${product.id}`);
            }}
            disabled={product.auctionStatus === 'ENDED' || product.auctionStatus === 'CANCELLED'}
          >
            {product.auctionStatus === 'SCHEDULED' ? 'View Auction' :
             product.auctionStatus === 'LIVE' ? 'Bid Now' :
             product.auctionStatus === 'ENDING_SOON' ? 'Bid Now!' :
             product.auctionStatus === 'ENDED' ? 'Auction Ended' :
             'View Details'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderFilters = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={showFilters}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search auctions"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Type"
              value={filters.auctionType}
              onChange={(e) => handleFilterChange('auctionType', e.target.value)}
            >
              {TYPE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.categoryId}
                label="Category"
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name} ({category.productCount})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Timeframe"
              value={filters.timeframe}
              onChange={(e) => handleFilterChange('timeframe', e.target.value)}
            >
              {TIMEFRAME_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Min Bid"
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Max Bid"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Sort By"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              {SORT_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );

  return (
    <Box p={3} maxWidth="1400px" mx="auto">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Auctions
          </Typography>
          <Breadcrumbs>
            <MuiLink href="/" underline="hover" color="inherit">
              Home
            </MuiLink>
            <Typography color="text.primary">Auctions</Typography>
          </Breadcrumbs>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Button
            variant={showFilters ? "contained" : "outlined"}
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          
          <IconButton 
            onClick={() => setViewMode('grid')}
            color={viewMode === 'grid' ? 'primary' : 'default'}
          >
            <GridViewIcon />
          </IconButton>
          
          <IconButton 
            onClick={() => setViewMode('list')}
            color={viewMode === 'list' ? 'primary' : 'default'}
          >
            <ListViewIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Filters */}
      {renderFilters()}

      {/* Results Summary */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading...' : `${totalCount} auction${totalCount !== 1 ? 's' : ''} found`}
        </Typography>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Auctions Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={240} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={20} width="80%" />
                  <Skeleton variant="text" height={40} width="60%" />
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="rectangular" width={60} height={24} />
                  </Box>
                  <Skeleton variant="rectangular" height={36} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : auctions && auctions.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {auctions.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                {renderAuctionCard(product)}
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => handlePageChange(page)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No auctions found
          </Typography>
          <Typography color="text.secondary" paragraph>
            Try adjusting your search criteria or check back later for new auctions.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              const newFilters = Object.keys(filters).reduce((acc, key) => ({ 
                ...acc, 
                [key]: key === 'status' || key === 'auctionType' || key === 'sortBy' || key === 'timeframe' ? 
                       (key === 'status' ? 'ALL' : key === 'auctionType' ? 'ALL' : key === 'sortBy' ? 'newest' : 'all') : 
                       '' 
              }), {} as SearchFilters);
              setFilters(newFilters);
              router.push('/auctions');
            }}
          >
            Clear Filters
          </Button>
        </Paper>
      )}
    </Box>
  );
}