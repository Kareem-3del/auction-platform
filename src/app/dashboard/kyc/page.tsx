'use client';

import { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Chip,
  Menu,
  Stack,
  Table,
  Alert,
  Select,
  Avatar,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  TableContainer,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  Verified as VerifiedIcon,
  ErrorOutline as ErrorIcon,
  CheckCircle as ApproveIcon,
} from '@mui/icons-material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface KYCSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: string;
  documentType: string;
  documentNumber: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  riskLevel: string;
}

export default function KYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuSubmission, setActionMenuSubmission] = useState<KYCSubmission | null>(null);

  useEffect(() => {
    const loadKYCSubmissions = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/kyc');

        if (data.success) {
          setSubmissions(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to load KYC submissions');
          setSubmissions([]);
        }
      } catch (error) {
        console.error('Error loading KYC submissions:', error);
        setError('An unexpected error occurred');
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadKYCSubmissions();
  }, []);

  const filteredSubmissions = Array.isArray(submissions) ? submissions.filter(submission => {
    const matchesSearch = 
      submission.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.documentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || submission.riskLevel === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  }) : [];

  const handleApproveKYC = async (submission: KYCSubmission) => {
    try {
      const data = await apiClient.put(`/api/kyc/${submission.id}/approve`);


      if (data.success) {
        setSubmissions(prev => prev.map(s => 
          s.id === submission.id 
            ? { ...s, status: 'approved', reviewedAt: new Date().toISOString() }
            : s
        ));
      } else {
        setError(data.error?.message || 'Failed to approve KYC');
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      setError('An unexpected error occurred');
    }
    setMenuAnchor(null);
  };

  const handleRejectKYC = async (submission: KYCSubmission) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const data = await apiClient.put(`/api/kyc/${submission.id}/reject`, { reason });

      if (data.success) {
        setSubmissions(prev => prev.map(s => 
          s.id === submission.id 
            ? { ...s, status: 'rejected', reviewedAt: new Date().toISOString(), rejectionReason: reason }
            : s
        ));
      } else {
        setError(data.error?.message || 'Failed to reject KYC');
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      setError('An unexpected error occurred');
    }
    setMenuAnchor(null);
  };

  const handleViewKYC = (submission: KYCSubmission) => {
    console.log('Viewing KYC submission:', submission);
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, submission: KYCSubmission) => {
    setMenuAnchor(event.currentTarget);
    setActionMenuSubmission(submission);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActionMenuSubmission(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <VerifiedIcon color="success" />;
      case 'rejected':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <WarningIcon color="warning" />;
      default:
        return <PersonIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              KYC Verification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and manage user identity verification
            </Typography>
          </Box>
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
              placeholder="Search KYC submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ flex: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Risk Level</InputLabel>
              <Select
                value={riskFilter}
                label="Risk Level"
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <MenuItem value="all">All Risks</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* KYC Submissions Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Document</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Reviewed</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ width: 40, height: 40 }}>
                          {getStatusIcon(submission.status)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {submission.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {submission.userEmail}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {submission.documentType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {submission.documentNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={submission.status}
                        size="small"
                        color={getStatusColor(submission.status) as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={submission.riskLevel}
                        size="small"
                        color={getRiskColor(submission.riskLevel) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(submission.submittedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {submission.reviewedAt ? formatDate(submission.reviewedAt) : '-'}
                      </Typography>
                      {submission.rejectionReason && (
                        <Typography variant="caption" color="error.main" display="block">
                          Reason: {submission.rejectionReason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, submission)}
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
                        Loading KYC submissions...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredSubmissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No KYC submissions match your search' : 'No KYC submissions found'}
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
          <MenuItem onClick={() => actionMenuSubmission && handleViewKYC(actionMenuSubmission)}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View Details
          </MenuItem>
          <MenuItem 
            onClick={() => actionMenuSubmission && handleApproveKYC(actionMenuSubmission)}
            disabled={actionMenuSubmission?.status === 'approved'}
            sx={{ color: 'success.main' }}
          >
            <ApproveIcon sx={{ mr: 1 }} fontSize="small" />
            Approve
          </MenuItem>
          <MenuItem 
            onClick={() => actionMenuSubmission && handleRejectKYC(actionMenuSubmission)}
            disabled={actionMenuSubmission?.status === 'rejected'}
            sx={{ color: 'error.main' }}
          >
            <RejectIcon sx={{ mr: 1 }} fontSize="small" />
            Reject
          </MenuItem>
        </Menu>
      </Box>
    </DashboardContent>
  );
}