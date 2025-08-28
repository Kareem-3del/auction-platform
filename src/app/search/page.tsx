'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Star as StarIcon,
  Search as SearchIcon,
  Gavel as AuctionIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  ShoppingCart as ProductIcon,
} from '@mui/icons-material';
import {
  Box,
  Tab,
  Grid,
  Tabs,
  Card,
  Chip,
  Paper,
  Stack,
  Alert,
  Button,
  Avatar,
  Skeleton,
  CardMedia,
  TextField,
  Typography,
  Pagination,
  CardContent,
  Breadcrumbs,
  InputAdornment,
  Link as MuiLink,
} from '@mui/material';

import { formatCurrency, formatTimeRemaining } from 'src/lib/utils';

interface SearchResult {
  type: 'auction' | 'product';
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  location: string;
  createdAt: string;
  agent: {
    displayName: string;
    logoUrl?: string;
    rating?: number;
  };
  // Auction specific
  status?: string;
  endTime?: string;
  bidCount?: number;
  // Product specific
  condition?: string;
  category?: {
    name: string;
  };
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [tabValue, setTabValue] = useState(0);
  const [results, setResults] = useState<{
    auctions: SearchResult[];
    products: SearchResult[];
    agents: any[];
  }>({
    auctions: [],
    products: [],
    agents: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    auctions: { page: 1, totalPages: 1, totalCount: 0 },
    products: { page: 1, totalPages: 1, totalCount: 0 },
    agents: { page: 1, totalPages: 1, totalCount: 0 },
  });

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm: string, tab?: number) => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const currentTab = tab !== undefined ? tab : tabValue;
      let endpoint = '';
      const params = new URLSearchParams({
        search: searchTerm,
        page: '1',
        limit: '12',
      });

      // Determine which endpoint to call based on active tab
      switch (currentTab) {
        case 0: // All
          // We'll make parallel requests to both endpoints
          const [auctionsRes, productsRes] = await Promise.all([
            fetch(`/api/products?auctionOnly=true&${params.toString()}`),
            fetch(`/api/products?${params.toString()}`),
          ]);

          const [auctionsData, productsData] = await Promise.all([
            auctionsRes.json(),
            productsRes.json(),
          ]);

          if (auctionsData.success && productsData.success) {
            // Map auction products (with auction status)
            const auctionResults = auctionsData.data.products.map((item: any) => ({
              type: 'auction' as const,
              id: item.id,
              title: item.title,
              description: item.description,
              images: item.images,
              price: item.currentBid || item.startingBid || item.estimatedValueMin,
              location: item.location,
              createdAt: item.createdAt,
              agent: item.agent,
              status: item.auctionStatus,
              endTime: item.endTime,
              bidCount: item.bidCount || 0,
            }));

            // Map regular products
            const productResults = productsData.data.products.map((item: any) => ({
              type: 'product' as const,
              id: item.id,
              title: item.title,
              description: item.description,
              images: item.images,
              price: item.estimatedValueMin,
              location: item.location,
              createdAt: item.createdAt,
              agent: item.agent,
              condition: item.condition,
              category: item.category,
            }));

            setResults({
              auctions: auctionResults,
              products: productResults,
              agents: [],
            });

            setPagination({
              auctions: auctionsData.data.pagination,
              products: productsData.data.pagination,
              agents: { page: 1, totalPages: 1, totalCount: 0 },
            });
          }
          break;

        case 1: // Auctions
          endpoint = '/api/products';
          params.append('auctionOnly', 'true');
          break;

        case 2: // Products
          endpoint = '/api/products';
          break;

        case 3: // Agents
          // Placeholder for agents search
          setResults({ auctions: [], products: [], agents: [] });
          break;
      }

      if (endpoint) {
        const response = await fetch(`${endpoint}?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          const isAuctionTab = params.has('auctionOnly') && params.get('auctionOnly') === 'true';
          const mappedResults = data.data.products.map((item: any) => {
            const hasAuctionStatus = item.auctionStatus && ['SCHEDULED', 'LIVE', 'ENDED'].includes(item.auctionStatus);
            
            return {
              type: (isAuctionTab || hasAuctionStatus) ? 'auction' : 'product' as const,
              id: item.id,
              title: item.title,
              description: item.description,
              images: item.images,
              price: (isAuctionTab || hasAuctionStatus) ? (item.currentBid || item.startingBid || item.estimatedValueMin) : item.estimatedValueMin,
              location: item.location,
              createdAt: item.createdAt,
              agent: item.agent,
              condition: item.condition,
              category: item.category,
              // Auction-specific fields (will be undefined for regular products)
              status: item.auctionStatus,
              endTime: item.endTime,
              bidCount: item.bidCount || 0,
            };
          });

          if (currentTab === 1) {
            setResults(prev => ({ ...prev, auctions: mappedResults }));
            setPagination(prev => ({ ...prev, auctions: data.data.pagination }));
          } else if (currentTab === 2) {
            setResults(prev => ({ ...prev, products: mappedResults }));
            setPagination(prev => ({ ...prev, products: data.data.pagination }));
          }
        }
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (query) {
      performSearch(query, newValue);
    }
  };

  const getTotalResults = () => pagination.auctions.totalCount + pagination.products.totalCount + pagination.agents.totalCount;

  const renderSearchResult = (item: SearchResult) => {
    const mainImage = item.images?.[0] || '/placeholder-image.jpg';

    return (
      <Card 
        key={`${item.type}-${item.id}`}
        sx={{ 
          cursor: 'pointer',
          '&:hover': { boxShadow: 4 },
        }}
        onClick={() => router.push(`/${item.type === 'auction' ? 'auctions' : 'products'}/${item.id}`)}
      >
        <Box position="relative">
          <CardMedia
            component="img"
            height="200"
            image={mainImage}
            alt={item.title}
            sx={{ objectFit: 'cover' }}
          />
          
          {/* Type Badge */}
          <Chip
            label={item.type === 'auction' ? 'Auction' : 'Product'}
            color={item.type === 'auction' ? 'primary' : 'secondary'}
            size="small"
            sx={{ position: 'absolute', top: 8, left: 8 }}
          />

          {/* Status Badge for Auctions */}
          {item.type === 'auction' && item.status && (
            <Chip
              label={item.status.replace('_', ' ')}
              color={item.status === 'LIVE' ? 'error' : item.status === 'ENDING_SOON' ? 'warning' : 'info'}
              size="small"
              sx={{ position: 'absolute', top: 8, right: 8 }}
            />
          )}
        </Box>

        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom noWrap>
            {item.title}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {item.description.substring(0, 100)}...
          </Typography>

          {/* Price */}
          <Typography variant="h6" color="primary.main" gutterBottom>
            {item.type === 'auction' ? 'Current Bid: ' : 'From: '}
            {formatCurrency(item.price)}
          </Typography>

          {/* Additional Info */}
          <Stack spacing={1} mb={2}>
            <Box display="flex" alignItems="center" color="text.secondary">
              <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="caption">
                {item.location}
              </Typography>
            </Box>

            {item.type === 'auction' && item.endTime && (
              <Box display="flex" alignItems="center" color="text.secondary">
                <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">
                  Ends: {formatTimeRemaining(item.endTime)}
                </Typography>
              </Box>
            )}

            {item.type === 'product' && item.condition && (
              <Chip 
                label={item.condition.replace('_', ' ')} 
                size="small"
                sx={{ width: 'fit-content' }}
              />
            )}
          </Stack>

          {/* Agent Info */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Avatar 
                src={item.agent.logoUrl} 
                alt={item.agent.displayName}
                sx={{ width: 24, height: 24, mr: 1 }}
              >
                <PersonIcon sx={{ fontSize: 14 }} />
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                {item.agent.displayName}
              </Typography>
            </Box>

            {item.agent.rating && (
              <Box display="flex" alignItems="center">
                <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                <Typography variant="caption" color="warning.main">
                  {Number(item.agent.rating).toFixed(1)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Action Button */}
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={item.type === 'auction' ? <AuctionIcon /> : <ProductIcon />}
            sx={{ mt: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${item.type === 'auction' ? 'auctions' : 'products'}/${item.id}`);
            }}
          >
            {item.type === 'auction' ? 'View Auction' : 'View Product'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => {
    let items: SearchResult[] = [];
    
    switch (tabValue) {
      case 0: // All
        items = [...results.auctions, ...results.products];
        break;
      case 1: // Auctions
        items = results.auctions;
        break;
      case 2: // Products
        items = results.products;
        break;
      case 3: // Agents
        items = results.agents;
        break;
    }

    if (loading) {
      return (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
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
      );
    }

    if (items.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No results found
          </Typography>
          <Typography color="text.secondary" paragraph>
            We couldn't find anything matching "{query}". Try different keywords or browse our categories.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="outlined" onClick={() => router.push('/auctions')}>
              Browse Auctions
            </Button>
            <Button variant="outlined" onClick={() => router.push('/products')}>
              Browse Products
            </Button>
          </Stack>
        </Paper>
      );
    }

    return (
      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`${item.type}-${item.id}`}>
            {renderSearchResult(item)}
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box p={3} maxWidth="1400px" mx="auto">
      {/* Header */}
      <Box mb={4}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink href="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary">Search</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Search Results
        </Typography>
        
        {query && (
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Showing results for "{query}"
          </Typography>
        )}
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch}>
          <TextField
            fullWidth
            placeholder="Search auctions, products, and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <Button 
                  type="submit" 
                  variant="contained" 
                  sx={{ ml: 1 }}
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

      {/* Results Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={`All (${getTotalResults()})`} 
            disabled={loading}
          />
          <Tab 
            label={`Auctions (${pagination.auctions.totalCount})`} 
            disabled={loading}
          />
          <Tab 
            label={`Products (${pagination.products.totalCount})`} 
            disabled={loading}
          />
          <Tab 
            label={`Agents (${pagination.agents.totalCount})`} 
            disabled={loading}
          />
        </Tabs>
      </Paper>

      {/* Results */}
      <Box mb={4}>
        {renderResults()}
      </Box>

      {/* Pagination */}
      {!loading && (tabValue === 1 || tabValue === 2) && (
        <Box display="flex" justifyContent="center">
          <Pagination
            count={tabValue === 1 ? pagination.auctions.totalPages : pagination.products.totalPages}
            page={tabValue === 1 ? pagination.auctions.page : pagination.products.page}
            onChange={(_, page) => {
              // Handle pagination for specific tabs
              // This would typically trigger a new search with the page parameter
            }}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}