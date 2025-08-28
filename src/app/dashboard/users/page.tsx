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
  Avatar,
  Select,
  Tooltip,
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
import {
  Add as AddIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as VerifyIcon,
} from '@mui/icons-material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  userType: string;
  kycStatus: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  productCount?: number;
  bidCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuUser, setActionMenuUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/users?includeStats=true');

        if (data.success) {
          setUsers(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to load users');
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUserType = userTypeFilter === 'all' || user.userType === userTypeFilter;
    const matchesKyc = kycFilter === 'all' || user.kycStatus === kycFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesUserType && matchesKyc && matchesStatus;
  }) : [];

  const handleCreateUser = () => {
    router.push('/dashboard/users/create');
  };

  const handleViewUser = (user: User) => {
    router.push(`/dashboard/users/${user.id}`);
    setMenuAnchor(null);
  };

  const handleEditUser = (user: User) => {
    router.push(`/dashboard/users/${user.id}/edit`);
    setMenuAnchor(null);
  };

  const handleDeleteUser = async (user: User) => {
    if (confirm(`Are you sure you want to delete "${user.email}"?`)) {
      try {
        const data = await apiClient.delete(`/api/users/${user.id}`);

        if (data.success) {
          setUsers(prev => prev.filter(u => u.id !== user.id));
        } else {
          setError(data.error?.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('An unexpected error occurred');
      }
    }
    setMenuAnchor(null);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const data = await apiClient.put(`/api/users/${user.id}`, {
        isActive: !user.isActive,
      });

      if (data.success) {
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, isActive: !u.isActive }
            : u
        ));
      } else {
        setError(data.error?.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('An unexpected error occurred');
    }
    setMenuAnchor(null);
  };

  const handleVerifyKyc = async (user: User) => {
    try {
      const data = await apiClient.put(`/api/users/${user.id}/kyc`, {
        kycStatus: user.kycStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED',
      });

      if (data.success) {
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, kycStatus: user.kycStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED' }
            : u
        ));
      } else {
        setError(data.error?.message || 'Failed to update KYC status');
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      setError('An unexpected error occurred');
    }
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchor(event.currentTarget);
    setActionMenuUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActionMenuUser(null);
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'ADMIN':
        return 'error';
      case 'AGENT':
        return 'primary';
      case 'BUYER':
        return 'success';
      default:
        return 'default';
    }
  };

  const getKycColor = (kycStatus: string) => {
    switch (kycStatus) {
      case 'VERIFIED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Users
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage user accounts and permissions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
          >
            Add User
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
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ flex: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>User Type</InputLabel>
              <Select
                value={userTypeFilter}
                label="User Type"
                onChange={(e) => setUserTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="AGENT">Agent</MenuItem>
                <MenuItem value="BUYER">Buyer</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>KYC Status</InputLabel>
              <Select
                value={kycFilter}
                label="KYC Status"
                onChange={(e) => setKycFilter(e.target.value)}
              >
                <MenuItem value="all">All KYC</MenuItem>
                <MenuItem value="VERIFIED">Verified</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Users Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>KYC Status</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                          sx={{ width: 40, height: 40 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user.id}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.userType}
                        size="small"
                        color={getUserTypeColor(user.userType) as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <EmailIcon sx={{ fontSize: 14 }} />
                          <Typography variant="body2">
                            {user.email}
                          </Typography>
                          {user.emailVerified && (
                            <Tooltip title="Email verified">
                              <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                            </Tooltip>
                          )}
                        </Stack>
                        {user.phone && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PhoneIcon sx={{ fontSize: 14 }} />
                            <Typography variant="body2" color="text.secondary">
                              {user.phone}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.kycStatus}
                        size="small"
                        color={getKycColor(user.kycStatus) as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          Products: {user.productCount || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bids: {user.bidCount || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last login: {formatLastLogin(user.lastLoginAt)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={user.isActive ? 'success' : 'default'}
                        variant={user.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(user.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, user)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Loading users...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No users match your search' : 'No users found'}
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
          <MenuItem onClick={() => actionMenuUser && handleViewUser(actionMenuUser)}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View
          </MenuItem>
          <MenuItem onClick={() => actionMenuUser && handleEditUser(actionMenuUser)}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem onClick={() => actionMenuUser && handleVerifyKyc(actionMenuUser)}>
            <VerifyIcon sx={{ mr: 1 }} fontSize="small" />
            {actionMenuUser?.kycStatus === 'VERIFIED' ? 'Unverify KYC' : 'Verify KYC'}
          </MenuItem>
          <MenuItem onClick={() => actionMenuUser && handleToggleStatus(actionMenuUser)}>
            <BlockIcon sx={{ mr: 1 }} fontSize="small" />
            {actionMenuUser?.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
          <MenuItem 
            onClick={() => actionMenuUser && handleDeleteUser(actionMenuUser)}
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