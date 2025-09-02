'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Box,
  Grid,
  Card,
  Chip,
  Stack,
  Paper,
  Alert,
  Button,
  Select,
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
import {
  Search as SearchIcon,
  Gavel as AuctionIcon,
  FilterList as FilterIcon,
  ViewList as ListViewIcon,
  Favorite as FavoriteIcon,
  Schedule as ScheduleIcon,
  ViewModule as GridViewIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';

import { formatCurrency, formatTimeRemaining } from 'src/lib/utils';

interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  location: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  reservePrice?: number;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  agent: {
    id: string;
    displayName: string;
    businessName: string;
    logoUrl?: string;
    rating?: number;
    reviewCount: number;
  };
  auctions: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    currentBid: number;
    status: string;
    bidCount: number;
  }>;
  auctionCount: number;
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
  categoryId: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  sortBy: string;
  status: string;
  auctionStatus: string;
  filter: string;
}

const CONDITIONS = [
  { value: '', label: 'All Conditions' },
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'VERY_GOOD', label: 'Very Good' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'ending_soon', label: 'Ending Soon' },
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'titleAsc', label: 'Title: A-Z' },
  { value: 'titleDesc', label: 'Title: Z-A' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Products' },
  { value: 'LIVE', label: 'Live Auctions' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ENDED', label: 'Ended' },
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  // Helper function to map filter parameter to status
  const getStatusFromFilter = (filter: string | null) => {
    if (!filter) return 'ALL';
    switch (filter) {
      case 'ending-soon': return 'LIVE';
      case 'live': return 'LIVE';
      case 'scheduled': return 'SCHEDULED';
      case 'ended': return 'ENDED';
      default: return 'ALL';
    }
  };

  const [filters, setFilters] = useState<SearchFilters>({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    location: searchParams.get('location') || '',
    sortBy: searchParams.get('sort') || 'newest',
    status: searchParams.get('status') || getStatusFromFilter(searchParams.get('filter')),
    auctionStatus: searchParams.get('auctionStatus') || '',
    filter: searchParams.get('filter') || '',
  });

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [searchParams]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    setCurrentPage(page);
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

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      
      // Always include approved products
      queryParams.set('status', 'APPROVED');
      
      // Handle URL filter parameter
      const filterParam = searchParams.get('filter');
      if (filterParam) {
        if (filterParam === 'ending-soon') {
          // For ending soon, get LIVE auctions and add sortBy=ending_soon
          queryParams.set('auctionStatus', 'LIVE');
          queryParams.set('sortBy', 'ending_soon');
        } else {
          const statusValue = getStatusFromFilter(filterParam);
          if (statusValue !== 'ALL') {
            queryParams.set('auctionStatus', statusValue);
          }
        }
      }

      // Map current filters to API parameters
      if (filters.status && filters.status !== 'ALL') {
        queryParams.set('auctionStatus', filters.status);
      }

      if (filters.search) {
        queryParams.set('search', filters.search);
      }

      if (filters.categoryId) {
        queryParams.set('categoryId', filters.categoryId);
      }

      if (filters.condition) {
        queryParams.set('condition', filters.condition);
      }

      if (filters.minPrice) {
        queryParams.set('minPrice', filters.minPrice);
      }

      if (filters.maxPrice) {
        queryParams.set('maxPrice', filters.maxPrice);
      }

      if (filters.location) {
        queryParams.set('location', filters.location);
      }

      // Map sort options to API parameters
      if (filters.sortBy) {
        queryParams.set('sortBy', filters.sortBy);
      }

      // Set pagination
      const currentPage = parseInt(searchParams.get('page') || '1');
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', '20'); // Fixed limit

      console.log('Products API call with params:', queryParams.toString());

      const response = await fetch(`/api/products?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Products API response:', data);

      if (data.success) {
        const products = Array.isArray(data.data) ? data.data : [];
        setProducts(products);
        setTotalPages(data.meta?.pagination?.totalPages || 1);
        setTotalCount(data.meta?.pagination?.totalCount || 0);
        
        if (products.length === 0) {
          console.log('No products found with current filters');
        }
      } else {
        console.error('API returned error:', data);
        setError(data.message || 'Failed to load products');
        setProducts([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const queryParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue && filterValue !== 'ALL' && filterValue !== 'all' && filterValue !== '') {
        let paramKey = filterKey;
        
        // Map filter names to URL parameter names
        switch (filterKey) {
          case 'sortBy':
            paramKey = 'sort';
            break;
          case 'categoryId':
            paramKey = 'category';
            break;
          case 'status':
            // Map status to filter for URL consistency
            paramKey = 'filter';
            filterValue = filterValue.toLowerCase().replace('_', '-');
            break;
          default:
            paramKey = filterKey;
        }
        
        queryParams.set(paramKey, filterValue);
      }
    });
    
    queryParams.set('page', '1');
    router.push(`/products?${queryParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const queryParams = new URLSearchParams(searchParams.toString());
    queryParams.set('page', page.toString());
    router.push(`/products?${queryParams.toString()}`);
  };

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
    // In a real app, this would sync with the backend
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'error';
      case 'ENDING_SOON': return 'warning';
      case 'SCHEDULED': return 'info';
      default: return 'default';
    }
  };

  const getActiveAuction = (product: Product) => product.auctions.find(auction => 
      ['LIVE', 'ENDING_SOON', 'SCHEDULED'].includes(auction.status)
    );

  const renderProductCard = (product: Product) => {
    const activeAuction = getActiveAuction(product);
    const mainImage = product.images[0] || '/placeholder-product.jpg';

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
          
          {/* Favorite Button */}
          <IconButton
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.8)' }}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
          >
            {favorites.has(product.id) ? 
              <FavoriteIcon color="error" /> : 
              <FavoriteBorderIcon />
            }
          </IconButton>

          {/* Active Auction Badge */}
          {activeAuction && (
            <Chip
              label={activeAuction.status.replace('_', ' ')}
              color={getStatusColor(activeAuction.status)}
              size="small"
              sx={{ position: 'absolute', top: 8, left: 8 }}
            />
          )}

          {/* Image Count Badge */}
          {product.images.length > 1 && (
            <Chip
              label={`${product.images.length} photos`}
              size="small"
              variant="outlined"
              sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
            />
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" component="h3" gutterBottom noWrap>
            {product.title}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
            {product.description.substring(0, 100)}...
          </Typography>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" color="primary.main">
              {formatCurrency(product.estimatedValueMin)} - {formatCurrency(product.estimatedValueMax)}
            </Typography>
            <Chip 
              label={product.condition.replace('_', ' ')} 
              size="small" 
              color={getConditionColor(product.condition)}
            />
          </Box>

          <Box display="flex" alignItems="center" mb={2} color="text.secondary">
            <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="caption">
              {product.location}
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Agent Info */}
          <Box display="flex" alignItems="center" mb={2}>
            <Box 
              component="img"
              src={product.agent.logoUrl || '/default-agent.png'}
              alt={product.agent.displayName}
              sx={{ width: 24, height: 24, borderRadius: '50%', mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {product.agent.displayName}
            </Typography>
            {product.agent.rating && (
              <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                ⭐ {Number(product.agent.rating).toFixed(1)}
              </Typography>
            )}
          </Box>

          {/* Active Auction Info */}
          {activeAuction && (
            <Box 
              sx={{ 
                p: 1.5, 
                bgcolor: 'action.hover', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontWeight="medium">
                  Current Bid: {formatCurrency(activeAuction.currentBid)}
                </Typography>
                <Chip 
                  icon={<AuctionIcon />}
                  label={`${activeAuction.bidCount} bids`}
                  size="small"
                  variant="outlined"
                />
              </Box>
              
              <Box display="flex" alignItems="center" color="text.secondary">
                <ScheduleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                <Typography variant="caption">
                  {activeAuction.status === 'SCHEDULED' 
                    ? `Starts ${formatTimeRemaining(activeAuction.startTime)}`
                    : activeAuction.status === 'LIVE'
                    ? `Ends ${formatTimeRemaining(activeAuction.endTime)}`
                    : `Ending ${formatTimeRemaining(activeAuction.endTime)}`
                  }
                </Typography>
              </Box>
              
              <Button
                fullWidth
                variant="contained"
                size="small"
                startIcon={<AuctionIcon />}
                sx={{ mt: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/products/${activeAuction.id}`);
                }}
              >
                {activeAuction.status === 'SCHEDULED' ? 'View Auction' : 'Bid Now'}
              </Button>
            </Box>
          )}

          {/* No Active Auction */}
          {!activeAuction && product.auctionCount > 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {product.auctionCount} past auction{product.auctionCount !== 1 ? 's' : ''}
            </Typography>
          )}

          {!activeAuction && product.auctionCount === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No auctions yet
            </Typography>
          )}
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
              label="Search products"
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
              label="Condition"
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
            >
              {CONDITIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Min Price"
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
              label="Max Price"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
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
            Products
          </Typography>
          <Breadcrumbs>
            <MuiLink href="/" underline="hover" color="inherit">
              Home
            </MuiLink>
            <Typography color="text.primary">Products</Typography>
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
          {loading ? 'Loading...' : `${totalCount} product${totalCount !== 1 ? 's' : ''} found`}
        </Typography>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Products Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={240} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={20} width="80%" />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="rectangular" width={60} height={24} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : products.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                {renderProductCard(product)}
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
            No products found
          </Typography>
          <Typography color="text.secondary" paragraph>
            Try adjusting your search criteria or browse all categories.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              const newFilters = Object.keys(filters).reduce((acc, key) => ({ ...acc, [key]: '' }), {} as SearchFilters);
              setFilters(newFilters);
              router.push('/products');
            }}
          >
            Clear Filters
          </Button>
        </Paper>
      )}
    </Box>
  );
}