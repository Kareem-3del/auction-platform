'use client';

import { useState, useEffect } from 'react';

import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Alert,
  Button,
  Select,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  TableContainer,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  generatedAt: string;
  size: string;
  downloadUrl?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/reports');

        if (data.success) {
          setReports(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to load reports');
          setReports([]);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
        setError('An unexpected error occurred');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const filteredReports = Array.isArray(reports) ? reports.filter(report => {
    const matchesSearch = 
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  }) : [];

  const handleGenerateReport = (type: string) => {
    console.log(`Generating ${type} report...`);
  };

  const handleDownloadReport = (report: Report) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'success';
      case 'generating':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate and download system reports
            </Typography>
          </Box>
        </Stack>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Quick Report Generation */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generate New Report
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<ReportIcon />}
              onClick={() => handleGenerateReport('auction-performance')}
            >
              Auction Performance
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={() => handleGenerateReport('user-activity')}
            >
              User Activity
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={() => handleGenerateReport('revenue')}
            >
              Revenue Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={() => handleGenerateReport('inventory')}
            >
              Inventory Report
            </Button>
          </Stack>
        </Card>

        {/* Filters */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ flex: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="auction">Auction</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="financial">Financial</MenuItem>
                <MenuItem value="inventory">Inventory</MenuItem>
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
                <MenuItem value="ready">Ready</MenuItem>
                <MenuItem value="generating">Generating</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Reports Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Generated</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {report.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {report.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        size="small"
                        color={getStatusColor(report.status) as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(report.generatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {report.size}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReport(report)}
                        disabled={report.status !== 'ready'}
                      >
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Loading reports...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No reports match your search' : 'No reports found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </DashboardContent>
  );
}