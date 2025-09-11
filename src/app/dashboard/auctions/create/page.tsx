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
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { auctionsAPI } from 'src/lib/api-client';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuth } from 'src/hooks/useAuth';
import MultiImageUpload from 'src/components/common/MultiImageUpload';

export default function CreateAuctionPage() {
  const router = useRouter();
  const { tokens, refreshToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Item Details
    title: '',
    description: '',
    categoryId: '',
    condition: 'NEW' as 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR',
    location: '',
    provenance: '',
    dimensions: '',
    weight: '',
    materials: '',
    authenticity: '',
    
    // Pricing
    estimatedValueMin: '',
    estimatedValueMax: '',
    startingBid: '',
    reservePrice: '',
    bidIncrement: '10',
    buyNowPrice: '',
    
    // Auction Settings
    auctionType: 'LIVE' as 'LIVE' | 'TIMED' | 'SILENT',
    startTime: '',
    endTime: '',
    timezone: 'UTC',
    autoExtend: true,
    extensionTriggerMinutes: '2',
    extensionDurationMinutes: '5',
    maxExtensions: '3',
    
    // Display Settings
    showBidderNames: true,
    showBidCount: true,
    showWatcherCount: true,
    
    // Shipping
    pickupAvailable: false,
    pickupAddress: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?flat=true');
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data.map((cat: any) => ({ id: cat.id, name: cat.name })));
        } else {
          console.error('Failed to fetch categories:', result.success ? 'Invalid data format' : result.error?.message);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

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

    // Item Details Validation
    if (!formData.title.trim()) {
      newErrors.title = 'Auction title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    // Pricing Validation
    if (!formData.estimatedValueMin || parseFloat(formData.estimatedValueMin) <= 0) {
      newErrors.estimatedValueMin = 'Minimum estimated value is required';
    }

    if (!formData.estimatedValueMax || parseFloat(formData.estimatedValueMax) <= 0) {
      newErrors.estimatedValueMax = 'Maximum estimated value is required';
    }

    if (parseFloat(formData.estimatedValueMax) < parseFloat(formData.estimatedValueMin)) {
      newErrors.estimatedValueMax = 'Maximum value must be greater than minimum value';
    }

    if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
      newErrors.startingBid = 'Valid starting bid is required';
    }

    if (formData.reservePrice && parseFloat(formData.reservePrice) < parseFloat(formData.estimatedValueMin || '0')) {
      newErrors.reservePrice = 'Reserve price must be at least the minimum estimated value';
    }

    if (!formData.bidIncrement || parseFloat(formData.bidIncrement) <= 0) {
      newErrors.bidIncrement = 'Valid bid increment is required';
    }

    // Auction Timing Validation
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

    // Images Validation
    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
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

      const auctionData = {
        // Item details
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        condition: formData.condition,
        location: formData.location,
        images: images,
        
        // Specifications
        provenance: formData.provenance,
        dimensions: formData.dimensions,
        weight: formData.weight,
        materials: formData.materials,
        authenticity: formData.authenticity,
        
        // Pricing
        estimatedValueMin: parseFloat(formData.estimatedValueMin),
        estimatedValueMax: parseFloat(formData.estimatedValueMax),
        startingBid: parseFloat(formData.startingBid),
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
        bidIncrement: parseFloat(formData.bidIncrement),
        buyNowPrice: formData.buyNowPrice ? parseFloat(formData.buyNowPrice) : null,
        
        // Auction settings
        auctionType: formData.auctionType,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        timezone: formData.timezone,
        autoExtend: formData.autoExtend,
        extensionTriggerMinutes: parseInt(formData.extensionTriggerMinutes),
        extensionDurationMinutes: parseInt(formData.extensionDurationMinutes),
        maxExtensions: parseInt(formData.maxExtensions),
        
        // Display settings
        showBidderNames: formData.showBidderNames,
        showBidCount: formData.showBidCount,
        showWatcherCount: formData.showWatcherCount,
        
        // Shipping
        pickupAvailable: formData.pickupAvailable,
        pickupAddress: formData.pickupAddress || null,
      };

      console.log('Creating auction with data:', { ...auctionData, images: `${images.length} images` });

      const data = await auctionsAPI.createAuction(auctionData);

      if (data.success) {
        setSuccessMessage('Auction created successfully!');
        setTimeout(() => {
          router.push('/dashboard/auctions');
        }, 1500);
      } else {
        console.error('Auction creation failed:', data);
        setErrors({ general: data.error?.message || 'Failed to create auction' });
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
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

  if (loadingCategories) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

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
              Create a new auction item with all details and settings
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
                {/* Item Details */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Item Details
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

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={!!errors.categoryId}>
                          <InputLabel>Category *</InputLabel>
                          <Select
                            value={formData.categoryId}
                            label="Category *"
                            onChange={(e) => handleInputChange('categoryId', e.target.value)}
                          >
                            {categories.map((category) => (
                              <MenuItem key={category.id} value={category.id}>
                                {category.name}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.categoryId && (
                            <Typography variant="caption" color="error">
                              {errors.categoryId}
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Condition</InputLabel>
                          <Select
                            value={formData.condition}
                            label="Condition"
                            onChange={(e) => handleInputChange('condition', e.target.value)}
                          >
                            <MenuItem value="NEW">New</MenuItem>
                            <MenuItem value="EXCELLENT">Excellent</MenuItem>
                            <MenuItem value="GOOD">Good</MenuItem>
                            <MenuItem value="FAIR">Fair</MenuItem>
                            <MenuItem value="POOR">Poor</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <TextField
                      fullWidth
                      label="Location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      error={!!errors.location}
                      helperText={errors.location}
                      required
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Provenance"
                          value={formData.provenance}
                          onChange={(e) => handleInputChange('provenance', e.target.value)}
                          helperText="Item's origin or history"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Dimensions"
                          value={formData.dimensions}
                          onChange={(e) => handleInputChange('dimensions', e.target.value)}
                          helperText="Size measurements"
                        />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Weight"
                          value={formData.weight}
                          onChange={(e) => handleInputChange('weight', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Materials"
                          value={formData.materials}
                          onChange={(e) => handleInputChange('materials', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Authenticity"
                          value={formData.authenticity}
                          onChange={(e) => handleInputChange('authenticity', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </Card>

                {/* Images */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Images
                  </Typography>
                  <MultiImageUpload
                    images={images}
                    onChange={setImages}
                    error={errors.images}
                    maxImages={10}
                  />
                  {errors.images && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {errors.images}
                    </Typography>
                  )}
                </Card>

                {/* Pricing */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Pricing & Bidding
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Estimated Value (Min)"
                        type="number"
                        value={formData.estimatedValueMin}
                        onChange={(e) => handleInputChange('estimatedValueMin', e.target.value)}
                        error={!!errors.estimatedValueMin}
                        helperText={errors.estimatedValueMin}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Estimated Value (Max)"
                        type="number"
                        value={formData.estimatedValueMax}
                        onChange={(e) => handleInputChange('estimatedValueMax', e.target.value)}
                        error={!!errors.estimatedValueMax}
                        helperText={errors.estimatedValueMax}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        required
                      />
                    </Grid>
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
                    <Grid item xs={12} md={6}>
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
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Buy Now Price (Optional)"
                        type="number"
                        value={formData.buyNowPrice}
                        onChange={(e) => handleInputChange('buyNowPrice', e.target.value)}
                        helperText="Price to buy item immediately"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Card>

                {/* Auction Settings */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Auction Settings
                  </Typography>
                  <Stack spacing={3}>
                    <FormControl fullWidth>
                      <InputLabel>Auction Type</InputLabel>
                      <Select
                        value={formData.auctionType}
                        label="Auction Type"
                        onChange={(e) => handleInputChange('auctionType', e.target.value)}
                      >
                        <MenuItem value="LIVE">Live Auction</MenuItem>
                        <MenuItem value="TIMED">Timed Auction</MenuItem>
                        <MenuItem value="SILENT">Silent Auction</MenuItem>
                      </Select>
                    </FormControl>

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

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Extension Trigger (Minutes)"
                          type="number"
                          value={formData.extensionTriggerMinutes}
                          onChange={(e) => handleInputChange('extensionTriggerMinutes', e.target.value)}
                          helperText="Extend if bid within this time"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Extension Duration (Minutes)"
                          type="number"
                          value={formData.extensionDurationMinutes}
                          onChange={(e) => handleInputChange('extensionDurationMinutes', e.target.value)}
                          helperText="How long to extend"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Max Extensions"
                          type="number"
                          value={formData.maxExtensions}
                          onChange={(e) => handleInputChange('maxExtensions', e.target.value)}
                          helperText="Maximum number of extensions"
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </Card>
              </Stack>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
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
                        Estimated Value
                      </Typography>
                      <Typography variant="body2">
                        {formData.estimatedValueMin && formData.estimatedValueMax ? (
                          `$${parseFloat(formData.estimatedValueMin).toFixed(2)} - $${parseFloat(formData.estimatedValueMax).toFixed(2)}`
                        ) : (
                          'Not set'
                        )}
                      </Typography>
                    </Box>

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
                    disabled={isSubmitting}
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