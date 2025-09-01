'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Menu,
  Chip,
  Stack,
  Table,
  Alert,
  Button,
  Avatar,
  Select,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  InputLabel,
  FormControl,
  TableContainer,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { formatCurrency } from 'src/lib/utils';
import { DashboardContent } from 'src/layouts/dashboard';
import { useLocale } from 'src/hooks/useLocale';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Agent {
  id: string;
  displayName: string;
  businessName?: string;
  logoUrl?: string;
  rating?: number;
  reviewCount?: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  condition: string;
  location?: string;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  reservePrice?: number;
  images?: string[];
  status: string;
  rejectionReason?: string;
  viewCount?: number;
  favoriteCount?: number;
  createdAt: string;
  updatedAt: string;
  categoryId?: string;
  category?: Category;
  agentId?: string;
  agent?: Agent;
}

export default function ProductsPage() {
  const router = useRouter();
  const { t } = useLocale();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuProduct, setActionMenuProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setProducts([]);
        const data = await apiClient.get('/api/products');

        if (data.success && data.data) {
          // Handle nested data structure: data.data.data contains the actual array
          const productsArray = data.data.data || data.data;
          if (Array.isArray(productsArray)) {
            setProducts(productsArray);
          } else {
            console.warn('API returned non-array products:', productsArray);
            setProducts([]);
            setError('Invalid data format received');
          }
        } else {
          setProducts([]);
          setError(data.error?.message || 'Failed to load products');
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCondition = conditionFilter === 'all' || product.condition === conditionFilter;

    return matchesSearch && matchesStatus && matchesCondition;
  }) : [];

  const handleCreateProduct = () => {
    router.push('/dashboard/products/create');
  };

  const handleViewProduct = (product: Product) => {
    router.push(`/dashboard/products/${product.id}`);
    setMenuAnchor(null);
  };

  const handleEditProduct = (product: Product) => {
    router.push(`/dashboard/products/${product.id}/edit`);
    setMenuAnchor(null);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.title}"?`)) {
      try {
        const data = await apiClient.delete(`/api/products/${product.id}`);

        if (data.success) {
          setProducts(prev => prev.filter(p => p.id !== product.id));
        } else {
          setError(data.error?.message || 'Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('An unexpected error occurred');
      }
    }
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setMenuAnchor(event.currentTarget);
    setActionMenuProduct(product);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActionMenuProduct(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING_APPROVAL':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW':
        return 'success';
      case 'EXCELLENT':
        return 'info';
      case 'GOOD':
        return 'warning';
      case 'FAIR':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const renderGridView = () => (
    <Grid container spacing={3}>
      {filteredProducts.map((product) => (
        <Grid item xs={12} sm={6} md={4} key={product.id}>
          <Card sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                src={product.images?.[0]}
                variant="rounded"
                sx={{ width: '100%', height: 200 }}
              />
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'background.paper' }}
                onClick={(e) => handleMenuOpen(e, product)}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom noWrap>
                {product.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {product.category?.name || 'No category'} • {product.condition}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {product.description.length > 100 
                  ? `${product.description.substring(0, 100)}...` 
                  : product.description}
              </Typography>
              
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip
                  label={product.condition}
                  size="small"
                  color={getConditionColor(product.condition) as any}
                />
                <Chip
                  label={product.status.replace('_', ' ')}
                  size="small"
                  color={getStatusColor(product.status) as any}
                />
              </Stack>
              
              {product.estimatedValueMin && (
                <Typography variant="h6" color="primary.main">
                  {product.estimatedValueMin && product.estimatedValueMax
                    ? `${formatCurrency(product.estimatedValueMin)} - ${formatCurrency(product.estimatedValueMax)}`
                    : formatCurrency(product.estimatedValueMin)}
                </Typography>
              )}
              {product.reservePrice && !product.estimatedValueMin && (
                <Typography variant="h6" color="primary.main">
                  Reserve: {formatCurrency(product.reservePrice)}
                </Typography>
              )}
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <Card>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('navigation.products')}</TableCell>
              <TableCell>{t('categories.category')}</TableCell>
              <TableCell>{t('products.valueRange')}</TableCell>
              <TableCell>{t('products.condition')}</TableCell>
              <TableCell>{t('common.status')}</TableCell>
              <TableCell>{t('categories.created')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      src={product.images?.[0]}
                      variant="rounded"
                      sx={{ width: 48, height: 48 }}
                    />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {product.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.description.length > 50 
                          ? `${product.description.substring(0, 50)}...` 
                          : product.description}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {product.category?.name || t('products.noCategory')}
                  </Typography>
                </TableCell>
                <TableCell>
                  {product.estimatedValueMin || product.estimatedValueMax ? (
                    <>
                      <Typography variant="body2" fontWeight="medium">
                        {product.estimatedValueMin && product.estimatedValueMax
                          ? `${formatCurrency(product.estimatedValueMin)} - ${formatCurrency(product.estimatedValueMax)}`
                          : product.estimatedValueMin
                          ? `From ${formatCurrency(product.estimatedValueMin)}`
                          : `Up to ${formatCurrency(product.estimatedValueMax!)}`}
                      </Typography>
                      {product.reservePrice && (
                        <Typography variant="caption" color="text.secondary">
                          Reserve: {formatCurrency(product.reservePrice)}
                        </Typography>
                      )}
                    </>
                  ) : product.reservePrice ? (
                    <Typography variant="body2" fontWeight="medium">
                      Reserve: {formatCurrency(product.reservePrice)}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t('products.noValueSet')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={product.condition}
                    size="small"
                    color={getConditionColor(product.condition) as any}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={product.status.replace('_', ' ')}
                    size="small"
                    color={getStatusColor(product.status) as any}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(product.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, product)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {t('products.loading')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchQuery ? t('products.noSearchResults') : t('products.noProducts')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {t('navigation.products')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('products.pageDescription')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProduct}
          >
            {t('navigation.addProduct')}
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
              placeholder={t('products.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ flex: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('common.status')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('common.status')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">{t('products.allStatus')}</MenuItem>
                <MenuItem value="APPROVED">{t('products.approved')}</MenuItem>
                <MenuItem value="PENDING_APPROVAL">{t('products.pending')}</MenuItem>
                <MenuItem value="REJECTED">{t('products.rejected')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('products.condition')}</InputLabel>
              <Select
                value={conditionFilter}
                label={t('products.condition')}
                onChange={(e) => setConditionFilter(e.target.value)}
              >
                <MenuItem value="all">{t('products.allConditions')}</MenuItem>
                <MenuItem value="NEW">{t('products.conditionNew')}</MenuItem>
                <MenuItem value="EXCELLENT">{t('products.conditionExcellent')}</MenuItem>
                <MenuItem value="GOOD">{t('products.conditionGood')}</MenuItem>
                <MenuItem value="FAIR">{t('products.conditionFair')}</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row">
              <IconButton
                color={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
              >
                <ListViewIcon />
              </IconButton>
              <IconButton
                color={viewMode === 'grid' ? 'primary' : 'default'}
                onClick={() => setViewMode('grid')}
              >
                <GridViewIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Card>

        {/* Products */}
        {viewMode === 'grid' ? renderGridView() : renderListView()}

        {/* Action Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => actionMenuProduct && handleViewProduct(actionMenuProduct)}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            {t('common.view')}
          </MenuItem>
          <MenuItem onClick={() => actionMenuProduct && handleEditProduct(actionMenuProduct)}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            {t('common.edit')}
          </MenuItem>
          <MenuItem 
            onClick={() => actionMenuProduct && handleDeleteProduct(actionMenuProduct)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            {t('common.delete')}
          </MenuItem>
        </Menu>
      </Box>
    </DashboardContent>
  );
}