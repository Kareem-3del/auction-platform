'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Chip,
  Menu,
  Stack,
  Table,
  Alert,
  Button,
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
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  parentId: string | null;
  level: number;
  productCount: number;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuCategory, setActionMenuCategory] = useState<Category | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/categories');

        if (data.success || data.data) {
          // Handle both response formats: { success: true, data: {...} } and { data: [...] }
          const categoriesArray = data.success ? (data.data?.data || data.data) : data.data;
          setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
        } else {
          setError(data.error?.message || 'Failed to load categories');
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const filteredCategories = Array.isArray(categories) ? categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleCreateCategory = () => {
    router.push('/dashboard/categories/create');
  };

  const handleViewCategory = (category: Category) => {
    router.push(`/dashboard/categories/${category.id}`);
    setMenuAnchor(null);
  };

  const handleEditCategory = (category: Category) => {
    router.push(`/dashboard/categories/${category.id}/edit`);
    setMenuAnchor(null);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        const data = await apiClient.delete(`/api/categories/${category.id}`);


        if (data.success) {
          setCategories(prev => prev.filter(c => c.id !== category.id));
        } else {
          setError(data.error?.message || 'Failed to delete category');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        setError('An unexpected error occurred');
      }
    }
    setMenuAnchor(null);
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      const data = await apiClient.put(`/api/categories/${category.id}`, {
        isActive: !category.isActive,
      });

      if (data.success) {
        setCategories(prev => prev.map(c => 
          c.id === category.id 
            ? { ...c, isActive: !c.isActive }
            : c
        ));
      } else {
        setError(data.error?.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setError('An unexpected error occurred');
    }
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, category: Category) => {
    setMenuAnchor(event.currentTarget);
    setActionMenuCategory(category);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActionMenuCategory(null);
  };

  const getCategoryIcon = (category: Category) => {
    if (category.level === 0) {
      return <FolderIcon sx={{ color: 'primary.main' }} />;
    }
    return <FolderOpenIcon sx={{ color: 'text.secondary' }} />;
  };

  const getCategoryIndentation = (level: number) => level * 20;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Categories
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage product categories and subcategories
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateCategory}
          >
            Add Category
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
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
          />
        </Card>

        {/* Categories Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Products</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ ml: getCategoryIndentation(category.level) }}>
                          {getCategoryIcon(category)}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {category.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            /{category.slug}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={category.productCount}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={category.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={category.isActive ? 'success' : 'default'}
                        variant={category.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(category.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, category)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Loading categories...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No categories match your search' : 'No categories found'}
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
          <MenuItem onClick={() => actionMenuCategory && handleViewCategory(actionMenuCategory)}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View
          </MenuItem>
          <MenuItem onClick={() => actionMenuCategory && handleEditCategory(actionMenuCategory)}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem onClick={() => actionMenuCategory && handleToggleStatus(actionMenuCategory)}>
            <FolderIcon sx={{ mr: 1 }} fontSize="small" />
            {actionMenuCategory?.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
          <MenuItem 
            onClick={() => actionMenuCategory && handleDeleteCategory(actionMenuCategory)}
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