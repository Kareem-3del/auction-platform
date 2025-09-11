'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Stack,
  Alert,
  Button,
  Select,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  Autocomplete,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Product {
  id: string;
  title: string;
  description: string;
  images?: string[];
}

interface Auction {
  id: string;
  title: string;
  description: string;
  startingBid: number;
  currentBid: number;
  reservePrice?: number;
  bidIncrement: number;
  startTime: string;
  endTime: string;
  status: string;
  productId: string;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export default function EditAuctionPage() {
  const router = useRouter();
  const params = useParams();
  const auctionId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productId: '',
    startingBid: '',
    reservePrice: '',
    bidIncrement: '',
    startTime: '',
    endTime: '',
    status: 'PENDING',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [auctionData, productsData] = await Promise.all([
          apiClient.get(`/api/auctions/${auctionId}?includeProduct=true`),
          apiClient.get('/api/auctions')
        ]);

        const a = auctionData.data || auctionData;
        setAuction(a);
        
        setFormData({
          title: a.title || '',
          description: a.description || '',
          productId: a.productId || '',
          startingBid: a.startingBid?.toString() || '',
          reservePrice: a.reservePrice?.toString() || '',
          bidIncrement: a.bidIncrement?.toString() || '',
          startTime: a.startTime ? new Date(a.startTime).toISOString().slice(0, 16) : '',
          endTime: a.endTime ? new Date(a.endTime).toISOString().slice(0, 16) : '',
          status: a.status || 'PENDING',
        });

        setProducts(productsData.data || productsData || []);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [auctionId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Auction title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.productId) {
      newErrors.productId = 'Product selection is required';
    }

    if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
      newErrors.startingBid = 'Valid starting bid is required';
    }

    if (formData.reservePrice && parseFloat(formData.reservePrice) < parseFloat(formData.startingBid || '0')) {
      newErrors.reservePrice = 'Reserve price must be greater than or equal to starting bid';
    }

    if (!formData.bidIncrement || parseFloat(formData.bidIncrement) <= 0) {
      newErrors.bidIncrement = 'Valid bid increment is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const data = await apiClient.put(`/api/auctions/${auctionId}`, {
        ...formData,
        startingBid: parseFloat(formData.startingBid),
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
        bidIncrement: parseFloat(formData.bidIncrement),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });

      if (data.success) {
        setSuccessMessage('Auction updated successfully!');
        setTimeout(() => {
          router.push('/dashboard/auctions');
        }, 1500);
      } else {
        setErrors({ general: data.error?.message || 'Failed to update auction' });
      }
    } catch (error) {
      console.error('Error updating auction:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/auctions');
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              Edit Auction
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update auction information and settings
            </Typography>
          </Box>
        </Stack>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                {/* Basic Information */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Auction Title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      error={!!errors.title}
                      helperText={errors.title}
                      required
                    />

                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      error={!!errors.description}
                      helperText={errors.description}
                      required
                    />

                    <Autocomplete
                      options={products}
                      getOptionLabel={(option) => option.title}
                      value={selectedProduct || null}
                      onChange={(_, newValue) => handleInputChange('productId', newValue?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Product"
                          error={!!errors.productId}
                          helperText={errors.productId || 'Select the product to auction'}
                          required
                        />
                      )}
                    />

                    <FormControl fullWidth error={!!errors.status}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formData.status}
                        label="Status"
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <MenuItem value="PENDING">Pending</MenuItem>
                        <MenuItem value="ACTIVE">Active</MenuItem>
                        <MenuItem value="COMPLETED">Completed</MenuItem>
                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Card>

                {/* Bidding Settings */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Bidding Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Starting Bid"
                        type="number"
                        value={formData.startingBid}
                        onChange={(e) => handleInputChange('startingBid', e.target.value)}
                        error={!!errors.startingBid}
                        helperText={errors.startingBid || 'Minimum bid to start the auction'}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Reserve Price (Optional)"
                        type="number"
                        value={formData.reservePrice}
                        onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                        error={!!errors.reservePrice}
                        helperText={errors.reservePrice || 'Minimum price to sell the item'}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bid Increment"
                        type="number"
                        value={formData.bidIncrement}
                        onChange={(e) => handleInputChange('bidIncrement', e.target.value)}
                        error={!!errors.bidIncrement}
                        helperText={errors.bidIncrement || 'Minimum amount each bid must increase'}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        required
                      />
                    </Grid>
                  </Grid>
                </Card>

                {/* Timing */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Auction Timing
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Start Time"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                        error={!!errors.startTime}
                        helperText={errors.startTime}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="End Time"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                        error={!!errors.endTime}
                        helperText={errors.endTime}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        required
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Stack>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Auction Details */}
                {auction && (
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Auction Details
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Auction ID
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {auction.id}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Current Bid
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" color="success.main">
                          ${auction.currentBid.toFixed(2)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body2">
                          {new Date(auction.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body2">
                          {new Date(auction.updatedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                )}

                {/* Actions */}
                <Stack direction="column" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                    fullWidth
                  >
                    {isSubmitting ? 'Updating...' : 'Update Auction'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Box>
    </DashboardContent>
  );
}