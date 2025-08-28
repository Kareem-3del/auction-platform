'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function CreateAuctionPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productId: '',
    startingBid: '',
    reservePrice: '',
    bidIncrement: '10',
    startTime: '',
    endTime: '',
    status: 'PENDING',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiClient.get('/api/products?status=APPROVED&hasAuction=false');

        if (data.success) {
          setProducts(data.data || []);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate title from product if product is selected and title is empty
    if (field === 'productId' && value && !formData.title) {
      const product = products.find(p => p.id === value);
      if (product) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          title: `Auction for ${product.title}`,
          description: product.description || '',
        }));
      }
    }

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

    const startTime = new Date(formData.startTime);
    const now = new Date();
    if (startTime <= now) {
      newErrors.startTime = 'Start time must be in the future';
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
      const data = await apiClient.post('/api/auctions', {
        ...formData,
        startingBid: parseFloat(formData.startingBid),
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
        bidIncrement: parseFloat(formData.bidIncrement),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });

      if (data.success) {
        setSuccessMessage('Auction created successfully!');
        setTimeout(() => {
          router.push('/dashboard/auctions');
        }, 1500);
      } else {
        setErrors({ general: data.error?.message || 'Failed to create auction' });
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/auctions');
  };

  // Set default times (start: now + 1 hour, end: now + 7 days)
  useEffect(() => {
    if (!formData.startTime && !formData.endTime) {
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
      const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
      
      setFormData(prev => ({
        ...prev,
        startTime: startTime.toISOString().slice(0, 16),
        endTime: endTime.toISOString().slice(0, 16),
      }));
    }
  }, [formData.startTime, formData.endTime]);

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
              Create Auction
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new auction for your product
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

        {products.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No approved products available for auction. Please ensure you have approved products without existing auctions.
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

                    <FormControl fullWidth error={!!errors.status}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formData.status}
                        label="Status"
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <MenuItem value="PENDING">Pending</MenuItem>
                        <MenuItem value="ACTIVE">Active</MenuItem>
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
                {/* Product Preview */}
                {selectedProduct && (
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Selected Product
                    </Typography>
                    <Stack spacing={2}>
                      {selectedProduct.images?.[0] && (
                        <Box
                          component="img"
                          src={selectedProduct.images[0]}
                          alt={selectedProduct.title}
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                      )}
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {selectedProduct.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedProduct.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                )}

                {/* Auction Preview */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Auction Preview
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Starting Bid
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {formData.startingBid ? `$${parseFloat(formData.startingBid).toFixed(2)}` : '$0.00'}
                      </Typography>
                    </Box>
                    
                    {formData.reservePrice && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Reserve Price
                        </Typography>
                        <Typography variant="body2">
                          ${parseFloat(formData.reservePrice).toFixed(2)}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body2">
                        {formData.startTime && formData.endTime ? (
                          `${Math.ceil((new Date(formData.endTime).getTime() - new Date(formData.startTime).getTime()) / (1000 * 60 * 60 * 24))} days`
                        ) : (
                          'Not set'
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                {/* Actions */}
                <Stack direction="column" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting || products.length === 0}
                    fullWidth
                  >
                    {isSubmitting ? 'Creating...' : 'Create Auction'}
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