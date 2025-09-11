'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Star as StarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Gavel as AuctionIcon,
  ShoppingBag as ProductIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  AttachMoney as PriceIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

import {
  Box,
  Grid,
  Card,
  Chip,
  Paper,
  Stack,
  Alert,
  Button,
  Avatar,
  Dialog,
  Drawer,
  Select,
  Slider,
  Switch,
  Skeleton,
  MenuItem,
  CardMedia,
  TextField,
  Typography,
  Pagination,
  CardContent,
  Breadcrumbs,
  IconButton,
  FormControl,
  DialogTitle,
  DialogContent,
  InputAdornment,
  FormControlLabel,
  Link as MuiLink,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Divider,
} from '@mui/material';

import { useAuth } from 'src/hooks/useAuth';
import { useLocale } from 'src/hooks/useLocale';
import { formatCurrency, formatTimeRemaining } from 'src/lib/utils';
import HomepageLayout from 'src/components/layout/HomepageLayout';

// Local search filters interface for UI
interface SearchFilters {
  category: string[];
  priceRange: [number, number];
  location: string[];
  condition: string[];
  auctionStatus: string[];
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
}

const initialFilters: SearchFilters = {
  category: [],
  priceRange: [0, 100000],
  location: [],
  condition: [],
  auctionStatus: [],
  dateRange: 'all',
  sortBy: 'relevance',
  sortOrder: 'desc',
  viewMode: 'grid',
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t } = useLocale();
  
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'auctions' | 'products'>('all');
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Mock data for filters
  const categories = ['Cars', 'Jewelry', 'Art', 'Electronics', 'Collectibles', 'Real Estate'];
  const locations = ['Beirut', 'Dubai', 'Riyadh', 'Kuwait City', 'Doha'];
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
  const auctionStatuses = ['Live', 'Scheduled', 'Ended'];

  useEffect(() => {
    if (query) {
      performSearch(query, 1);
    }
  }, [query, filters, activeTab]);

  const performSearch = async (searchTerm: string, page: number = 1) => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.set('q', searchTerm);
      queryParams.set('page', page.toString());
      queryParams.set('limit', '20');

      // Add filters to query params
      if (filters.category.length > 0) {
        queryParams.set('categories', filters.category.join(','));
      }
      if (filters.location.length > 0) {
        queryParams.set('locations', filters.location.join(','));
      }
      if (filters.condition.length > 0) {
        queryParams.set('conditions', filters.condition.join(','));
      }
      if (filters.auctionStatus.length > 0) {
        queryParams.set('auctionStatuses', filters.auctionStatus.join(','));
      }
      if (filters.priceRange[0] > 0) {
        queryParams.set('minPrice', filters.priceRange[0].toString());
      }
      if (filters.priceRange[1] < 100000) {
        queryParams.set('maxPrice', filters.priceRange[1].toString());
      }
      queryParams.set('sortBy', filters.sortBy);
      queryParams.set('sortOrder', filters.sortOrder);

      console.log('Search API call:', `/api/search?${queryParams.toString()}`);

      const response = await fetch(`/api/search?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Search API response:', data);

      if (data.success) {
        let results = [];
        let totalCount = 0;
        let currentPage = 1;
        let totalPages = 1;
        
        // Handle different possible data structures
        if (data.data) {
          if (Array.isArray(data.data)) {
            results = data.data;
          } else if (Array.isArray(data.data.items)) {
            results = data.data.items;
            totalCount = data.data.total || 0;
            currentPage = data.data.page || 1;
            totalPages = data.data.totalPages || 1;
          } else if (Array.isArray(data.data.results)) {
            results = data.data.results;
            totalCount = data.data.total || 0;
            currentPage = data.data.page || 1;
            totalPages = data.data.totalPages || 1;
          }
        }
        
        // Also check meta for pagination info
        if (data.meta?.pagination) {
          totalCount = data.meta.pagination.totalCount || data.meta.pagination.total || totalCount;
          currentPage = data.meta.pagination.page || currentPage;
          totalPages = data.meta.pagination.totalPages || totalPages;
        }
        
        setResults(results);
        setTotalCount(totalCount);
        setCurrentPage(currentPage);
        setTotalPages(totalPages);
        
        console.log(`Search loaded ${results.length} results`);
      } else {
        setError(data.error?.message || data.message || 'Search failed');
      }
    } catch (err) {
      setError('Failed to perform search');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category.length > 0) count++;
    if (filters.location.length > 0) count++;
    if (filters.condition.length > 0) count++;
    if (filters.auctionStatus.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) count++;
    if (filters.dateRange !== 'all') count++;
    return count;
  };

  // Filter Panel Component
  const FilterPanel = () => (
    <Paper sx={{ p: 3, height: 'fit-content' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Filters</Typography>
        {getActiveFilterCount() > 0 && (
          <Button size="small" onClick={clearFilters} startIcon={<ClearIcon />}>
            Clear ({getActiveFilterCount()})
          </Button>
        )}
      </Box>

      <Stack spacing={3}>
        {/* Categories */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Category</Typography>
          <Autocomplete
            multiple
            options={categories}
            value={filters.category}
            onChange={(_, value) => handleFilterChange('category', value)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select categories" size="small" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option} label={option} size="small" />
              ))
            }
          />
        </Box>

        {/* Price Range */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Price Range</Typography>
          <Box px={1}>
            <Slider
              value={filters.priceRange}
              onChange={(_, value) => handleFilterChange('priceRange', value as [number, number])}
              valueLabelDisplay="auto"
              min={0}
              max={100000}
              step={1000}
              valueLabelFormat={(value) => formatCurrency(value)}
            />
          </Box>
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption">{formatCurrency(filters.priceRange[0])}</Typography>
            <Typography variant="caption">{formatCurrency(filters.priceRange[1])}</Typography>
          </Box>
        </Box>

        {/* Location */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Location</Typography>
          <Autocomplete
            multiple
            options={locations}
            value={filters.location}
            onChange={(_, value) => handleFilterChange('location', value)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select locations" size="small" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option} label={option} size="small" />
              ))
            }
          />
        </Box>

        {/* Condition */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Condition</Typography>
          <Stack spacing={1}>
            {conditions.map((condition) => (
              <FormControlLabel
                key={condition}
                control={
                  <Switch
                    checked={filters.condition.includes(condition)}
                    onChange={(e) => {
                      const newConditions = e.target.checked
                        ? [...filters.condition, condition]
                        : filters.condition.filter(c => c !== condition);
                      handleFilterChange('condition', newConditions);
                    }}
                    size="small"
                  />
                }
                label={condition}
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
              />
            ))}
          </Stack>
        </Box>

        {/* Auction Status (only when auctions tab is active) */}
        {activeTab === 'auctions' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Auction Status</Typography>
            <Stack spacing={1}>
              {auctionStatuses.map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Switch
                      checked={filters.auctionStatus.includes(status)}
                      onChange={(e) => {
                        const newStatuses = e.target.checked
                          ? [...filters.auctionStatus, status]
                          : filters.auctionStatus.filter(s => s !== status);
                        handleFilterChange('auctionStatus', newStatuses);
                      }}
                      size="small"
                    />
                  }
                  label={status}
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Date Range */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Date Range</Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>
    </Paper>
  );

  // Result Card Component
  const ResultCard = ({ item }: { item: any }) => {
    let mainImage = '/placeholder-image.jpg';
    
    // Handle different image formats
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      mainImage = item.images[0];
    } else if (typeof item.images === 'string') {
      try {
        const parsedImages = JSON.parse(item.images);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          mainImage = parsedImages[0];
        }
      } catch (e) {
        // If parsing fails, use default image
      }
    }
    
    const isGridView = filters.viewMode === 'grid';

    return (
      <Card 
        sx={{ 
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: isGridView ? 'column' : 'row',
          '&:hover': { 
            boxShadow: 4,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out',
          },
          position: 'relative',
        }}
        onClick={() => router.push(`/auctions/${item.id}`)}
      >
        {/* Featured Badge */}
        {item.featured && (
          <Chip
            label="Featured"
            color="warning"
            size="small"
            sx={{ 
              position: 'absolute', 
              top: 8, 
              left: 8, 
              zIndex: 1,
              fontWeight: 'bold',
            }}
          />
        )}

        <Box 
          position="relative" 
          sx={{ 
            width: isGridView ? '100%' : { xs: '100%', md: 280 },
            height: isGridView ? 200 : { xs: 200, md: 180 },
            flexShrink: 0,
          }}
        >
          <CardMedia
            component="img"
            height="100%"
            image={mainImage}
            alt={item.title}
            sx={{ objectFit: 'cover' }}
          />
          
          {/* Type Badge */}
          <Chip
            label={item.type === 'auction' ? 'Auction' : 'Product'}
            color={item.type === 'auction' ? 'error' : 'primary'}
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8 }}
          />

          {/* Status Badge for Auctions */}
          {item.type === 'auction' && item.status && (
            <Chip
              label={item.status.replace('_', ' ')}
              color={
                item.status === 'LIVE' ? 'error' : 
                item.status === 'ENDING_SOON' ? 'warning' : 'info'
              }
              size="small"
              sx={{ position: 'absolute', bottom: 8, left: 8 }}
            />
          )}
        </Box>

        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box flex={1}>
            <Typography 
              variant={isGridView ? "h6" : "h5"} 
              component="h3" 
              gutterBottom 
              noWrap={isGridView}
              sx={{ 
                fontSize: isGridView ? '1rem' : '1.25rem',
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              {item.title}
            </Typography>

            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: isGridView ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {item.description || 'No description available'}
            </Typography>

            {/* Price */}
            <Typography 
              variant={isGridView ? "h6" : "h5"} 
              color="primary.main" 
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              {item.type === 'auction' ? 'Current Bid: ' : 'From: '}
              {formatCurrency(item.price)}
            </Typography>

            {/* Additional Info */}
            <Stack spacing={1} mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {item.location || 'Location not specified'}
                </Typography>
                {item.category && (
                  <>
                    <CategoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {item.category?.name || item.category}
                    </Typography>
                  </>
                )}
              </Box>

              {item.type === 'auction' && item.endTime && (
                <Box display="flex" alignItems="center" gap={1}>
                  <ScheduleIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  <Typography variant="body2" color="error.main" fontWeight={500}>
                    Ends: {formatTimeRemaining(new Date(item.endTime))}
                  </Typography>
                </Box>
              )}

              {item.type === 'product' && item.condition && (
                <Chip 
                  label={item.condition.replace('_', ' ')} 
                  size="small"
                  variant="outlined"
                  sx={{ width: 'fit-content' }}
                />
              )}

              {item.type === 'auction' && item.bidCount && (
                <Typography variant="body2" color="text.secondary">
                  {item.bidCount} bid{item.bidCount !== 1 ? 's' : ''}
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Agent Info & Actions */}
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <Avatar 
                  src={item.agent?.logoUrl} 
                  alt={item.agent?.displayName || 'Agent'}
                  sx={{ width: 28, height: 28, mr: 1 }}
                >
                  <PersonIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {item.agent?.displayName || 'Unknown Agent'}
                </Typography>
              </Box>

              {item.agent?.rating && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="body2" color="warning.main" fontWeight={600}>
                    {Number(item.agent.rating).toFixed(1)}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Action Button */}
            <Button
              fullWidth
              variant={item.type === 'auction' ? "contained" : "outlined"}
              startIcon={item.type === 'auction' ? <AuctionIcon /> : <ProductIcon />}
              sx={{ 
                fontWeight: 600,
                ...(item.type === 'auction' && {
                  background: 'linear-gradient(45deg, #CE0E2D 30%, #FF1744 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #B00C24 30%, #E91E63 90%)',
                  }
                })
              }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/auctions/${item.id}`);
              }}
            >
              {item.type === 'auction' ? 'View & Bid' : 'View Details'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <HomepageLayout>
      <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <Box maxWidth="1400px" mx="auto" p={3}>
        {/* Header */}
        <Box mb={4}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <MuiLink href="/" underline="hover" color="inherit">
              Home
            </MuiLink>
            <Typography color="text.primary">Search</Typography>
          </Breadcrumbs>
          
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Search Results
          </Typography>
          
          {query && (
            <Typography variant="h6" color="text.secondary" gutterBottom>
              "{query}" • {totalCount.toLocaleString()} results found
            </Typography>
          )}
        </Box>

        {/* Enhanced Search Bar */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box component="form" onSubmit={handleSearch}>
            <TextField
              fullWidth
              placeholder="Search for auctions, products, brands, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  backgroundColor: 'white',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <Button 
                    type="submit" 
                    variant="contained" 
                    size="large"
                    sx={{ 
                      ml: 1, 
                      borderRadius: 2,
                      minWidth: 120,
                      fontWeight: 600,
                    }}
                    disabled={!searchQuery.trim()}
                  >
                    Search
                  </Button>
                ),
              }}
            />
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Filters Sidebar */}
          <Grid item xs={12} lg={3}>
            <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
              <FilterPanel />
            </Box>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} lg={9}>
            {/* Controls Bar */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                {/* Tab Buttons */}
                <Box display="flex" gap={1}>
                  <Button
                    variant={activeTab === 'all' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('all')}
                    size="small"
                  >
                    All ({totalCount})
                  </Button>
                  <Button
                    variant={activeTab === 'auctions' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('auctions')}
                    size="small"
                    color="error"
                  >
                    Auctions
                  </Button>
                  <Button
                    variant={activeTab === 'products' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('products')}
                    size="small"
                  >
                    Products
                  </Button>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  {/* Mobile Filter Button */}
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setShowFilters(true)}
                    sx={{ display: { xs: 'flex', lg: 'none' } }}
                  >
                    Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
                  </Button>

                  {/* Sort */}
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      startAdornment={<SortIcon sx={{ mr: 1, fontSize: 18 }} />}
                    >
                      <MenuItem value="relevance">Relevance</MenuItem>
                      <MenuItem value="price_low">Price: Low to High</MenuItem>
                      <MenuItem value="price_high">Price: High to Low</MenuItem>
                      <MenuItem value="newest">Newest First</MenuItem>
                      <MenuItem value="ending_soon">Ending Soon</MenuItem>
                    </Select>
                  </FormControl>

                  {/* View Mode */}
                  <ToggleButtonGroup
                    value={filters.viewMode}
                    exclusive
                    onChange={(_, value) => value && handleFilterChange('viewMode', value)}
                    size="small"
                  >
                    <ToggleButton value="grid">
                      <GridViewIcon />
                    </ToggleButton>
                    <ToggleButton value="list">
                      <ListViewIcon />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>
            </Paper>

            {/* Results */}
            {loading ? (
              <Grid container spacing={3}>
                {[...Array(8)].map((_, index) => (
                  <Grid item xs={12} sm={6} md={filters.viewMode === 'grid' ? 4 : 12} key={index}>
                    <Card>
                      <Skeleton variant="rectangular" height={200} />
                      <CardContent>
                        <Skeleton variant="text" height={32} />
                        <Skeleton variant="text" height={20} width="80%" />
                        <Skeleton variant="text" height={24} width="60%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : !results || !Array.isArray(results) || results.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  No results found
                </Typography>
                <Typography color="text.secondary" paragraph>
                  We couldn't find anything matching "{query}". Try different keywords or browse our categories.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <Button variant="contained" onClick={() => router.push('/auctions')}>
                    Browse Products
                  </Button>
                  <Button variant="outlined" onClick={() => router.push('/auctions?filter=ending-soon')}>
                    Browse Ending Soon
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <>
                <Grid container spacing={3}>
                  {results && Array.isArray(results) && results.map((item) => (
                    <Grid 
                      item 
                      xs={12} 
                      sm={filters.viewMode === 'grid' ? 6 : 12}
                      md={filters.viewMode === 'grid' ? 4 : 12}
                      key={`${item.type}-${item.id}`}
                    >
                      <ResultCard item={item} />
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(_, page) => performSearch(query, page)}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="left"
          open={showFilters}
          onClose={() => setShowFilters(false)}
          sx={{ display: { xs: 'block', lg: 'none' } }}
        >
          <Box sx={{ width: 320, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={() => setShowFilters(false)}>
                <ClearIcon />
              </IconButton>
            </Box>
            <FilterPanel />
          </Box>
        </Drawer>
        </Box>
      </Box>
    </HomepageLayout>
  );
}