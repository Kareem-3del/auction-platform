'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Category as CategoryIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

import { useAuth } from 'src/hooks/useAuth';
import { useLocale } from 'src/hooks/useLocale';
import { DashboardContent } from 'src/layouts/dashboard';
import { auctionsAPI, categoriesAPI } from 'src/lib/api-client';
import MultiImageUpload from 'src/components/common/MultiImageUpload';

interface AuctionFormData {
  title: string;
  description: string;
  startingPrice: number;
  reservePrice?: number;
  minimumBidIncrement: number;
  startTime: string;
  endTime: string;
  currency: string;
  shippingCost?: number;
  allowInternationalShipping: boolean;
  condition?: string;
  minimumBidderRating?: number;
  autoExtendMinutes: number;
  featuredAuction: boolean;
  categoryIds?: string[];
  tagIds?: string[];
  imageIds?: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
  { value: 'acceptable', label: 'Acceptable' },
  { value: 'poor', label: 'Poor' },
  { value: 'for_parts', label: 'For Parts' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'KWD', label: 'KWD (د.ك)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

export default function CreateAuctionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLocale();

  const [formData, setFormData] = useState<AuctionFormData>({
    title: '',
    description: '',
    startingPrice: 0,
    minimumBidIncrement: 1,
    startTime: '',
    endTime: '',
    currency: 'KWD',
    allowInternationalShipping: false,
    autoExtendMinutes: 5,
    featuredAuction: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Check authentication and user type
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user && user.userType !== 'AGENT') {
      router.push('/dashboard');
      return;
    }
  }, [user, loading, router]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoriesAPI.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (field: keyof AuctionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleImagesChange = (imageIds: string[]) => {
    setUploadedImages(imageIds);
    setFormData((prev) => ({ ...prev, imageIds }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.startingPrice <= 0) {
      newErrors.startingPrice = 'Starting price must be greater than 0';
    }
    if (formData.minimumBidIncrement <= 0) {
      newErrors.minimumBidIncrement = 'Minimum bid increment must be greater than 0';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    // Date validation
    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
    const now = new Date();

    if (startTime <= now) {
      newErrors.startTime = 'Start time must be in the future';
    }
    if (endTime <= startTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    // Reserve price validation
    if (formData.reservePrice && formData.reservePrice <= formData.startingPrice) {
      newErrors.reservePrice = 'Reserve price must be higher than starting price';
    }

    // Minimum bidder rating validation
    if (formData.minimumBidderRating && (formData.minimumBidderRating < 0 || formData.minimumBidderRating > 5)) {
      newErrors.minimumBidderRating = 'Minimum bidder rating must be between 0 and 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitSuccess(false);

      const auctionData = {
        ...formData,
        categoryIds: formData.categoryIds?.filter(id => id) || [],
        tagIds: formData.tagIds?.filter(id => id) || [],
        imageIds: uploadedImages,
      };

      const response = await auctionsAPI.createAuction(auctionData);
      
      if (response.success) {
        setSubmitSuccess(true);
        // Redirect to auction page after short delay
        setTimeout(() => {
          router.push(`/products/${response.data.id}`);
        }, 2000);
      } else {
        console.error('Failed to create auction:', response.error);
        setErrors({ submit: response.error.message || 'Failed to create auction' });
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      setErrors({ submit: 'An error occurred while creating the auction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    if (!validateForm()) {
      return;
    }
    // TODO: Implement preview functionality
    console.log('Preview auction:', formData);
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (!user || user.userType !== 'AGENT') {
    return (
      <DashboardContent>
        <Box sx={{ py: 3 }}>
          <Alert severity="error">
            You must be logged in as an agent to create auctions.
          </Alert>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        <Box mb={3}>
          <Typography variant="h4" gutterBottom>
            Create New Auction
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Fill in the details below to create your auction listing
          </Typography>
        </Box>

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Auction created successfully! Redirecting to auction page...
          </Alert>
        )}

        {errors.submit && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.submit}
          </Alert>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CategoryIcon sx={{ mr: 1 }} />
                  Basic Information
                </Typography>

                <Stack spacing={3}>
                  <TextField
                    label="Auction Title"
                    fullWidth
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    error={!!errors.title}
                    helperText={errors.title}
                    placeholder="Enter a descriptive title for your auction"
                  />

                  <TextField
                    label="Description"
                    fullWidth
                    required
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    error={!!errors.description}
                    helperText={errors.description}
                    placeholder="Describe your item in detail..."
                  />

                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.categoryIds?.[0] || ''}
                      onChange={(e) => handleInputChange('categoryIds', [e.target.value])}
                      disabled={loadingCategories}
                    >
                      <MenuItem value="">
                        <em>Select a category</em>
                      </MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>Choose the most appropriate category for your item</FormHelperText>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={formData.condition || ''}
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select condition</em>
                      </MenuItem>
                      {CONDITION_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>Describe the condition of your item</FormHelperText>
                  </FormControl>
                </Stack>
              </Card>
            </Grid>

            {/* Images */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ImageIcon sx={{ mr: 1 }} />
                  Images
                </Typography>

                <MultiImageUpload
                  images={uploadedImages}
                  onChange={handleImagesChange}
                  maxImages={10}
                />
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Upload high-quality images of your item. The first image will be used as the main image.
                </Typography>
              </Card>
            </Grid>

            {/* Pricing */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <MoneyIcon sx={{ mr: 1 }} />
                  Pricing & Currency
                </Typography>

                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={8}>
                      <TextField
                        label="Starting Price"
                        type="number"
                        fullWidth
                        required
                        value={formData.startingPrice}
                        onChange={(e) => handleInputChange('startingPrice', parseFloat(e.target.value) || 0)}
                        error={!!errors.startingPrice}
                        helperText={errors.startingPrice}
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">{formData.currency}</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Currency</InputLabel>
                        <Select
                          value={formData.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                        >
                          {CURRENCY_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <TextField
                    label="Reserve Price (Optional)"
                    type="number"
                    fullWidth
                    value={formData.reservePrice || ''}
                    onChange={(e) => handleInputChange('reservePrice', parseFloat(e.target.value) || undefined)}
                    error={!!errors.reservePrice}
                    helperText={errors.reservePrice || "Minimum price you're willing to accept"}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{formData.currency}</InputAdornment>,
                    }}
                  />

                  <TextField
                    label="Minimum Bid Increment"
                    type="number"
                    fullWidth
                    required
                    value={formData.minimumBidIncrement}
                    onChange={(e) => handleInputChange('minimumBidIncrement', parseFloat(e.target.value) || 1)}
                    error={!!errors.minimumBidIncrement}
                    helperText={errors.minimumBidIncrement}
                    inputProps={{ min: 0.01, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{formData.currency}</InputAdornment>,
                    }}
                  />

                  <TextField
                    label="Shipping Cost (Optional)"
                    type="number"
                    fullWidth
                    value={formData.shippingCost || ''}
                    onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value) || undefined)}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{formData.currency}</InputAdornment>,
                    }}
                  />
                </Stack>
              </Card>
            </Grid>

            {/* Schedule & Settings */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ScheduleIcon sx={{ mr: 1 }} />
                  Schedule & Settings
                </Typography>

                <Stack spacing={3}>
                  <TextField
                    label="Start Time"
                    type="datetime-local"
                    fullWidth
                    required
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    error={!!errors.startTime}
                    helperText={errors.startTime}
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="End Time"
                    type="datetime-local"
                    fullWidth
                    required
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    error={!!errors.endTime}
                    helperText={errors.endTime}
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="Auto Extend Minutes"
                    type="number"
                    fullWidth
                    value={formData.autoExtendMinutes}
                    onChange={(e) => handleInputChange('autoExtendMinutes', parseInt(e.target.value) || 5)}
                    helperText="Minutes to extend auction if bid placed near end"
                    inputProps={{ min: 0, max: 60 }}
                  />

                  <TextField
                    label="Minimum Bidder Rating (Optional)"
                    type="number"
                    fullWidth
                    value={formData.minimumBidderRating || ''}
                    onChange={(e) => handleInputChange('minimumBidderRating', parseFloat(e.target.value) || undefined)}
                    error={!!errors.minimumBidderRating}
                    helperText={errors.minimumBidderRating || "Minimum rating required to bid (0-5)"}
                    inputProps={{ min: 0, max: 5, step: 0.1 }}
                  />

                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.allowInternationalShipping}
                          onChange={(e) => handleInputChange('allowInternationalShipping', e.target.checked)}
                        />
                      }
                      label="Allow International Shipping"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.featuredAuction}
                          onChange={(e) => handleInputChange('featuredAuction', e.target.checked)}
                        />
                      }
                      label="Featured Auction"
                    />
                  </Stack>
                </Stack>
              </Card>
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => router.push('/dashboard')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={handlePreview}
                    disabled={isSubmitting}
                  >
                    Preview
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Auction'}
                  </Button>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </form>
      </Box>
    </DashboardContent>
  );
}