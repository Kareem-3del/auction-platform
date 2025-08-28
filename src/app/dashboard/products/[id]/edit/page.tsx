'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Add as AddIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Stack,
  Alert,
  Button,
  Switch,
  Select,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  InputAdornment,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  condition: string;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  reservePrice?: number;
  specifications?: any;
  customFields?: any;
  images?: string[];
  status: string;
  isActive?: boolean;
  categoryId?: string;
  brandId?: string;
  category?: Category;
  brand?: Brand;
  tags?: Tag[];
  // Unified auction fields
  startingBid?: number;
  currentBid?: number;
  bidIncrement?: number;
  auctionType?: string;
  auctionStatus?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  autoExtend?: boolean;
  extensionTriggerMinutes?: number;
  extensionDurationMinutes?: number;
  maxExtensions?: number;
  buyNowPrice?: number;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [originalData, setOriginalData] = useState<any>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    brandId: '',
    condition: 'NEW',
    estimatedValueMin: '',
    estimatedValueMax: '',
    reservePrice: '',
    images: [] as string[],
    specifications: [{ key: '', value: '' }],
    customFields: {} as any,
    status: 'PENDING_APPROVAL',
    // Unified auction fields
    startingBid: '',
    bidIncrement: '',
    auctionType: 'LIVE',
    startTime: '',
    endTime: '',
    timezone: 'America/New_York',
    autoExtend: true,
    extensionTriggerMinutes: '5',
    extensionDurationMinutes: '10',
    maxExtensions: '3',
    buyNowPrice: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load product, categories, brands, and tags in parallel
        const [productData, categoriesData, brandsData, tagsData] = await Promise.all([
          apiClient.get(`/api/products/${productId}`),
          apiClient.get('/api/categories'),
          apiClient.get('/api/brands'),
          apiClient.get('/api/tags')
        ]);

        // Handle different API response structures
        let prod;
        if (productData.success && productData.data) {
          // Format: { success: true, data: { product: {...} } }
          prod = productData.data.product || productData.data;
        } else if (productData.data) {
          // Format: { data: {...} }
          prod = productData.data;
        } else {
          // Direct format: { title: "...", ... }
          prod = productData;
        }
        
        if (prod) {
          console.log('Product data:', prod); // Debug log
          setProduct(prod);
          
          // Parse specifications if they exist
          let specs = [{ key: '', value: '' }];
          if (prod.specifications) {
            try {
              const parsed = typeof prod.specifications === 'string' 
                ? JSON.parse(prod.specifications) 
                : prod.specifications;
              if (Array.isArray(parsed) && parsed.length > 0) {
                specs = parsed;
              }
            } catch (e) {
              console.warn('Failed to parse specifications:', e);
            }
          }

          const formDataInit = {
            title: prod.title || '',
            description: prod.description || '',
            shortDescription: prod.shortDescription || '',
            categoryId: prod.categoryId || '',
            brandId: prod.brandId || '',
            condition: prod.condition || 'NEW',
            estimatedValueMin: prod.estimatedValueMin?.toString() || '',
            estimatedValueMax: prod.estimatedValueMax?.toString() || '',
            reservePrice: prod.reservePrice?.toString() || '',
            images: prod.images || [],
            specifications: specs,
            customFields: prod.customFields || {},
            status: prod.status || 'PENDING_APPROVAL',
            // Unified auction fields
            startingBid: prod.startingBid?.toString() || '',
            bidIncrement: prod.bidIncrement?.toString() || '5',
            auctionType: prod.auctionType || 'LIVE',
            startTime: prod.startTime ? new Date(prod.startTime).toISOString().slice(0, 16) : '',
            endTime: prod.endTime ? new Date(prod.endTime).toISOString().slice(0, 16) : '',
            timezone: prod.timezone || 'America/New_York',
            autoExtend: prod.autoExtend !== false,
            extensionTriggerMinutes: prod.extensionTriggerMinutes?.toString() || '5',
            extensionDurationMinutes: prod.extensionDurationMinutes?.toString() || '10',
            maxExtensions: prod.maxExtensions?.toString() || '3',
            buyNowPrice: prod.buyNowPrice?.toString() || '',
          };

          // Store original data for comparison
          setOriginalData(formDataInit);
          setFormData(formDataInit);
        }

        // Handle different API response formats for categories
        let categoriesArray = [];
        if (categoriesData.success && categoriesData.data) {
          categoriesArray = categoriesData.data.data || categoriesData.data;
        } else if (categoriesData.data) {
          categoriesArray = categoriesData.data;
        }
        setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);

        // Handle different API response formats for brands
        let brandsArray = [];
        if (brandsData.success && brandsData.data) {
          brandsArray = brandsData.data.data || brandsData.data;
        } else if (brandsData.data) {
          brandsArray = brandsData.data;
        }
        setBrands(Array.isArray(brandsArray) ? brandsArray : []);

        // Handle different API response formats for tags
        let tagsArray = [];
        if (tagsData.success && tagsData.data) {
          tagsArray = tagsData.data.data || tagsData.data;
        } else if (tagsData.data) {
          tagsArray = tagsData.data;
        }
        setTags(Array.isArray(tagsArray) ? tagsArray : []);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Remove dimension change handler as it's not needed for real product data

  const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      ),
    }));
  };

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }

      if (!file.type.match(/^image\/(png|jpg|jpeg|webp)$/)) {
        alert(`File ${file.name} is not a supported image format.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Product title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.categoryId.trim()) {
      newErrors.categoryId = 'Category is required';
    }

    if (formData.estimatedValueMin && formData.estimatedValueMax) {
      if (parseFloat(formData.estimatedValueMin) > parseFloat(formData.estimatedValueMax)) {
        newErrors.estimatedValueMax = 'Maximum value must be greater than minimum value';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Utility function to get only changed fields
  const getChangedFields = (original: any, current: any) => {
    const changes: any = {};
    
    // Deep comparison for each field
    Object.keys(current).forEach(key => {
      const currentValue = current[key];
      const originalValue = original[key];
      
      // Handle arrays (like images, specifications)
      if (Array.isArray(currentValue) && Array.isArray(originalValue)) {
        if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
          changes[key] = currentValue;
        }
      }
      // Handle objects (like customFields)
      else if (typeof currentValue === 'object' && currentValue !== null && typeof originalValue === 'object' && originalValue !== null) {
        if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
          changes[key] = currentValue;
        }
      }
      // Handle primitive values
      else if (currentValue !== originalValue) {
        changes[key] = currentValue;
      }
    });
    
    return changes;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Detect only changed fields
      const changedFields = getChangedFields(originalData, formData);
      
      // If no changes detected, show message and return
      if (Object.keys(changedFields).length === 0) {
        setSuccessMessage('No changes detected - nothing to update.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setIsSubmitting(false);
        return;
      }
      
      // Process and convert data types only for changed fields
      const processedChanges: any = {};
      
      Object.keys(changedFields).forEach(key => {
        const value = changedFields[key];
        
        switch (key) {
          case 'specifications':
            processedChanges[key] = JSON.stringify(value.filter((spec: any) => spec.key && spec.value));
            break;
          case 'estimatedValueMin':
          case 'estimatedValueMax':
          case 'reservePrice':
          case 'startingBid':
          case 'bidIncrement':
          case 'buyNowPrice':
            processedChanges[key] = value ? parseFloat(value) : null;
            break;
          case 'extensionTriggerMinutes':
          case 'extensionDurationMinutes':
          case 'maxExtensions':
            processedChanges[key] = value ? parseInt(value) : null;
            break;
          case 'startTime':
          case 'endTime':
            processedChanges[key] = value ? new Date(value).toISOString() : null;
            break;
          default:
            processedChanges[key] = value;
        }
      });
      
      console.log('Sending only changed fields:', processedChanges); // Debug log
      
      const data = await apiClient.put(`/api/products/${productId}`, processedChanges);

      if (data.success) {
        setSuccessMessage('Product updated successfully!');
        setTimeout(() => {
          router.push('/dashboard/products');
        }, 1500);
      } else {
        setErrors({ general: data.error?.message || 'Failed to update product' });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/products');
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
              Edit Product
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update product information and settings
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
                      label="Product Title"
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

                    <TextField
                      fullWidth
                      label="Short Description"
                      value={formData.shortDescription}
                      onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                      helperText="Brief summary for listings (optional)"
                    />

                    <FormControl fullWidth error={!!errors.categoryId} required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.categoryId}
                        label="Category"
                        onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.categoryId && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {errors.categoryId}
                        </Typography>
                      )}
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Brand</InputLabel>
                      <Select
                        value={formData.brandId}
                        label="Brand"
                        onChange={(e) => handleInputChange('brandId', e.target.value)}
                      >
                        <MenuItem value="">
                          <em>No Brand</em>
                        </MenuItem>
                        {brands.map((brand) => (
                          <MenuItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

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
                  </Stack>
                </Card>

                {/* Valuation */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Estimated Value
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Minimum Value"
                        type="number"
                        value={formData.estimatedValueMin}
                        onChange={(e) => handleInputChange('estimatedValueMin', e.target.value)}
                        error={!!errors.estimatedValueMin}
                        helperText={errors.estimatedValueMin || 'Estimated minimum value'}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Maximum Value"
                        type="number"
                        value={formData.estimatedValueMax}
                        onChange={(e) => handleInputChange('estimatedValueMax', e.target.value)}
                        error={!!errors.estimatedValueMax}
                        helperText={errors.estimatedValueMax || 'Estimated maximum value'}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Reserve Price"
                        type="number"
                        value={formData.reservePrice}
                        onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                        error={!!errors.reservePrice}
                        helperText={errors.reservePrice || 'Minimum acceptable auction bid (optional)'}
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
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Starting Bid"
                        type="number"
                        value={formData.startingBid}
                        onChange={(e) => handleInputChange('startingBid', e.target.value)}
                        error={!!errors.startingBid}
                        helperText={errors.startingBid || 'Initial bid amount'}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Bid Increment"
                        type="number"
                        value={formData.bidIncrement}
                        onChange={(e) => handleInputChange('bidIncrement', e.target.value)}
                        error={!!errors.bidIncrement}
                        helperText={errors.bidIncrement || 'Minimum bid increase amount'}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Buy Now Price"
                        type="number"
                        value={formData.buyNowPrice}
                        onChange={(e) => handleInputChange('buyNowPrice', e.target.value)}
                        error={!!errors.buyNowPrice}
                        helperText={errors.buyNowPrice || 'Instant purchase price (optional)'}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Auction Type</InputLabel>
                        <Select
                          value={formData.auctionType}
                          label="Auction Type"
                          onChange={(e) => handleInputChange('auctionType', e.target.value)}
                        >
                          <MenuItem value="LIVE">Live Auction</MenuItem>
                          <MenuItem value="SEALED">Sealed Bid</MenuItem>
                          <MenuItem value="RESERVE">Reserve Auction</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Start Time"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                        error={!!errors.startTime}
                        helperText={errors.startTime || 'When the auction begins'}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="End Time"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                        error={!!errors.endTime}
                        helperText={errors.endTime || 'When the auction ends'}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Auto-Extension Settings
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.autoExtend}
                            onChange={(e) => handleInputChange('autoExtend', e.target.checked)}
                          />
                        }
                        label="Enable automatic auction extension"
                      />
                    </Grid>
                    {formData.autoExtend && (
                      <>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Extension Trigger"
                            type="number"
                            value={formData.extensionTriggerMinutes}
                            onChange={(e) => handleInputChange('extensionTriggerMinutes', e.target.value)}
                            error={!!errors.extensionTriggerMinutes}
                            helperText="Minutes before end to trigger extension"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">min</InputAdornment>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Extension Duration"
                            type="number"
                            value={formData.extensionDurationMinutes}
                            onChange={(e) => handleInputChange('extensionDurationMinutes', e.target.value)}
                            error={!!errors.extensionDurationMinutes}
                            helperText="Minutes to extend the auction"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">min</InputAdornment>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Max Extensions"
                            type="number"
                            value={formData.maxExtensions}
                            onChange={(e) => handleInputChange('maxExtensions', e.target.value)}
                            error={!!errors.maxExtensions}
                            helperText="Maximum number of extensions"
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Card>

                {/* Status */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Status
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
                      <MenuItem value="APPROVED">Approved</MenuItem>
                      <MenuItem value="REJECTED">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Card>

                {/* Specifications */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Specifications
                  </Typography>
                  <Stack spacing={2}>
                    {formData.specifications.map((spec, index) => (
                      <Grid container spacing={2} key={index}>
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            label="Specification"
                            value={spec.key}
                            onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                            placeholder="e.g., Screen Size"
                          />
                        </Grid>
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            label="Value"
                            value={spec.value}
                            onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                            placeholder="e.g., 6.7 inches"
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <IconButton 
                            onClick={() => removeSpecification(index)}
                            disabled={formData.specifications.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                    <Button
                      startIcon={<AddIcon />}
                      onClick={addSpecification}
                      variant="outlined"
                      size="small"
                    >
                      Add Specification
                    </Button>
                  </Stack>
                </Card>
              </Stack>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Images */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Product Images
                  </Typography>
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpg,image/jpeg,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  
                  {/* Upload area */}
                  <Box
                    onClick={handleImageUpload}
                    sx={{
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to upload or drag and drop
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PNG, JPG, WEBP up to 5MB (Max 10 images)
                    </Typography>
                  </Box>
                  
                  {/* Current Images */}
                  {formData.images && formData.images.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Current Images ({formData.images.length})
                      </Typography>
                      <Grid container spacing={1}>
                        {formData.images.map((image, index) => (
                          <Grid item xs={6} key={index}>
                            <Box
                              sx={{
                                position: 'relative',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                overflow: 'hidden',
                                aspectRatio: '1',
                              }}
                            >
                              <Box
                                component="img"
                                src={image}
                                alt={`Product ${index + 1}`}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeImage(index)}
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  backgroundColor: 'background.paper',
                                  '&:hover': {
                                    backgroundColor: 'error.light',
                                    color: 'error.contrastText',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Card>

                {/* Custom Fields */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Additional Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Product-specific custom fields and metadata will be managed here.
                  </Typography>
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
                    {isSubmitting ? 'Updating...' : 'Update Product'}
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