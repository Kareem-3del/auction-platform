'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useLocale } from 'src/hooks/useLocale';
import { productsAPI, categoriesAPI } from 'src/lib/api-client';

import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Chip,
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
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import ImageUpload from 'src/components/common/ImageUpload';

export default function CreateProductPage() {
  const router = useRouter();
  const { t } = useLocale();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    condition: 'NEW' as 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR',
    location: '',
    estimatedValueMin: '',
    estimatedValueMax: '',
    reservePrice: '',
    provenance: '',
    dimensions: '',
    weight: '',
    materials: '',
    authenticity: '',
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
        // Use direct fetch to bypass potential API client issues
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

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Product title is required';
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

    if (!formData.estimatedValueMin || parseFloat(formData.estimatedValueMin) <= 0) {
      newErrors.estimatedValueMin = 'Minimum estimated value is required';
    }

    if (!formData.estimatedValueMax || parseFloat(formData.estimatedValueMax) <= 0) {
      newErrors.estimatedValueMax = 'Maximum estimated value is required';
    }

    if (parseFloat(formData.estimatedValueMax) < parseFloat(formData.estimatedValueMin)) {
      newErrors.estimatedValueMax = 'Maximum value must be greater than minimum value';
    }

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
      const productData = {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        condition: formData.condition,
        location: formData.location,
        images: images,
        estimatedValueMin: parseFloat(formData.estimatedValueMin),
        estimatedValueMax: parseFloat(formData.estimatedValueMax),
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
        provenance: formData.provenance || undefined,
        dimensions: formData.dimensions || undefined,
        weight: formData.weight || undefined,
        materials: formData.materials || undefined,
        authenticity: formData.authenticity || undefined,
      };

      const result = await productsAPI.createProduct(productData);

      if (result.success) {
        setSuccessMessage('Product created successfully! It will be reviewed before going live.');
        
        // Redirect after success
        setTimeout(() => {
          router.push('/dashboard/products');
        }, 2000);
      } else {
        setErrors({ submit: result.error?.message || 'Failed to create product' });
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/products');
  };

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
              Create New Product
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a new product to your auction inventory
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
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.submit}
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

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required error={!!errors.categoryId}>
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={formData.categoryId}
                            label="Category"
                            onChange={(e) => handleInputChange('categoryId', e.target.value)}
                            disabled={loadingCategories}
                          >
                            {loadingCategories ? (
                              <MenuItem disabled>Loading categories...</MenuItem>
                            ) : categories.length === 0 ? (
                              <MenuItem disabled>No categories available</MenuItem>
                            ) : (
                              categories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                  {category.name}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                          {errors.categoryId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                              {errors.categoryId}
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Location"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          error={!!errors.location}
                          helperText={errors.location}
                          required
                          placeholder="City, Country"
                        />
                      </Grid>
                    </Grid>

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

                {/* Estimated Value */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Estimated Value
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Provide the estimated market value range for this item
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Minimum Value"
                        type="number"
                        value={formData.estimatedValueMin}
                        onChange={(e) => handleInputChange('estimatedValueMin', e.target.value)}
                        error={!!errors.estimatedValueMin}
                        helperText={errors.estimatedValueMin}
                        required
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Maximum Value"
                        type="number"
                        value={formData.estimatedValueMax}
                        onChange={(e) => handleInputChange('estimatedValueMax', e.target.value)}
                        error={!!errors.estimatedValueMax}
                        helperText={errors.estimatedValueMax}
                        required
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Reserve Price (Optional)"
                        type="number"
                        value={formData.reservePrice}
                        onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                        error={!!errors.reservePrice}
                        helperText={errors.reservePrice || 'Minimum price to accept'}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Card>

                {/* Additional Details */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Additional Details
                  </Typography>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Provenance"
                      value={formData.provenance}
                      onChange={(e) => handleInputChange('provenance', e.target.value)}
                      placeholder="History and origin of the item"
                      multiline
                      rows={2}
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Dimensions"
                          value={formData.dimensions}
                          onChange={(e) => handleInputChange('dimensions', e.target.value)}
                          placeholder="Length x Width x Height"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Weight"
                          value={formData.weight}
                          onChange={(e) => handleInputChange('weight', e.target.value)}
                          placeholder="Weight and unit"
                        />
                      </Grid>
                    </Grid>
                    <TextField
                      fullWidth
                      label="Materials"
                      value={formData.materials}
                      onChange={(e) => handleInputChange('materials', e.target.value)}
                      placeholder="Materials used in construction"
                    />
                    <TextField
                      fullWidth
                      label="Authenticity"
                      value={formData.authenticity}
                      onChange={(e) => handleInputChange('authenticity', e.target.value)}
                      placeholder="Certificates, signatures, authentication details"
                      multiline
                      rows={2}
                    />
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
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Upload up to 10 images for your product. The first image will be the main image.
                  </Typography>
                  
                  {/* Image Upload Grid */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 2 }}>
                    {/* Existing Images */}
                    {images.map((imageUrl, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <ImageUpload
                          currentImageUrl={imageUrl}
                          onImageChange={(url) => {
                            if (url) {
                              setImages(prev => prev.map((img, i) => i === index ? url : img));
                            } else {
                              setImages(prev => prev.filter((_, i) => i !== index));
                            }
                          }}
                          uploadType="product"
                          variant="rectangle"
                          size="medium"
                          allowRemove={true}
                        />
                        {index === 0 && (
                          <Chip
                            label="Main"
                            size="small"
                            color="primary"
                            sx={{
                              position: 'absolute',
                              bottom: -8,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                      </Box>
                    ))}
                    
                    {/* Add New Image Button */}
                    {images.length < 10 && (
                      <ImageUpload
                        onImageChange={(url) => {
                          if (url) {
                            setImages(prev => [...prev, url]);
                          }
                        }}
                        uploadType="product"
                        variant="rectangle"
                        size="medium"
                        allowRemove={false}
                      />
                    )}
                  </Box>
                  
                  {/* Help Text */}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Supported formats: JPEG, PNG, WebP (max 5MB per image)
                  </Typography>
                </Card>

                {/* Images Validation Error */}
                {errors.images && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {errors.images}
                  </Alert>
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
                    {isSubmitting ? 'Creating Product...' : 'Create Product'}
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