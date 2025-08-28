'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

import {
  Star as StarIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import {
  Box,
  Tab,
  Grid,
  Card,
  Chip,
  Tabs,
  Stack,
  Paper,
  Alert,
  Button,
  Select,
  Slider,
  Avatar,
  MenuItem,
  Skeleton,
  Container,
  CardMedia,
  TextField,
  Typography,
  InputLabel,
  Pagination,
  CardContent,
  Breadcrumbs,
  FormControl,
  InputAdornment,
  Link as MuiLink,
} from '@mui/material';

import { formatCurrency, formatTimeRemaining } from 'src/lib/utils';

import Layout from 'src/components/layout/Layout';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  children?: Category[];
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CategoryItem {
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
  status?: string; // auctionStatus for auction items
  endTime?: string;
  bidCount?: number;
  condition?: string;
  category: {
    name: string;
  };
}

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 12,
  });

  useEffect(() => {
    if (slug) {
      fetchCategoryData();
    }
  }, [slug, tabValue, searchQuery, sortBy, priceRange, selectedLocation, selectedCondition, selectedStatus, pagination.page]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch category details
      const categoryResponse = await fetch(`/api/categories?slug=${slug}`);
      const categoryData = await categoryResponse.json();

      if (!categoryData.success) {
        setError('Category not found');
        return;
      }

      // Handle the nested data structure from API
      const categories = Array.isArray(categoryData.data.data) ? categoryData.data.data : categoryData.data;
      const categoryInfo = categories.find((cat: Category) => cat.slug === slug);
      if (!categoryInfo) {
        setError('Category not found');
        return;
      }

      setCategory(categoryInfo);

      // Fetch subcategories
      const subcategoriesResponse = await fetch(`/api/categories?parentId=${categoryInfo.id}`);
      const subcategoriesData = await subcategoriesResponse.json();
      
      if (subcategoriesData.success) {
        const subcats = Array.isArray(subcategoriesData.data.data) ? subcategoriesData.data.data : subcategoriesData.data;
        setSubcategories(subcats);
      }

      // Fetch items based on current tab and filters
      const itemsParams = new URLSearchParams({
        categoryId: categoryInfo.id,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
      });

      if (searchQuery.trim()) {
        itemsParams.append('search', searchQuery.trim());
      }

      if (selectedLocation) {
        itemsParams.append('location', selectedLocation);
      }

      if (selectedCondition) {
        itemsParams.append('condition', selectedCondition);
      }

      if (selectedStatus) {
        itemsParams.append('status', selectedStatus);
      }

      itemsParams.append('minPrice', priceRange[0].toString());
      itemsParams.append('maxPrice', priceRange[1].toString());

      const endpoint = '/api/products';
      
      // Add auction filter based on tab selection
      switch (tabValue) {
        case 0: // All items
          // Don't add any filter - get all products
          break;
        case 1: // Auctions only
          itemsParams.append('auctionOnly', 'true');
          break;
        case 2: // Products only
          itemsParams.append('auctionOnly', 'false');
          break;
      }

      const response = await fetch(`${endpoint}?${itemsParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        const mappedItems = data.data.products.map((item: any) => {
          // Determine if this is an auction or regular product
          const isAuction = item.auctionStatus && ['SCHEDULED', 'LIVE', 'ENDED'].includes(item.auctionStatus);
          
          return {
            type: isAuction ? 'auction' : 'product' as const,
            id: item.id,
            title: item.title,
            description: item.description,
            images: item.images,
            price: isAuction ? (item.currentBid || item.startingBid || item.estimatedValueMin) : item.estimatedValueMin,
            location: item.location,
            createdAt: item.createdAt,
            agent: item.agent,
            condition: item.condition,
            category: item.category,
            // Auction-specific fields
            status: item.auctionStatus,
            endTime: item.endTime,
            bidCount: item.bidCount || 0,
          };
        });

        setItems(mappedItems);
        setPagination(prev => ({
          ...prev,
          ...data.data.pagination,
        }));
      }

    } catch (err) {
      setError('Failed to load category data');
      console.error('Category fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('newest');
    setPriceRange([0, 10000]);
    setSelectedLocation('');
    setSelectedCondition('');
    setSelectedStatus('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderItem = (item: CategoryItem) => {
    const mainImage = item.images?.[0] || '/placeholder-image.jpg';

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={`${item.type}-${item.id}`}>
        <Card
          sx={{
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
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
            
            <Chip
              label={item.type === 'auction' ? 'Auction' : 'Product'}
              color={item.type === 'auction' ? 'primary' : 'secondary'}
              size="small"
              sx={{ position: 'absolute', top: 8, left: 8 }}
            />

            {item.type === 'auction' && item.status && (
              <Chip
                label={item.status.replace('_', ' ')}
                color={item.status === 'LIVE' ? 'error' : item.status === 'ENDING_SOON' ? 'warning' : 'info'}
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
              />
            )}
          </Box>

          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" component="h3" gutterBottom noWrap>
              {item.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
              {item.description.substring(0, 100)}...
            </Typography>

            <Typography variant="h6" color="primary.main" gutterBottom>
              {item.type === 'auction' ? 'Current Bid: ' : 'From: '}
              {formatCurrency(item.price)}
            </Typography>

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

            <Box display="flex" alignItems="center" justifyContent="space-between" mt="auto">
              <Box display="flex" alignItems="center">
                <Avatar 
                  src={item.agent.logoUrl} 
                  alt={item.agent.displayName}
                  sx={{ width: 20, height: 20, mr: 0.5 }}
                >
                  <PersonIcon sx={{ fontSize: 12 }} />
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
          </CardContent>
        </Card>
      </Grid>
    );
  };

  if (error) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={() => router.push('/categories')}>
            Back to Categories
          </Button>
        </Container>
      </Layout>
    );
  }

  if (loading || !category) {
    return (
      <Layout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Skeleton variant="text" height={40} width={300} sx={{ mb: 2 }} />
          <Skeleton variant="text" height={60} width={500} sx={{ mb: 4 }} />
          <Grid container spacing={3}>
            {[...Array(8)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card sx={{ height: 400 }}>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" height={28} sx={{ mb: 1 }} />
                    <Skeleton variant="text" height={20} width="80%" sx={{ mb: 2 }} />
                    <Skeleton variant="text" height={24} width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <MuiLink href="/" underline="hover" color="inherit">
              Home
            </MuiLink>
            <MuiLink href="/categories" underline="hover" color="inherit">
              Categories
            </MuiLink>
            {category.parent && (
              <MuiLink href={`/categories/${category.parent.slug}`} underline="hover" color="inherit">
                {category.parent.name}
              </MuiLink>
            )}
            <Typography color="text.primary">{category.name}</Typography>
          </Breadcrumbs>
          
          <Typography variant="h3" component="h1" gutterBottom>
            {category.name}
          </Typography>
          {category.description && (
            <Typography variant="h6" color="text.secondary" paragraph>
              {category.description}
            </Typography>
          )}
        </Box>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <Box mb={4}>
            <Typography variant="h5" gutterBottom>
              Subcategories
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {subcategories.map((subcat) => (
                <Chip
                  key={subcat.id}
                  label={subcat.name}
                  clickable
                  onClick={() => router.push(`/categories/${subcat.slug}`)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search in this category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="price_low">Price: Low to High</MenuItem>
                  <MenuItem value="price_high">Price: High to Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="body2" gutterBottom>
                Price Range: {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
              </Typography>
              <Slider
                value={priceRange}
                onChange={(_, newValue) => setPriceRange(newValue as number[])}
                valueLabelDisplay="auto"
                min={0}
                max={100000}
                step={100}
                valueLabelFormat={(value) => formatCurrency(value)}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={resetFilters}
                startIcon={<FilterIcon />}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`All Items (${pagination.totalCount})`} />
            <Tab label="Auctions Only" />
            <Tab label="Products Only" />
          </Tabs>
        </Paper>

        {/* Items Grid */}
        <Box mb={4}>
          {loading ? (
            <Grid container spacing={3}>
              {[...Array(8)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card sx={{ height: 400 }}>
                    <Skeleton variant="rectangular" height={200} />
                    <CardContent>
                      <Skeleton variant="text" height={28} sx={{ mb: 1 }} />
                      <Skeleton variant="text" height={20} width="80%" sx={{ mb: 2 }} />
                      <Skeleton variant="text" height={24} width="60%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : items.length > 0 ? (
            <Grid container spacing={3}>
              {items.map(renderItem)}
            </Grid>
          ) : (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <CategoryIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No Items Found
              </Typography>
              <Typography color="text.secondary" paragraph>
                No items match your current filters in this category.
              </Typography>
              <Button variant="outlined" onClick={resetFilters}>
                Clear Filters
              </Button>
            </Paper>
          )}
        </Box>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(_, page) => setPagination(prev => ({ ...prev, page }))}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Container>
    </Layout>
  );
}