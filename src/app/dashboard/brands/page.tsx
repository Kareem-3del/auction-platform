'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BrandIcon,
  Visibility as ViewIcon,
  Language as WebsiteIcon,
  MoreVert as MoreVertIcon,
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
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Brand {
  id: string;
  name: string;
  description: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function BrandsPage() {
  const router = useRouter();
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuBrand, setActionMenuBrand] = useState<Brand | null>(null);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/brands');

        if (data.success) {
          setBrands(data.data?.data || []);
        } else {
          setError(data.error?.message || 'Failed to load brands');
        }
      } catch (error) {
        console.error('Error loading brands:', error);
        setError('An unexpected error occurred');
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };

    loadBrands();
  }, []);

  const filteredBrands = Array.isArray(brands) ? brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (brand.description && brand.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  const handleCreateBrand = () => {
    router.push('/dashboard/brands/create');
  };

  const handleViewBrand = (brand: Brand) => {
    router.push(`/dashboard/brands/${brand.id}`);
    setMenuAnchor(null);
  };

  const handleEditBrand = (brand: Brand) => {
    router.push(`/dashboard/brands/${brand.id}/edit`);
    setMenuAnchor(null);
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      try {
        const data = await apiClient.delete(`/api/brands/${brand.id}`);

        if (data.success) {
          setBrands(prev => prev.filter(b => b.id !== brand.id));
        } else {
          setError(data.error?.message || 'Failed to delete brand');
        }
      } catch (error) {
        console.error('Error deleting brand:', error);
        setError('An unexpected error occurred');
      }
    }
    setMenuAnchor(null);
  };

  const handleToggleStatus = async (brand: Brand) => {
    try {
      const data = await apiClient.put(`/api/brands/${brand.id}`, {
        isActive: !brand.isActive,
      });

      if (data.success) {
        setBrands(prev => prev.map(b => 
          b.id === brand.id 
            ? { ...b, isActive: !b.isActive }
            : b
        ));
      } else {
        setError(data.error?.message || 'Failed to update brand');
      }
    } catch (error) {
      console.error('Error updating brand:', error);
      setError('An unexpected error occurred');
    }
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, brand: Brand) => {
    setMenuAnchor(event.currentTarget);
    setActionMenuBrand(brand);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActionMenuBrand(null);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Brands
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage product brands and manufacturers
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateBrand}
          >
            Add Brand
          </Button>
        </Stack>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Card sx={{ mb: 3, p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
          />
        </Card>

        {/* Brands Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Brand</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Website</TableCell>
                  <TableCell>Products</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBrands.map((brand) => (
                  <TableRow key={brand.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={brand.logoUrl || undefined}
                          alt={brand.name}
                          sx={{ width: 48, height: 48 }}
                        >
                          <BrandIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {brand.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            /{brand.slug}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {brand.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {brand.websiteUrl ? (
                        <Button
                          size="small"
                          startIcon={<WebsiteIcon />}
                          onClick={() => window.open(brand.websiteUrl!, '_blank')}
                          sx={{ textTransform: 'none' }}
                        >
                          Visit Website
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No website
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={brand.productCount || 0}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={brand.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={brand.isActive ? 'success' : 'default'}
                        variant={brand.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(brand.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, brand)}
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
                        Loading brands...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredBrands.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No brands match your search' : 'No brands found'}
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
          <MenuItem onClick={() => actionMenuBrand && handleViewBrand(actionMenuBrand)}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View
          </MenuItem>
          <MenuItem onClick={() => actionMenuBrand && handleEditBrand(actionMenuBrand)}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem onClick={() => actionMenuBrand && handleToggleStatus(actionMenuBrand)}>
            <BrandIcon sx={{ mr: 1 }} fontSize="small" />
            {actionMenuBrand?.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
          <MenuItem 
            onClick={() => actionMenuBrand && handleDeleteBrand(actionMenuBrand)}
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