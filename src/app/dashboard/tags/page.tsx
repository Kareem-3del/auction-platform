'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Label as TagIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
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

interface Tag {
  id: string;
  name: string;
  description: string;
  color: string;
  productCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TagsPage() {
  const router = useRouter();
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuTag, setActionMenuTag] = useState<Tag | null>(null);

  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/tags');

        if (data.success) {
          setTags(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to load tags');
          setTags([]);
        }
      } catch (error) {
        console.error('Error loading tags:', error);
        setError('An unexpected error occurred');
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

  const filteredTags = Array.isArray(tags) ? tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleCreateTag = () => {
    router.push('/dashboard/tags/create');
  };

  const handleViewTag = (tag: Tag) => {
    router.push(`/dashboard/tags/${tag.id}`);
    setMenuAnchor(null);
  };

  const handleEditTag = (tag: Tag) => {
    router.push(`/dashboard/tags/${tag.id}/edit`);
    setMenuAnchor(null);
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (confirm(`Are you sure you want to delete "${tag.name}"?`)) {
      try {
        const data = await apiClient.delete(`/api/tags/${tag.id}`);

        if (data.success) {
          setTags(prev => prev.filter(t => t.id !== tag.id));
        } else {
          setError(data.error?.message || 'Failed to delete tag');
        }
      } catch (error) {
        console.error('Error deleting tag:', error);
        setError('An unexpected error occurred');
      }
    }
    setMenuAnchor(null);
  };

  const handleToggleStatus = async (tag: Tag) => {
    try {
      const data = await apiClient.put(`/api/tags/${tag.id}`, {
        isActive: !tag.isActive,
      });

      if (data.success) {
        setTags(prev => prev.map(t => 
          t.id === tag.id 
            ? { ...t, isActive: !t.isActive }
            : t
        ));
      } else {
        setError(data.error?.message || 'Failed to update tag');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      setError('An unexpected error occurred');
    }
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tag: Tag) => {
    setMenuAnchor(event.currentTarget);
    setActionMenuTag(tag);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActionMenuTag(null);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Tags
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage product tags and labels
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTag}
          >
            Add Tag
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
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
          />
        </Card>

        {/* Tags Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tag</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Products</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTags.map((tag) => (
                  <TableRow key={tag.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <TagIcon sx={{ color: tag.color }} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {tag.name}
                          </Typography>
                          <Chip
                            label={tag.name}
                            size="small"
                            sx={{
                              backgroundColor: tag.color,
                              color: 'white',
                              fontSize: '0.75rem',
                            }}
                          />
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {tag.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            backgroundColor: tag.color,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                        <Typography variant="body2" fontFamily="monospace">
                          {tag.color}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tag.productCount}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tag.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={tag.isActive ? 'success' : 'default'}
                        variant={tag.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(tag.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, tag)}
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
                        Loading tags...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredTags.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No tags match your search' : 'No tags found'}
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
          <MenuItem onClick={() => actionMenuTag && handleViewTag(actionMenuTag)}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View
          </MenuItem>
          <MenuItem onClick={() => actionMenuTag && handleEditTag(actionMenuTag)}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem onClick={() => actionMenuTag && handleToggleStatus(actionMenuTag)}>
            <TagIcon sx={{ mr: 1 }} fontSize="small" />
            {actionMenuTag?.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
          <MenuItem 
            onClick={() => actionMenuTag && handleDeleteTag(actionMenuTag)}
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